'use client';

import type { SavedOpportunity } from '@/types';

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

interface Props {
  opportunity: SavedOpportunity;
  onUnsave: (opportunityId: string) => void;
}

export function SavedOpportunityCard({ opportunity, onUnsave }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-gray-900 text-base leading-snug flex-1">{opportunity.title}</h3>
        <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_STYLES[opportunity.type] ?? 'bg-gray-100 text-gray-600'}`}>
          {TYPE_LABELS[opportunity.type] ?? opportunity.type}
        </span>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed mb-3">{opportunity.description}</p>

      {opportunity.skill_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {opportunity.skill_tags.map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => onUnsave(opportunity.opportunity_id)}
          className="text-xs text-red-500 hover:text-red-700 font-medium"
        >
          Remove bookmark
        </button>
        {opportunity.source_url && (
          <a
            href={opportunity.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            View Opportunity →
          </a>
        )}
      </div>
    </div>
  );
}
