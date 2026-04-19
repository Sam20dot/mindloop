'use client';

import { useState } from 'react';
import type { Roadmap, RoadmapStep, RoadmapProject, RoadmapResource, QuizQuestion } from '@/types';
import { updateRoadmapStep, updateStepStatus, generateStepQuiz, verifyStep } from '@/lib/api';
import { Loader } from '@/components/ui/Loader';
import { BadgePopup } from '@/components/ui/BadgePopup';

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner:     'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced:     'bg-red-100 text-red-700',
};

const RESOURCE_COLORS: Record<string, string> = {
  video:   'bg-purple-100 text-purple-700',
  article: 'bg-blue-100 text-blue-700',
  course:  'bg-indigo-100 text-indigo-700',
  book:    'bg-amber-100 text-amber-700',
};

const RESOURCE_ICONS: Record<string, string> = {
  video: '▶️', article: '📄', course: '🎓', book: '📚',
};

const VERIFY_ICONS: Record<string, string> = {
  quiz: '📝', github: '🐙', reflection: '💭',
};

interface RoadmapViewerProps {
  roadmap: Roadmap;
  token: string;
  onPointsChange?: (newTotal: number) => void;
}

type VerifyPanel = {
  stepOrder: number;
  verificationType: 'quiz' | 'github' | 'reflection' | null;
  quizQuestions: QuizQuestion[];
  quizAnswers: string[];
  proof: string;
  githubDesc: string;
  loading: boolean;
  error: string;
};

const EMPTY_PANEL: VerifyPanel = {
  stepOrder: -1,
  verificationType: null,
  quizQuestions: [],
  quizAnswers: [],
  proof: '',
  githubDesc: '',
  loading: false,
  error: '',
};

export function RoadmapViewer({ roadmap: initialRoadmap, token, onPointsChange }: RoadmapViewerProps) {
  const [roadmap, setRoadmap] = useState(initialRoadmap);
  const [saving, setSaving] = useState<number | null>(null);
  const [panel, setPanel] = useState<VerifyPanel>(EMPTY_PANEL);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [verifyFeedback, setVerifyFeedback] = useState<{ stepOrder: number; passed: boolean; text: string } | null>(null);

  const steps: RoadmapStep[] = roadmap.steps ?? [];
  const completedOrders = new Set<number>(roadmap.completed_steps ?? []);

  // A step is "unlocked" if it's the first step, or the previous step is verified
  function isUnlocked(stepOrder: number): boolean {
    if (stepOrder <= 1) return true;
    const prev = steps.find(s => s.order === stepOrder - 1);
    return !!prev?.verified || completedOrders.has(stepOrder - 1);
  }

  const completedCount = steps.filter(s => s.verified || completedOrders.has(s.order)).length;
  const totalSteps = steps.length;
  const pct = totalSteps === 0 ? 0 : Math.round((completedCount / totalSteps) * 100);

  // ── Legacy toggle (non-verified toggle) ────────────────────
  async function toggleStep(order: number) {
    const nowCompleted = !completedOrders.has(order);
    const next = new Set(completedOrders);
    nowCompleted ? next.add(order) : next.delete(order);

    setSaving(order);
    try {
      await updateRoadmapStep(token, roadmap.id, order, nowCompleted);
      setRoadmap(r => ({ ...r, completed_steps: [...next] }));
    } catch {
      // revert — state unchanged
    } finally {
      setSaving(null);
    }
  }

  // ── Status update ───────────────────────────────────────────
  async function handleStatusChange(order: number, newStatus: string) {
    try {
      const data = await updateStepStatus(token, roadmap.id, order, newStatus);
      setRoadmap(data);
    } catch {
      // non-fatal
    }
  }

  // ── Open verify panel ───────────────────────────────────────
  function openVerify(step: RoadmapStep) {
    setPanel({ ...EMPTY_PANEL, stepOrder: step.order });
    setVerifyFeedback(null);
  }

  // ── Choose verification type ────────────────────────────────
  async function chooseVerificationType(type: 'quiz' | 'github' | 'reflection') {
    setPanel(p => ({ ...p, verificationType: type, loading: type === 'quiz', error: '' }));

    if (type === 'quiz') {
      try {
        const data = await generateStepQuiz(token, roadmap.id, panel.stepOrder);
        const qs: QuizQuestion[] = data.questions ?? [];
        setPanel(p => ({
          ...p,
          quizQuestions: qs,
          quizAnswers: qs.map(() => ''),
          loading: false,
        }));
      } catch {
        setPanel(p => ({ ...p, loading: false, error: 'Failed to generate quiz. Try again.' }));
      }
    }
  }

  // ── Submit verification ─────────────────────────────────────
  async function submitVerification() {
    setPanel(p => ({ ...p, loading: true, error: '' }));

    let proof = panel.proof;
    let quizAnswers: { question: string; correct_answer: string; user_answer: string }[] = [];

    if (panel.verificationType === 'quiz') {
      quizAnswers = panel.quizQuestions.map((q, i) => ({
        question: q.question,
        correct_answer: q.correct_answer,
        user_answer: panel.quizAnswers[i] ?? '',
      }));
    } else if (panel.verificationType === 'github') {
      proof = `${panel.proof}|||${panel.githubDesc}`;
    }

    try {
      const data = await verifyStep(
        token,
        roadmap.id,
        panel.stepOrder,
        panel.verificationType!,
        proof,
        quizAnswers,
      );

      setRoadmap(data.roadmap);
      setVerifyFeedback({ stepOrder: panel.stepOrder, passed: data.passed, text: data.feedback });
      setPanel(EMPTY_PANEL);

      if (data.new_badges?.length > 0) setNewBadges(data.new_badges);
      if (data.points_awarded > 0 && onPointsChange) {
        // fetch fresh points from parent
        onPointsChange(data.points_awarded);
      }
    } catch (err: any) {
      setPanel(p => ({ ...p, loading: false, error: err.message || 'Verification failed.' }));
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
        <h3 className="text-xl font-bold">{roadmap.skill_name}</h3>
        <p className="text-blue-200 text-sm mt-0.5">
          Estimated {roadmap.estimated_weeks} weeks · {totalSteps} steps
        </p>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-blue-200 mb-1">
            <span>{completedCount} of {totalSteps} steps verified</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-blue-400 bg-opacity-40 rounded-full">
            <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">

        {/* Steps timeline */}
        <section>
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Learning Steps</h4>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-5">
              {steps.map((step) => {
                const isVerified = !!step.verified || completedOrders.has(step.order);
                const unlocked = isUnlocked(step.order);
                const stepStatus = step.status ?? (isVerified ? 'completed' : 'not_started');
                const vType = step.verification_type ?? 'reflection';
                const isSavingThis = saving === step.order;
                const showFeedback = verifyFeedback?.stepOrder === step.order;
                const inPanel = panel.stepOrder === step.order;

                return (
                  <div key={step.order} className="flex gap-4 relative">
                    {/* Step circle */}
                    <button
                      onClick={() => unlocked && toggleStep(step.order)}
                      disabled={isSavingThis || !unlocked}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-all ${
                        !unlocked
                          ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                          : isSavingThis
                          ? 'bg-gray-200 border-gray-300 animate-pulse'
                          : isVerified
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-white border-gray-300 hover:border-indigo-400 text-gray-500'
                      }`}
                      title={!unlocked ? 'Complete previous step first' : isVerified ? 'Verified' : 'Mark complete'}
                    >
                      {!unlocked ? '🔒' : isSavingThis ? '…' : isVerified ? '✓' : step.order}
                    </button>

                    <div className={`flex-1 pb-2 ${!unlocked ? 'opacity-50' : ''}`}>
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className={`font-semibold text-sm ${isVerified ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {step.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">{step.estimated_weeks}w</span>
                            <span className="text-xs">{VERIFY_ICONS[vType]} {vType}</span>
                            {stepStatus !== 'not_started' && !isVerified && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 rounded-full">{stepStatus.replace('_', ' ')}</span>
                            )}
                          </div>
                        </div>

                        {/* Status + Verify buttons */}
                        {unlocked && !isVerified && (
                          <div className="flex gap-2 flex-wrap">
                            {stepStatus === 'not_started' && (
                              <button
                                onClick={() => handleStatusChange(step.order, 'in_progress')}
                                className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                Start
                              </button>
                            )}
                            {stepStatus === 'in_progress' && (
                              <button
                                onClick={() => openVerify(step)}
                                className="text-xs bg-indigo-600 text-white px-2.5 py-1 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                              >
                                Verify Completion
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="text-gray-500 text-sm mt-1 leading-relaxed">{step.description}</p>

                      {/* Feedback banner */}
                      {showFeedback && (
                        <div className={`mt-2 text-sm rounded-lg px-3 py-2 border ${
                          verifyFeedback.passed
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                          {verifyFeedback.passed ? '✅ ' : '❌ '}{verifyFeedback.text}
                        </div>
                      )}

                      {/* Inline verify panel */}
                      {inPanel && (
                        <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                          {panel.loading && <Loader message="Running AI verification…" />}
                          {panel.error && <p className="text-red-600 text-xs mb-2">{panel.error}</p>}

                          {!panel.verificationType && !panel.loading && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-3">Choose verification method:</p>
                              <div className="flex gap-2 flex-wrap">
                                {(['quiz', 'github', 'reflection'] as const).map(t => (
                                  <button
                                    key={t}
                                    onClick={() => chooseVerificationType(t)}
                                    className="flex items-center gap-1.5 text-sm bg-white border border-gray-300 px-3 py-2 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                                  >
                                    {VERIFY_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
                                  </button>
                                ))}
                              </div>
                              <button onClick={() => setPanel(EMPTY_PANEL)} className="mt-3 text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                            </div>
                          )}

                          {panel.verificationType === 'quiz' && !panel.loading && panel.quizQuestions.length > 0 && (
                            <div className="space-y-3">
                              <p className="text-sm font-medium text-gray-700">Answer these 3 questions:</p>
                              {panel.quizQuestions.map((q, i) => (
                                <div key={i}>
                                  <p className="text-sm text-gray-800 font-medium mb-1">{i + 1}. {q.question}</p>
                                  <textarea
                                    rows={2}
                                    value={panel.quizAnswers[i] ?? ''}
                                    onChange={e => {
                                      const next = [...panel.quizAnswers];
                                      next[i] = e.target.value;
                                      setPanel(p => ({ ...p, quizAnswers: next }));
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    placeholder="Your answer…"
                                  />
                                </div>
                              ))}
                              <div className="flex gap-2">
                                <button onClick={submitVerification} disabled={panel.quizAnswers.some(a => !a.trim())}
                                  className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors">
                                  Submit Quiz
                                </button>
                                <button onClick={() => setPanel(EMPTY_PANEL)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
                              </div>
                            </div>
                          )}

                          {panel.verificationType === 'github' && !panel.loading && (
                            <div className="space-y-3">
                              <p className="text-sm font-medium text-gray-700">Paste your GitHub repo URL:</p>
                              <input type="url" value={panel.proof}
                                onChange={e => setPanel(p => ({ ...p, proof: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                placeholder="https://github.com/yourname/project" />
                              <p className="text-sm font-medium text-gray-700">Describe what you built:</p>
                              <textarea rows={3} value={panel.githubDesc}
                                onChange={e => setPanel(p => ({ ...p, githubDesc: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                placeholder="I built a web app that…" />
                              <div className="flex gap-2">
                                <button onClick={submitVerification} disabled={!panel.proof.trim() || !panel.githubDesc.trim()}
                                  className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors">
                                  Submit
                                </button>
                                <button onClick={() => setPanel(EMPTY_PANEL)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
                              </div>
                            </div>
                          )}

                          {panel.verificationType === 'reflection' && !panel.loading && (
                            <div className="space-y-3">
                              <p className="text-sm font-medium text-gray-700">Write a reflection on what you learned:</p>
                              <textarea rows={4} value={panel.proof}
                                onChange={e => setPanel(p => ({ ...p, proof: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                placeholder="In this step I learned… The most important concept was… I applied it by…" />
                              <div className="flex gap-2">
                                <button onClick={submitVerification} disabled={panel.proof.trim().length < 50}
                                  className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors">
                                  Submit Reflection
                                </button>
                                <button onClick={() => setPanel(EMPTY_PANEL)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
                              </div>
                              {panel.proof.trim().length < 50 && panel.proof.trim().length > 0 && (
                                <p className="text-xs text-gray-400">{50 - panel.proof.trim().length} more characters needed</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Projects */}
        {roadmap.projects.length > 0 && (
          <section>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Practice Projects</h4>
            <div className="space-y-3">
              {roadmap.projects.map((project: RoadmapProject, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-xl shrink-0">🔨</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-gray-900">{project.title}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[project.difficulty] || DIFFICULTY_COLORS.beginner}`}>
                        {project.difficulty}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mt-0.5">{project.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Resources */}
        {roadmap.resources.length > 0 && (
          <section>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Free Resources</h4>
            <div className="space-y-2">
              {roadmap.resources.map((res: RoadmapResource, i: number) => (
                <a key={i} href={res.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-colors group">
                  <span className="text-lg">{RESOURCE_ICONS[res.type] ?? '🔗'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 group-hover:text-indigo-700 truncate">{res.title}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${RESOURCE_COLORS[res.type] || 'bg-gray-100 text-gray-600'}`}>
                    {res.type}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>

      {newBadges.length > 0 && <BadgePopup badges={newBadges} onDismiss={() => setNewBadges([])} />}
    </div>
  );
}
