'use client';

import { useRef, useState } from 'react';
import type { MatchedOpportunity } from '@/types';
import { saveOpportunity, unsaveOpportunity } from '@/lib/api';

const TYPE_STYLES: Record<string, string> = {
  freelance:    'bg-blue-100 text-blue-700',
  internship:   'bg-yellow-100 text-yellow-700',
  'entry-level': 'bg-green-100 text-green-700',
};

const TYPE_LABELS: Record<string, string> = {
  freelance:    'Freelance',
  internship:   'Internship',
  'entry-level': 'Entry Level',
};

function MatchBar({ score }: { score: number }) {
  const color =
    score >= 75 ? 'bg-green-500' :
    score >= 50 ? 'bg-yellow-500' :
                  'bg-red-400';
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-500 font-medium">Match score</span>
        <span className={`font-bold ${score >= 75 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
          {score}%
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

interface Props {
  opportunity: MatchedOpportunity;
  token: string;
  onView: (id: string) => void;
}

export function OpportunityCard({ opportunity, token, onView }: Props) {
  const viewLogged = useRef(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(opportunity.is_saved);
  const [saving, setSaving] = useState(false);

  function handleView() {
    if (!viewLogged.current) {
      viewLogged.current = true;
      onView(opportunity.id);
    }
  }

  async function handleSaveToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!opportunity.opportunity_id || saving) return;
    setSaving(true);
    const prevSaved = isSaved;
    setIsSaved(!prevSaved);
    try {
      if (prevSaved) {
        await unsaveOpportunity(token, opportunity.opportunity_id);
      } else {
        await saveOpportunity(token, opportunity.opportunity_id);
      }
    } catch {
      setIsSaved(prevSaved);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
      onClick={handleView}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-gray-900 text-base leading-snug flex-1">{opportunity.title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_STYLES[opportunity.type] ?? 'bg-gray-100 text-gray-600'}`}>
            {TYPE_LABELS[opportunity.type] ?? opportunity.type}
          </span>
          <button
            onClick={handleSaveToggle}
            disabled={saving || !opportunity.opportunity_id}
            title={isSaved ? 'Remove bookmark' : 'Save opportunity'}
            className={`text-lg transition-all ${saving ? 'opacity-50' : 'hover:scale-110'}`}
          >
            {isSaved ? '🔖' : '🏷️'}
          </button>
        </div>
      </div>

      {/* Match score bar */}
      <MatchBar score={opportunity.match_score} />

      {/* Description */}
      {opportunity.description && (
        <p className="text-sm text-gray-500 mt-3 leading-relaxed">{opportunity.description}</p>
      )}

      {/* Match reason */}
      <div className="mt-3 bg-indigo-50 rounded-xl px-3 py-2">
        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-0.5">Why this fits you</p>
        <p className="text-sm text-indigo-800 leading-relaxed">{opportunity.match_reason}</p>
      </div>

      {/* Skill tags */}
      {opportunity.skill_tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {opportunity.skill_tags.map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Action steps toggle */}
      {opportunity.action_steps.length > 0 && (
        <div className="mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); setStepsOpen((o) => !o); }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            {stepsOpen ? '▲' : '▼'} {stepsOpen ? 'Hide' : 'Show'} action steps
          </button>
          {stepsOpen && (
            <ol className="mt-2 space-y-1.5">
              {opportunity.action_steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-gray-400 italic">AI-suggested based on your skills</p>
        {opportunity.source_url && (
          <a
            href={opportunity.source_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            View Opportunity →
          </a>
        )}
      </div>
    </div>
  );
}
