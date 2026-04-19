'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getSavedOpportunities, unsaveOpportunity } from '@/lib/api';
import type { SavedOpportunity } from '@/types';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { SavedOpportunityCard } from '@/components/opportunities/SavedOpportunityCard';
import { Loader } from '@/components/ui/Loader';

export default function SavedOpportunitiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [saved, setSaved] = useState<SavedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<number>(0);

  const token = (session as any)?.accessToken as string;

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return; }
    if (status !== 'authenticated') return;

    setPoints((session?.user as any)?.points ?? 0);

    getSavedOpportunities(token)
      .then((data) => setSaved(Array.isArray(data) ? data : []))
      .catch(() => setSaved([]))
      .finally(() => setLoading(false));
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUnsave(opportunityId: string) {
    setSaved((prev) => prev.filter((o) => o.opportunity_id !== opportunityId));
    try {
      await unsaveOpportunity(token, opportunityId);
    } catch {
      // If it fails, reload from server to restore accurate state
      const data = await getSavedOpportunities(token).catch(() => []);
      setSaved(Array.isArray(data) ? data : []);
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader message="Checking your session..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <a href="/dashboard" className="text-xl font-bold text-indigo-700">MindLoop</a>
        <div className="flex items-center gap-3">
          <PointsBadge points={points} />
          <a href="/opportunities" className="text-xs text-gray-500 hover:text-indigo-600 font-medium">
            All Opportunities
          </a>
          <span className="text-sm text-gray-600">{session?.user?.name}</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Saved Opportunities</h1>
          <p className="text-gray-500 text-sm mt-1">Opportunities you bookmarked for later.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader message="Loading your saved opportunities..." />
          </div>
        ) : saved.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center space-y-3">
            <p className="text-4xl">🔖</p>
            <p className="font-semibold text-gray-700">No saved opportunities yet.</p>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Browse opportunities and click the bookmark icon to save them here.
            </p>
            <a href="/opportunities" className="inline-block mt-2 text-sm text-indigo-600 underline">
              Browse opportunities →
            </a>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{saved.length} saved</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {saved.map((opp) => (
                <SavedOpportunityCard key={opp.id} opportunity={opp} onUnsave={handleUnsave} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
