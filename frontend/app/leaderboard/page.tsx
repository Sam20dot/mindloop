'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getLeaderboardPoints, getLeaderboardSkills, getLeaderboardWeekly, getMyRanks } from '@/lib/api';
import { LeaderboardEntry, MyRanks } from '@/types';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';

type Tab = 'points' | 'skills' | 'weekly';

const TABS: { key: Tab; label: string; valueLabel: string; emoji: string }[] = [
  { key: 'points', label: 'All Time', valueLabel: 'pts', emoji: '🏆' },
  { key: 'skills', label: 'Skills', valueLabel: 'skills', emoji: '🎯' },
  { key: 'weekly', label: 'This Week', valueLabel: 'pts', emoji: '📅' },
];

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const token = (session as any)?.accessToken as string;
  const userId = (session as any)?.user?.id as string | undefined;

  const [tab, setTab] = useState<Tab>('points');
  const [data, setData] = useState<Record<Tab, LeaderboardEntry[]>>({ points: [], skills: [], weekly: [] });
  const [myRanks, setMyRanks] = useState<MyRanks | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      getLeaderboardPoints(token),
      getLeaderboardSkills(token),
      getLeaderboardWeekly(token),
      getMyRanks(token),
    ]).then(([pts, skills, weekly, ranks]) => {
      setData({ points: pts, skills, weekly });
      setMyRanks(ranks);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const currentTab = TABS.find(t => t.key === tab)!;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-gray-500 text-sm mt-1">See how you rank against other learners</p>
        </div>

        {/* My Ranks Summary */}
        {myRanks && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <div className="text-xl font-bold text-indigo-600">
                {myRanks.points_rank ? `#${myRanks.points_rank}` : '-'}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">All Time</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <div className="text-xl font-bold text-indigo-600">
                {myRanks.skills_rank ? `#${myRanks.skills_rank}` : '-'}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">Skills</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <div className="text-xl font-bold text-indigo-600">
                {myRanks.weekly_rank ? `#${myRanks.weekly_rank}` : '-'}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">This Week</div>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === t.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-3 animate-pulse flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <div className="w-9 h-9 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-1" />
                </div>
                <div className="h-5 bg-gray-200 rounded w-12" />
              </div>
            ))}
          </div>
        ) : (
          <LeaderboardTable
            entries={data[tab]}
            valueLabel={currentTab.valueLabel}
            currentUserId={userId}
          />
        )}
      </div>
    </div>
  );
}
