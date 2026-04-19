'use client';

import { useRef, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { startSession, extractTextFromFile } from '@/lib/api';
import type { LearningSession } from '@/types';
import { Loader } from '@/components/ui/Loader';
import { LearningSession as LearningSessionView } from '@/components/learning/LearningSession';

export default function LearnPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [topic, setTopic] = useState(searchParams.get('topic') ?? '');
  const [material, setMaterial] = useState(searchParams.get('material') ?? '');
  const [uploadedFilename, setUploadedFilename] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [fileError, setFileError] = useState('');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [activeSession, setActiveSession] = useState<LearningSession | null>(null);
  const [points, setPoints] = useState<number>((session?.user as any)?.points ?? 0); // eslint-disable-line @typescript-eslint/no-unused-vars

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;
  if (status === 'unauthenticated') { router.push('/auth/login'); return null; }

  const token = (session as any)?.accessToken as string;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError('');
    setUploadedFilename('');

    const name = file.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.txt')) {
      setFileError('Only .pdf and .txt files are supported.');
      e.target.value = '';
      return;
    }

    if (name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setMaterial((ev.target?.result as string) ?? '');
        setUploadedFilename(file.name);
      };
      reader.readAsText(file);
      return;
    }

    // PDF — send to backend
    setExtracting(true);
    try {
      const { text } = await extractTextFromFile(token, file);
      setMaterial(text);
      setUploadedFilename(file.name);
    } catch (err: any) {
      setFileError(err.message || 'Failed to extract text from PDF.');
    } finally {
      setExtracting(false);
      e.target.value = '';
    }
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || !material.trim()) return;
    setStarting(true);
    setError('');
    try {
      const data: LearningSession = await startSession(token, topic.trim(), material.trim());
      setActiveSession(data);
    } catch (err: any) {
      setError(err.message || 'Failed to start session. Please try again.');
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 py-8">
        {!activeSession ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Start a Learning Session</h1>
              <p className="text-gray-500 mt-1 text-sm">
                Enter a topic, then type or upload your study material. Claude will generate questions from it.
              </p>
            </div>

            <form onSubmit={handleStart} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm">
              {/* Topic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Python for Data Science"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Study Material */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Study Material</label>
                <textarea
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="Paste or type your study material here. The more detail you provide, the better the questions will be."
                  rows={8}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  required
                />

                {/* File Upload */}
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={extracting}
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
                  >
                    <span>📎</span>
                    <span>{extracting ? 'Reading file...' : 'Upload PDF or TXT file'}</span>
                  </button>

                  {extracting && (
                    <div className="mt-2">
                      <Loader message="Extracting text from your file..." />
                    </div>
                  )}

                  {uploadedFilename && !extracting && (
                    <p className="mt-2 text-xs text-green-700 flex items-center gap-1">
                      <span>✓</span>
                      <span><strong>{uploadedFilename}</strong> loaded — you can edit the text above before starting.</span>
                    </p>
                  )}

                  {fileError && (
                    <p className="mt-2 text-xs text-red-600">{fileError}</p>
                  )}

                  <p className="mt-1 text-xs text-gray-400">Supported: .pdf, .txt</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {starting ? (
                <Loader message="Starting your session..." />
              ) : (
                <button
                  type="submit"
                  disabled={!topic.trim() || !material.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Start Session
                </button>
              )}
            </form>
          </>
        ) : (
          <LearningSessionView
            session={activeSession}
            token={token}
            onPointsChange={setPoints}
          />
        )}
      </main>
    </div>
  );
}
