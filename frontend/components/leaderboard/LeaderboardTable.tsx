'use client';

import { LeaderboardEntry } from '@/types';

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-gray-100 text-gray-700',
  explorer: 'bg-blue-100 text-blue-700',
  learner: 'bg-cyan-100 text-cyan-700',
  achiever: 'bg-green-100 text-green-700',
  expert: 'bg-orange-100 text-orange-700',
  master: 'bg-purple-100 text-purple-700',
};

const RANK_STYLES: Record<number, string> = {
  1: 'bg-yellow-400 text-white',
  2: 'bg-gray-300 text-gray-800',
  3: 'bg-amber-600 text-white',
};

interface Props {
  entries: LeaderboardEntry[];
  valueLabel: string;
  currentUserId?: string;
}

export default function LeaderboardTable({ entries, valueLabel, currentUserId }: Props) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-3">🏆</div>
        <p>No data yet. Start learning to appear here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map(entry => {
        const isMe = entry.user_id === currentUserId;
        return (
          <div
            key={entry.user_id}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
              isMe ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
              RANK_STYLES[entry.rank] ?? 'bg-gray-100 text-gray-700'
            }`}>
              {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
            </div>

            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {entry.initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 text-sm truncate">
                  {entry.name} {isMe && <span className="text-indigo-600 font-normal">(you)</span>}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${LEVEL_COLORS[entry.level] ?? 'bg-gray-100 text-gray-700'}`}>
                  {entry.level}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="font-bold text-gray-900">{entry.value.toLocaleString()}</div>
              <div className="text-xs text-gray-400">{valueLabel}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
