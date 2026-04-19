'use client';

import { useState } from 'react';
import type { User, LearningSession, Badge, Skill, OpportunityStats, LeaderboardEntry, MyRanks, WeeklyChallenge } from '@/types';

const BADGE_ICONS: Record<string, string> = {
  'Quick Learner': '⚡',
  'Focus Master': '🎯',
  'Consistent Student': '🔥',
  'Skill Builder': '🛠️',
  'Opportunity Seeker': '🌍',
};

const LEVEL_COLORS: Record<string, string> = {
  beginner:     'bg-gray-100 text-gray-700',
  explorer:     'bg-blue-100 text-blue-700',
  learner:      'bg-cyan-100 text-cyan-700',
  achiever:     'bg-green-100 text-green-700',
  expert:       'bg-orange-100 text-orange-700',
  master:       'bg-purple-100 text-purple-700',
};

const SKILL_LEVEL_COLORS: Record<string, string> = {
  beginner:     'bg-blue-100 text-blue-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced:     'bg-green-100 text-green-700',
};

const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

interface Props {
  user: User;
  sessions: LearningSession[];
  badges: Badge[];
  skills: Skill[];
  token: string;
  opportunityStats: OpportunityStats;
  topPlayers: LeaderboardEntry[];
  myRanks: MyRanks | null;
  weeklyChallenge: WeeklyChallenge | null;
  materialCount: number;
  applicationCount: number;
  roadmapPct: number;
}

export function DashboardClient({
  user, sessions, badges, skills, opportunityStats,
  topPlayers, myRanks, weeklyChallenge,
  materialCount, applicationCount, roadmapPct,
}: Props) {
  const [points] = useState(user.points);
  const completedSessions = sessions.filter((s) => s.status === 'completed');

  const streak = (user as any).current_streak ?? 0;
  const longestStreak = (user as any).longest_streak ?? 0;

  const challengeProgress = weeklyChallenge
    ? Math.min(100, Math.round((weeklyChallenge.completed_sessions / weeklyChallenge.target_sessions) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user.name.split(' ')[0]}!</h2>
          <p className="text-gray-500 mt-1">Ready to learn something new today?</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Points" value={String(points)} color="indigo" />
          <StatCard label="Level" value={user.level} color="green" />
          <StatCard label="Sessions" value={String(completedSessions.length)} color="blue" />
          <StatCard label="Skills" value={String(skills.length)} color="purple" />
        </div>

        {/* Streak + Challenge row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Streak widget */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🔥</span>
              <div>
                <p className="text-3xl font-bold text-gray-900">{streak}</p>
                <p className="text-xs text-gray-500">Day streak</p>
              </div>
            </div>
            <p className="text-xs text-gray-400">Longest: {longestStreak} days</p>
            {streak === 0 && (
              <p className="text-xs text-orange-500 mt-1">Complete a session today to start your streak!</p>
            )}
          </div>

          {/* Weekly challenge widget */}
          {weeklyChallenge ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800 text-sm">Weekly Challenge</h4>
                {weeklyChallenge.bonus_awarded && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Completed!</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-3">{weeklyChallenge.title}</p>
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{weeklyChallenge.completed_sessions}/{weeklyChallenge.target_sessions} sessions</span>
                  <span>{challengeProgress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${challengeProgress}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-indigo-600 font-medium">+{weeklyChallenge.bonus_points} bonus pts on completion</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-center">
              <p className="text-sm text-gray-400">No active challenge this week</p>
            </div>
          )}
        </div>

        {/* Opportunity stats */}
        <div className="grid grid-cols-2 gap-4">
          <a href="/opportunities" className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-indigo-300 transition-colors shadow-sm">
            <span className="text-3xl">🎯</span>
            <div>
              <p className="text-2xl font-bold text-gray-900">{opportunityStats.matched_count}</p>
              <p className="text-xs text-gray-500">Matched Opportunities</p>
            </div>
          </a>
          <a href="/opportunities/saved" className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-indigo-300 transition-colors shadow-sm">
            <span className="text-3xl">🔖</span>
            <div>
              <p className="text-2xl font-bold text-gray-900">{opportunityStats.saved_count}</p>
              <p className="text-xs text-gray-500">Saved Opportunities</p>
            </div>
          </a>
        </div>

        {/* Library / Jobs / Roadmap widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/library" className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-indigo-300 transition-colors shadow-sm">
            <span className="text-3xl">🗂️</span>
            <div>
              <p className="text-2xl font-bold text-gray-900">{materialCount}</p>
              <p className="text-xs text-gray-500">Library Materials</p>
            </div>
          </a>
          <a href="/opportunities" className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-indigo-300 transition-colors shadow-sm">
            <span className="text-3xl">💼</span>
            <div>
              <p className="text-2xl font-bold text-gray-900">{applicationCount}</p>
              <p className="text-xs text-gray-500">Job Applications</p>
            </div>
          </a>
          <a href="/career" className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-colors shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🗺️</span>
              <div>
                <p className="text-2xl font-bold text-gray-900">{roadmapPct}%</p>
                <p className="text-xs text-gray-500">Roadmap Progress</p>
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${roadmapPct}%` }} />
            </div>
          </a>
        </div>

        {/* Leaderboard mini-widget */}
        {topPlayers.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Top Learners</h3>
              <a href="/leaderboard" className="text-xs text-indigo-600 hover:underline">Full leaderboard →</a>
            </div>
            <div className="space-y-2">
              {topPlayers.map(p => (
                <div key={p.user_id} className="flex items-center gap-3">
                  <span className="text-lg w-7 text-center">{RANK_MEDAL[p.rank] ?? `#${p.rank}`}</span>
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {p.initials}
                  </div>
                  <span className="flex-1 text-sm text-gray-800 truncate">{p.name}</span>
                  <span className="text-sm font-bold text-gray-900">{p.value.toLocaleString()} pts</span>
                </div>
              ))}
            </div>
            {myRanks?.points_rank && (
              <p className="text-xs text-indigo-600 mt-3 text-center">
                Your rank: #{myRanks.points_rank} of {myRanks.total_users} learners
              </p>
            )}
          </div>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Badges Earned</h3>
            <div className="flex flex-wrap gap-3">
              {badges.map((b) => (
                <div key={b.id} className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                  <span className="text-xl">{BADGE_ICONS[b.name] ?? '🏅'}</span>
                  <span className="text-sm font-medium text-yellow-800">{b.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Skills Earned</h3>
              <a href="/cv" className="text-xs text-indigo-600 hover:underline">View CV →</a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {skills.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-2xl">🧠</div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{s.name}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SKILL_LEVEL_COLORS[s.level] ?? SKILL_LEVEL_COLORS.beginner}`}>
                      {s.level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionCard title="Start Learning" description="Pick a topic and generate AI-powered questions" href="/learn" color="indigo" />
          <ActionCard title="Career Roadmap" description="Get a step-by-step learning plan for any skill" href="/career" color="blue" />
          <ActionCard title="My CV" description="View and export your AI-generated career profile" href="/cv" color="green" />
          <ActionCard title="Opportunities" description="Find jobs and freelance gigs matching your skills" href="/opportunities" color="purple" />
          <ActionCard title="Community" description="Share achievements and see what others are learning" href="/community" color="pink" />
          <ActionCard title="Leaderboard" description="See how you rank against other learners globally" href="/leaderboard" color="amber" />
        </div>

        {/* Recent sessions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Sessions</h3>
          {sessions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              No learning sessions yet.{' '}
              <a href="/learn" className="text-indigo-600 underline">Start your first session!</a>
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {sessions.slice(0, 5).map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{s.topic}</p>
                    <p className="text-xs text-gray-400">{new Date(s.started_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    s.status === 'completed' ? 'bg-green-100 text-green-700' :
                    s.status === 'active'    ? 'bg-blue-100 text-blue-700'  :
                                               'bg-gray-100 text-gray-500'
                  }`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    green:  'bg-green-50 border-green-200 text-green-700',
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };
  return (
    <div className={`${colors[color]} border rounded-xl p-4 text-center`}>
      <p className="text-2xl font-bold capitalize">{value}</p>
      <p className="text-xs mt-1 opacity-75">{label}</p>
    </div>
  );
}

function ActionCard({ title, description, href, color }: {
  title: string; description: string; href: string; color: string;
}) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    green:  'bg-green-600 hover:bg-green-700',
    blue:   'bg-blue-600 hover:bg-blue-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    pink:   'bg-pink-600 hover:bg-pink-700',
    amber:  'bg-amber-600 hover:bg-amber-700',
  };
  return (
    <a href={href} className={`${colors[color] ?? 'bg-gray-600 hover:bg-gray-700'} text-white rounded-xl p-5 block transition-colors`}>
      <h4 className="font-semibold text-lg">{title}</h4>
      <p className="text-sm opacity-80 mt-1">{description}</p>
    </a>
  );
}
