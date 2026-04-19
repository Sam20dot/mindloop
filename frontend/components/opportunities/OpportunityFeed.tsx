'use client';

import { useState, useMemo } from 'react';
import type { MatchedOpportunity, Skill } from '@/types';
import { OpportunityCard } from './OpportunityCard';
import { Loader } from '@/components/ui/Loader';

type TypeFilter = 'all' | 'freelance' | 'internship' | 'entry-level';
type SortOrder = 'match' | 'newest' | 'entry-first';

const TYPE_BUTTONS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'freelance', label: 'Freelance' },
  { key: 'internship', label: 'Internship' },
  { key: 'entry-level', label: 'Entry Level' },
];

interface Props {
  opportunities: MatchedOpportunity[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
  refreshing: boolean;
  onView: (id: string) => void;
  userSkills: Skill[];
  token: string;
}

export function OpportunityFeed({
  opportunities, loading, error, onRefresh, refreshing, onView, userSkills, token,
}: Props) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [skillFilter, setSkillFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('match');

  const filtered = useMemo(() => {
    let list = [...opportunities];

    if (typeFilter !== 'all') {
      list = list.filter((o) => o.type === typeFilter);
    }

    if (skillFilter) {
      const needle = skillFilter.toLowerCase();
      list = list.filter((o) =>
        o.skill_tags.some((tag) => tag.toLowerCase().includes(needle))
      );
    }

    if (sortOrder === 'match') {
      list.sort((a, b) => b.match_score - a.match_score);
    } else if (sortOrder === 'newest') {
      list.sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime());
    } else if (sortOrder === 'entry-first') {
      list.sort((a, b) => {
        const order: Record<string, number> = { 'entry-level': 0, internship: 1, freelance: 2 };
        return (order[a.type] ?? 3) - (order[b.type] ?? 3);
      });
    }

    return list;
  }, [opportunities, typeFilter, skillFilter, sortOrder]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader message="Claude is matching opportunities to your skills..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
        <p className="text-red-700 text-sm">{error}</p>
        <button
          onClick={onRefresh}
          className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center space-y-3">
        <p className="text-5xl">🎯</p>
        <p className="font-semibold text-gray-700">No matched opportunities yet.</p>
        <p className="text-gray-400 text-sm max-w-sm mx-auto">
          Complete a learning session first to unlock opportunities matched to your skills.
        </p>
        <a href="/learn" className="inline-block mt-2 text-sm text-indigo-600 underline">
          Start a learning session →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        {/* Type filters */}
        <div className="flex flex-wrap gap-2">
          {TYPE_BUTTONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                typeFilter === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Skill + Sort row */}
        <div className="flex gap-2 flex-wrap">
          {userSkills.length > 0 && (
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">All skills</option>
              {userSkills.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          )}

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="match">Best Match</option>
            <option value="newest">Newest</option>
            <option value="entry-first">Entry Level First</option>
          </select>

          <div className="flex-1" />

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50 font-medium"
          >
            {refreshing ? 'Refreshing...' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        {filtered.length} of {opportunities.length} opportunities
        {typeFilter !== 'all' && ` · ${typeFilter}`}
        {skillFilter && ` · skill: ${skillFilter}`}
      </p>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-10 text-center">
          <p className="text-gray-500 text-sm">No opportunities match your current filters.</p>
          <button onClick={() => { setTypeFilter('all'); setSkillFilter(''); }} className="mt-2 text-xs text-indigo-600 underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} token={token} onView={onView} />
          ))}
        </div>
      )}
    </div>
  );
}
