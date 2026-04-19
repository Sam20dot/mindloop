'use client';

import { useEffect, useState } from 'react';

const BADGE_ICONS: Record<string, string> = {
  'Quick Learner': '⚡',
  'Focus Master': '🎯',
  'Consistent Student': '🔥',
  'Skill Builder': '🛠️',
  'Opportunity Seeker': '🌍',
};

interface BadgePopupProps {
  badges: string[];
  onDismiss: () => void;
}

export function BadgePopup({ badges, onDismiss }: BadgePopupProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  if (!visible || badges.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {badges.map((badge) => (
        <div
          key={badge}
          className="bg-yellow-50 border border-yellow-300 rounded-xl px-5 py-3 shadow-lg flex items-center gap-3 animate-bounce"
        >
          <span className="text-2xl">{BADGE_ICONS[badge] ?? '🏅'}</span>
          <div>
            <p className="text-xs text-yellow-600 font-medium uppercase tracking-wide">New Badge!</p>
            <p className="font-bold text-yellow-800">{badge}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
