'use client';

import { useState } from 'react';
import type { Question, AnswerResult } from '@/types';
import { submitAnswer } from '@/lib/api';
import { Loader } from '@/components/ui/Loader';
import { LatexText } from '@/components/ui/LatexText';
import { FeedbackPanel } from './FeedbackPanel';
import { BadgePopup } from '@/components/ui/BadgePopup';

const DIFFICULTY_STYLES: Record<string, string> = {
  easy:     'bg-green-100 text-green-700',
  medium:   'bg-yellow-100 text-yellow-700',
  critical: 'bg-red-100 text-red-700',
};

interface QuestionCardProps {
  question: Question;
  token: string;
  onAnswered: (result: AnswerResult) => void;
}

export function QuestionCard({ question, token, onAnswered }: QuestionCardProps) {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [error, setError] = useState('');
  const [newBadges, setNewBadges] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!response.trim()) return;
    setLoading(true);
    setError('');

    try {
      const data: AnswerResult = await submitAnswer(token, question.id, response.trim());
      setResult(data);
      if (data.new_badges?.length > 0) setNewBadges(data.new_badges);
      onAnswered(data);
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
      {/* Difficulty badge */}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_STYLES[question.difficulty]}`}>
          {question.difficulty}
        </span>
        <span className="text-xs text-gray-400">{question.question_type.replace('_', ' ')}</span>
      </div>

      {/* Question text */}
      <p className="text-gray-900 font-medium text-base leading-relaxed">
        <LatexText text={question.text} />
      </p>

      {/* Answer form — hidden once answered */}
      {!result && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Type your answer here..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            disabled={loading}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {loading ? (
            <Loader message="Claude is evaluating your answer..." />
          ) : (
            <button
              type="submit"
              disabled={!response.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              Submit Answer
            </button>
          )}
        </form>
      )}

      {/* Feedback panel */}
      {result && <FeedbackPanel result={result} />}

      {/* Badge popup */}
      {newBadges.length > 0 && (
        <BadgePopup badges={newBadges} onDismiss={() => setNewBadges([])} />
      )}
    </div>
  );
}
