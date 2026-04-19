import type { CVEntry, CVSkillEntry, CVAchievement } from '@/types';

const LEVEL_COLORS: Record<string, string> = {
  beginner:     'bg-blue-100 text-blue-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced:     'bg-green-100 text-green-700',
};

const BADGE_ICONS: Record<string, string> = {
  'Quick Learner': '⚡',
  'Focus Master': '🎯',
  'Consistent Student': '🔥',
  'Skill Builder': '🛠️',
  'Opportunity Seeker': '🌍',
};

interface CVViewerProps {
  cv: CVEntry;
  userName: string;
}

export function CVViewer({ cv, userName }: CVViewerProps) {
  const { summary, skills_section = [], achievements_section = [] } = cv.content;

  return (
    <div id="cv-content" className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-8 text-white">
        <h2 className="text-3xl font-bold">{userName}</h2>
        <p className="mt-1 text-indigo-200 text-sm">
          Generated {new Date(cv.generated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="px-8 py-6 space-y-8">
        {/* Summary */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Profile Summary</h3>
          <p className="text-gray-700 leading-relaxed">{summary}</p>
        </section>

        {/* Skills */}
        {skills_section.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Skills</h3>
            <div className="space-y-3">
              {skills_section.map((skill: CVSkillEntry, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 shrink-0 ${LEVEL_COLORS[skill.level] || LEVEL_COLORS.beginner}`}>
                    {skill.level}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{skill.name}</p>
                    <p className="text-gray-500 text-sm">{skill.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Achievements */}
        {achievements_section.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Achievements</h3>
            <div className="space-y-3">
              {achievements_section.map((ach: CVAchievement, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-lg shrink-0">{BADGE_ICONS[ach.title] ?? '🏅'}</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{ach.title}</p>
                    <p className="text-gray-500 text-sm">{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
