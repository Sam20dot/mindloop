'use client';

import type { Material } from '@/types';

const TYPE_ICONS: Record<string, string> = {
  pdf: '📕', docx: '📘', text: '📄', url: '🌐', youtube: '▶️',
};

const TYPE_COLORS: Record<string, string> = {
  pdf:     'bg-red-100 text-red-700',
  docx:    'bg-blue-100 text-blue-700',
  text:    'bg-gray-100 text-gray-700',
  url:     'bg-green-100 text-green-700',
  youtube: 'bg-purple-100 text-purple-700',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

interface Props {
  material: Material;
  onStartSession: (material: Material) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}

export function MaterialCard({ material, onStartSession, onDelete, deleting }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 hover:border-indigo-200 transition-colors">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{TYPE_ICONS[material.type] ?? '📄'}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{material.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[material.type] ?? 'bg-gray-100 text-gray-600'}`}>
              {material.type.toUpperCase()}
            </span>
            <span className="text-xs text-gray-400">{timeAgo(material.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onStartSession(material)}
          className="flex-1 bg-indigo-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          📚 Start Session
        </button>
        <button
          onClick={() => onDelete(material.id)}
          disabled={deleting}
          className="px-3 py-2 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
        >
          🗑
        </button>
      </div>
    </div>
  );
}
