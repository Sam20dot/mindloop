'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { generateRoadmap, getRoadmaps } from '@/lib/api';
import type { Roadmap } from '@/types';
import { Loader } from '@/components/ui/Loader';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { RoadmapViewer } from '@/components/career/RoadmapViewer';

export default function CareerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(true);
  const [skillInput, setSkillInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [points, setPoints] = useState<number>(0);
  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(null);

  const token = (session as any)?.accessToken as string;
  const userId = (session?.user as any)?.id as string;

  const loadRoadmaps = useCallback(async () => {
    if (!token || !userId) return;
    setLoadingRoadmaps(true);
    try {
      const data = await getRoadmaps(token, userId);
      setRoadmaps(data);
      if (data.length > 0 && !activeRoadmapId) {
        setActiveRoadmapId(data[0].id);
      }
    } catch {
      // ignore
    } finally {
      setLoadingRoadmaps(false);
    }
  }, [token, userId, activeRoadmapId]);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return; }
    if (status === 'authenticated') {
      setPoints((session?.user as any)?.points ?? 0);
      loadRoadmaps();
    }
  }, [status, loadRoadmaps, router, session]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!skillInput.trim()) return;
    setGenerating(true);
    setError('');
    try {
      const data: Roadmap = await generateRoadmap(token, skillInput.trim());
      setRoadmaps((prev) => [data, ...prev]);
      setActiveRoadmapId(data.id);
      setSkillInput('');
    } catch (err: any) {
      setError(err.message || 'Failed to generate roadmap. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  const activeRoadmap = roadmaps.find((r) => r.id === activeRoadmapId) ?? null;

  if (status === 'loading' || loadingRoadmaps) {
    return <div className="min-h-screen flex items-center justify-center"><Loader message="Loading your roadmaps..." /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <a href="/dashboard" className="text-xl font-bold text-indigo-700">MindLoop</a>
        <div className="flex items-center gap-3">
          <PointsBadge points={points} />
          <span className="text-sm text-gray-600">{session?.user?.name}</span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Career Roadmap</h1>
          <p className="text-gray-500 text-sm mt-1">Generate a step-by-step learning plan for any skill.</p>
        </div>

        {/* Generate form */}
        <form onSubmit={handleGenerate} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Skill to learn</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="e.g. Python, Machine Learning, SQL..."
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={generating}
            />
            <button
              type="submit"
              disabled={!skillInput.trim() || generating}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm whitespace-nowrap"
            >
              Generate Roadmap
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </form>

        {generating && <Loader message="Claude is building your roadmap..." />}

        {/* Saved roadmap tabs */}
        {roadmaps.length > 0 && !generating && (
          <>
            {roadmaps.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {roadmaps.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setActiveRoadmapId(r.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      r.id === activeRoadmapId
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-indigo-300'
                    }`}
                  >
                    {r.skill_name}
                  </button>
                ))}
              </div>
            )}

            {activeRoadmap && <RoadmapViewer roadmap={activeRoadmap} token={token} />}
          </>
        )}

        {/* Empty state */}
        {roadmaps.length === 0 && !generating && (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <p className="text-4xl mb-4">🗺️</p>
            <p className="text-gray-500 text-sm">
              Type a skill above and click Generate Roadmap to get your personalized learning plan.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
