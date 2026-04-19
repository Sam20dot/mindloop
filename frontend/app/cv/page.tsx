'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { generateCV, getMyCV } from '@/lib/api';
import type { CVEntry } from '@/types';
import { Loader } from '@/components/ui/Loader';
import { CVViewer } from '@/components/cv/CVViewer';
import { BadgePopup } from '@/components/ui/BadgePopup';

export default function CVPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [cv, setCv] = useState<CVEntry | null>(null);
  const [loadingCv, setLoadingCv] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const token = (session as any)?.accessToken as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status !== 'authenticated') return;

    // 10-second hard timeout so the spinner can never be infinite
    timeoutRef.current = setTimeout(() => {
      setLoadingCv(false);
      setLoadError('Loading timed out. Please refresh the page.');
    }, 10_000);

    async function load() {
      try {
        const data = await getMyCV(token);
        if (data.exists && data.cv) {
          setCv(data.cv as CVEntry);
        }
        // data.exists === false → no CV yet, stay on empty state (normal)
      } catch (err: any) {
        setLoadError(err.message || 'Failed to load your CV. Please refresh.');
      } finally {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setLoadingCv(false);
      }
    }

    load();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerate() {
    setGenerating(true);
    setGenError('');
    try {
      const data = await generateCV(token);
      setCv(data as CVEntry);
      if ((data as any).new_badges?.length > 0) {
        setNewBadges((data as any).new_badges);
      }
    } catch (err: any) {
      setGenError(err.message || 'Failed to generate CV. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  // ── Auth loading ──────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader message="Checking your session..." />
      </div>
    );
  }

  // ── CV loading ────────────────────────────────────────────────────────────
  if (loadingCv) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader message="Loading your CV..." />
      </div>
    );
  }

  // ── Load error ────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 gap-4">
        <p className="text-red-600 text-sm">{loadError}</p>
        <button
          onClick={() => { setLoadError(''); setLoadingCv(true); window.location.reload(); }}
          className="text-sm bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Page header + action buttons */}
        <div className="flex items-start justify-between mb-6 print:hidden gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My CV</h1>
            <p className="text-gray-500 text-sm mt-1">
              AI-generated from your skills and learning history.
            </p>
          </div>
          {cv && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleCopyLink}
                className="text-sm border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                {copied ? '✓ Copied!' : '🔗 Copy link'}
              </button>
              <button
                onClick={handlePrint}
                className="text-sm border border-indigo-300 hover:border-indigo-500 text-indigo-700 px-4 py-2 rounded-lg transition-colors"
              >
                🖨️ Export PDF
              </button>
            </div>
          )}
        </div>

        {/* Generate / regenerate button */}
        <div className="mb-6 print:hidden">
          {generating ? (
            <Loader message="Claude is writing your CV..." />
          ) : (
            <button
              onClick={handleGenerate}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {cv ? '🔄 Regenerate CV' : '✨ Generate My CV'}
            </button>
          )}
          {genError && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {genError}
            </div>
          )}
        </div>

        {/* CV exists → show it */}
        {cv && <CVViewer cv={cv} userName={session?.user?.name ?? ''} />}

        {/* No CV yet and not currently generating → guide the user */}
        {!cv && !generating && (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center space-y-3">
            <p className="text-5xl">📄</p>
            <p className="font-semibold text-gray-700">You haven't generated your CV yet.</p>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Click "Generate My CV" above to create your profile.
              Complete at least one learning session first for the best results.
            </p>
          </div>
        )}
      </main>

      {newBadges.length > 0 && (
        <BadgePopup badges={newBadges} onDismiss={() => setNewBadges([])} />
      )}
    </div>
  );
}
