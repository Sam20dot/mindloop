'use client';

import { useEffect, useState } from 'react';
import type { SkillGapRecommendation } from '@/types';
import { getSkillGaps } from '@/lib/api';
import { Loader } from '@/components/ui/Loader';

interface Props {
  token: string;
}

export function SkillGapSection({ token }: Props) {
  const [skills, setSkills] = useState<SkillGapRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getSkillGaps(token)
      .then((data) => setSkills(data.recommended_skills ?? []))
      .catch((err) => setError(err.message || 'Could not load skill recommendations.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="mt-8 border-t border-gray-200 pt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Skills That Will Unlock More Opportunities</h2>
        <Loader message="Claude is analyzing your skill gaps..." />
      </div>
    );
  }

  if (error || skills.length === 0) return null;

  return (
    <div className="mt-8 border-t border-gray-200 pt-8">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">Skills That Will Unlock More Opportunities</h2>
        <p className="text-sm text-gray-500 mt-0.5">Learn these next to expand your matched opportunities.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {skills.slice(0, 3).map((rec, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-bold text-gray-900 text-sm">{rec.name}</p>
                <p className="text-xs text-indigo-600 font-semibold">
                  +{rec.opportunities_unlocked} opportunities
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed flex-1">{rec.reason}</p>
            <a
              href={`/learn?topic=${encodeURIComponent(rec.name)}`}
              className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white text-center py-2 rounded-lg transition-colors"
            >
              Learn this skill →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
