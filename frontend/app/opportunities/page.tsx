'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  getMatchedOpportunities, refreshMatchedOpportunities, logOpportunityView, getMySkills,
  getJobs, matchJobs, applyToJob, getMyApplications,
} from '@/lib/api';
import type { MatchedOpportunity, Skill, JobListing, JobMatchResult, JobApplication } from '@/types';
import { BadgePopup } from '@/components/ui/BadgePopup';
import { OpportunityFeed } from '@/components/opportunities/OpportunityFeed';
import { SkillGapSection } from '@/components/opportunities/SkillGapSection';
import { Loader } from '@/components/ui/Loader';

type Tab = 'ai' | 'jobs' | 'applications';

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700',
  reviewed: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const TYPE_COLORS: Record<string, string> = {
  internship: 'bg-blue-100 text-blue-700',
  freelance: 'bg-purple-100 text-purple-700',
  'entry-level': 'bg-green-100 text-green-700',
  'full-time': 'bg-indigo-100 text-indigo-700',
};

export default function OpportunitiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const token = (session as any)?.accessToken as string;

  const [tab, setTab] = useState<Tab>('ai');

  // ── AI Opportunities state ─────────────────────────────────
  const [opportunities, setOpportunities] = useState<MatchedOpportunity[]>([]);
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [loadingAI, setLoadingAI] = useState(true);
  const [errorAI, setErrorAI] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  // ── Job Board state ────────────────────────────────────────
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobMatchResults, setJobMatchResults] = useState<Record<string, JobMatchResult>>({});
  const [matchingJobId, setMatchingJobId] = useState<string | null>(null);
  const [applyJobId, setApplyJobId] = useState<string | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [applyError, setApplyError] = useState('');

  // ── My Applications state ──────────────────────────────────
  const [myApps, setMyApps] = useState<JobApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return; }
    if (status !== 'authenticated') return;
    loadAI();
    loadSkills();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!token) return;
    if (tab === 'jobs' && jobs.length === 0 && !loadingJobs) loadJobs();
    if (tab === 'applications' && myApps.length === 0 && !loadingApps) loadMyApps();
  }, [tab, token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAI() {
    setLoadingAI(true);
    try { setOpportunities((await getMatchedOpportunities(token)).opportunities ?? []); }
    catch (e: any) { setErrorAI(e.message || 'Failed to load.'); }
    finally { setLoadingAI(false); }
  }

  async function loadSkills() {
    try { setUserSkills((await getMySkills(token)) as Skill[] ?? []); } catch {}
  }

  async function loadJobs() {
    setLoadingJobs(true);
    try { setJobs((await getJobs(token)) as JobListing[]); }
    catch {} finally { setLoadingJobs(false); }
  }

  async function loadMyApps() {
    setLoadingApps(true);
    try { setMyApps((await getMyApplications(token)) as JobApplication[]); }
    catch {} finally { setLoadingApps(false); }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try { setOpportunities((await refreshMatchedOpportunities(token)).opportunities ?? []); }
    catch (e: any) { setErrorAI(e.message || 'Refresh failed.'); }
    finally { setRefreshing(false); }
  }

  const handleView = useCallback(async (id: string) => {
    try {
      const r = await logOpportunityView(token, id);
      if (r.new_badge) setNewBadges(p => [...p, r.new_badge]);
    } catch {}
  }, [token]);

  async function handleAIMatch(job: JobListing) {
    setMatchingJobId(job.id);
    try {
      const data = await matchJobs(token);
      const found = (data.results as JobMatchResult[]).find(r => r.job_id === job.id);
      if (found) setJobMatchResults(prev => ({ ...prev, [job.id]: found }));
    } catch {} finally { setMatchingJobId(null); }
  }

  async function handleApply() {
    if (!applyJobId) return;
    setApplying(true);
    setApplyError('');
    try {
      await applyToJob(token, applyJobId, coverNote);
      setApplySuccess(applyJobId);
      setApplyJobId(null);
      setCoverNote('');
      // Refresh applications list
      loadMyApps();
    } catch (e: any) {
      setApplyError(e.message || 'Application failed.');
    } finally { setApplying(false); }
  }

  const topSkills = userSkills.slice(0, 3).map(s => s.name).join(', ');

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
          {topSkills && (
            <p className="text-gray-500 text-sm mt-1">Based on your skills: <span className="font-medium text-gray-700">{topSkills}</span></p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
          {([['ai', '🎯 AI Matches'], ['jobs', '💼 Job Board'], ['applications', '📋 My Applications']] as [Tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab: AI Matches ──────────────────────────── */}
        {tab === 'ai' && (
          <>
            <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              <strong>AI-suggested</strong> opportunities based on skill alignment. Always verify on the source platform.
            </div>
            <OpportunityFeed
              opportunities={opportunities} loading={loadingAI} error={errorAI}
              onRefresh={handleRefresh} refreshing={refreshing} onView={handleView}
              userSkills={userSkills} token={token}
            />
            {!loadingAI && !errorAI && <SkillGapSection token={token} />}
          </>
        )}

        {/* ── Tab: Job Board ───────────────────────────── */}
        {tab === 'jobs' && (
          <div>
            {loadingJobs ? (
              <Loader message="Loading jobs…" />
            ) : jobs.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-4">💼</div>
                <p className="font-medium">No job listings yet.</p>
                <p className="text-sm mt-1">Check back soon — new opportunities are posted regularly.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map(job => {
                  const matchResult = jobMatchResults[job.id];
                  const alreadyApplied = myApps.some(a => a.job === job.id);

                  return (
                    <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900">{job.title}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[job.type] ?? 'bg-gray-100 text-gray-600'}`}>{job.type}</span>
                            {job.location && <span className="text-xs text-gray-500">📍 {job.location}</span>}
                            {job.is_remote && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🌍 Remote</span>}
                            {job.deadline && <span className="text-xs text-orange-600">📅 Deadline: {job.deadline}</span>}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{job.application_count} applied</span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{job.description}</p>

                      {/* Skill tags */}
                      {job.skill_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {job.skill_tags.map((s, i) => (
                            <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      )}

                      {/* AI Match result */}
                      {matchResult && (
                        <div className="mb-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-blue-700">{matchResult.match_score}% match</span>
                          </div>
                          <p className="text-xs text-blue-700">{matchResult.match_reason}</p>
                          {matchResult.missing_skills.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">Missing: {matchResult.missing_skills.join(', ')}</p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleAIMatch(job)}
                          disabled={matchingJobId === job.id}
                          className="text-xs border border-blue-300 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                        >
                          {matchingJobId === job.id ? '⏳ Matching…' : '🤖 AI Match'}
                        </button>

                        {alreadyApplied || applySuccess === job.id ? (
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">✅ Applied</span>
                        ) : (
                          <button
                            onClick={() => { setApplyJobId(job.id); setApplyError(''); }}
                            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                          >
                            Apply Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: My Applications ─────────────────────── */}
        {tab === 'applications' && (
          <div>
            {loadingApps ? (
              <Loader message="Loading applications…" />
            ) : myApps.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-4">📋</div>
                <p className="font-medium">No applications yet.</p>
                <p className="text-sm mt-1">Browse the Job Board and apply to listings that match your skills.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myApps.map(app => (
                  <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{app.job_title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{app.job_type} · Applied {new Date(app.applied_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[app.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {app.status}
                      </span>
                    </div>
                    {app.ai_match_score > 0 && (
                      <div className="mt-3 bg-blue-50 rounded-lg px-3 py-2">
                        <p className="text-xs font-bold text-blue-700 mb-0.5">{app.ai_match_score}% match</p>
                        <p className="text-xs text-blue-600">{app.ai_match_reason}</p>
                      </div>
                    )}
                    {app.cover_note && (
                      <p className="text-xs text-gray-500 mt-2 italic">"{app.cover_note.slice(0, 120)}{app.cover_note.length > 120 ? '…' : ''}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Apply modal */}
      {applyJobId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
            <h2 className="font-bold text-gray-900 mb-3">Apply to Job</h2>
            <p className="text-sm text-gray-600 mb-3">Add a cover note (optional):</p>
            <textarea
              rows={4}
              value={coverNote}
              onChange={e => setCoverNote(e.target.value)}
              placeholder="Tell them why you're a great fit…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-3"
            />
            {applyError && <p className="text-red-600 text-xs mb-2">{applyError}</p>}
            {applying ? <Loader message="Submitting application…" /> : (
              <div className="flex gap-2">
                <button onClick={handleApply}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors">
                  Submit Application (+5 pts)
                </button>
                <button onClick={() => { setApplyJobId(null); setCoverNote(''); }}
                  className="px-4 text-sm text-gray-500 hover:text-gray-700">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {newBadges.length > 0 && <BadgePopup badges={newBadges} onDismiss={() => setNewBadges([])} />}
    </div>
  );
}
