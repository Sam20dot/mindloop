import type { AnswerResult } from '@/types';
import { LatexText } from '@/components/ui/LatexText';

const SCORE_CONFIG = {
  high: { range: [80, 100], bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', bar: 'bg-green-500', label: 'Excellent!' },
  mid:  { range: [50,  79], bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', bar: 'bg-yellow-400', label: 'Good effort!' },
  low:  { range: [0,   49], bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', bar: 'bg-red-400', label: 'Keep practising!' },
};

function scoreConfig(score: number) {
  if (score >= 80) return SCORE_CONFIG.high;
  if (score >= 50) return SCORE_CONFIG.mid;
  return SCORE_CONFIG.low;
}

interface FeedbackPanelProps {
  result: AnswerResult;
}

export function FeedbackPanel({ result }: FeedbackPanelProps) {
  const cfg = scoreConfig(result.score);

  return (
    <div className={`${cfg.bg} ${cfg.border} border rounded-xl p-5 space-y-3`}>
      {/* Score */}
      <div className="flex items-center justify-between">
        <span className={`font-bold text-2xl ${cfg.text}`}>{result.score}/100</span>
        <span className={`text-sm font-semibold ${cfg.text}`}>{cfg.label}</span>
      </div>

      {/* Score bar */}
      <div className="h-2 bg-white rounded-full overflow-hidden">
        <div
          className={`h-full ${cfg.bar} rounded-full transition-all duration-700`}
          style={{ width: `${result.score}%` }}
        />
      </div>

      {/* Feedback */}
      <p className="text-sm text-gray-700"><LatexText text={result.feedback} /></p>

      {/* Encouragement */}
      <p className={`text-sm font-medium italic ${cfg.text}`}>"{result.encouragement}"</p>

      {/* Points awarded */}
      {result.points_awarded > 0 && (
        <div className="flex items-center gap-2 text-sm text-indigo-700 font-semibold">
          <span>⭐</span>
          <span>+{result.points_awarded} points earned!</span>
        </div>
      )}
    </div>
  );
}
