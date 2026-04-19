'use client';

import { useState } from 'react';
import type { LearningSession as SessionType, Question, AnswerResult } from '@/types';
import { generateQuestions, completeSession } from '@/lib/api';
import { Loader } from '@/components/ui/Loader';
import { LatexText } from '@/components/ui/LatexText';
import { ProgressBar } from './ProgressBar';
import { QuestionCard } from './QuestionCard';
import { BadgePopup } from '@/components/ui/BadgePopup';

interface LearningSessionProps {
  session: SessionType;
  token: string;
  onPointsChange: (newTotal: number) => void;
}

export function LearningSession({ session, token, onPointsChange }: LearningSessionProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [sessionBadges, setSessionBadges] = useState<string[]>([]);
  const [error, setError] = useState('');

  async function handleGenerateQuestions() {
    setLoadingQuestions(true);
    setError('');
    try {
      const data = await generateQuestions(token, session.id);
      setQuestions(data.questions);
    } catch (err: any) {
      setError(err.message || 'Failed to generate questions. Please try again.');
    } finally {
      setLoadingQuestions(false);
    }
  }

  function handleAnswered(result: AnswerResult) {
    setAnsweredCount((c) => c + 1);
    onPointsChange(result.new_total_points);
  }

  async function handleComplete() {
    setCompleting(true);
    try {
      const data = await completeSession(token, session.id);
      setCompleted(true);
      onPointsChange(data.new_total_points);
      if (data.new_badges?.length > 0) setSessionBadges(data.new_badges);
    } catch (err: any) {
      setError(err.message || 'Failed to complete session.');
    } finally {
      setCompleting(false);
    }
  }

  const allAnswered = questions.length > 0 && answeredCount >= questions.length;

  return (
    <div className="space-y-6">
      {/* Material display */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-bold text-lg text-gray-900 mb-1">{session.topic}</h2>
        <p className="text-xs text-gray-400 mb-4">Study this material, then generate questions when ready.</p>
        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed max-h-64 overflow-y-auto">
          <LatexText text={session.material_text} />
        </div>
      </div>

      {/* Generate button */}
      {questions.length === 0 && !loadingQuestions && !completed && (
        <button
          onClick={handleGenerateQuestions}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Generate Questions with AI
        </button>
      )}

      {loadingQuestions && <Loader message="Claude is generating your questions..." />}
      {error && <p className="text-red-600 text-sm text-center">{error}</p>}

      {/* Questions */}
      {questions.length > 0 && !completed && (
        <div className="space-y-4">
          <ProgressBar current={answeredCount} total={questions.length} />

          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} token={token} onAnswered={handleAnswered} />
          ))}

          {allAnswered && (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {completing ? 'Completing session...' : 'Complete Session (+20 pts)'}
            </button>
          )}
        </div>
      )}

      {/* Completed state */}
      {completed && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-6 text-center space-y-2">
          <p className="text-3xl">🎉</p>
          <p className="font-bold text-green-800 text-lg">Session Complete!</p>
          <p className="text-green-700 text-sm">Great work on completing this session. Keep the momentum going!</p>
          <a href="/dashboard" className="inline-block mt-3 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors text-sm">
            Back to Dashboard
          </a>
        </div>
      )}

      {sessionBadges.length > 0 && (
        <BadgePopup badges={sessionBadges} onDismiss={() => setSessionBadges([])} />
      )}
    </div>
  );
}
