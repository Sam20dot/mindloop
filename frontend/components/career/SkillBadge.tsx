import type { Skill } from '@/types';

const LEVEL_COLORS: Record<string, string> = {
  beginner:     'bg-blue-100 text-blue-700 border-blue-200',
  intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  advanced:     'bg-green-100 text-green-700 border-green-200',
};

const LEVEL_ICONS: Record<string, string> = {
  beginner:     '🌱',
  intermediate: '⚡',
  advanced:     '🚀',
};

interface SkillBadgeProps {
  skill: Skill;
  size?: 'sm' | 'md';
}

export function SkillBadge({ skill, size = 'md' }: SkillBadgeProps) {
  const colors = LEVEL_COLORS[skill.level] ?? LEVEL_COLORS.beginner;
  const icon = LEVEL_ICONS[skill.level] ?? '🌱';

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors}`}>
        {icon} {skill.name}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${colors}`}>
      <span className="text-lg">{icon}</span>
      <div>
        <p className="font-semibold text-sm leading-tight">{skill.name}</p>
        <p className="text-xs opacity-75 capitalize">{skill.level}</p>
      </div>
    </div>
  );
}
