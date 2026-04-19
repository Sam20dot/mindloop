'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  getJobs, getAdminStats, createJob, updateJob, deleteJob,
  getJobApplications, updateApplicationStatus,
} from '@/lib/api';
import type { JobListing, AdminApplication, AdminJobStats } from '@/types';
import { Loader } from '@/components/ui/Loader';

type View = 'overview' | 'new-job' | 'job-detail';

const STATUS_OPTIONS = ['pending', 'reviewed', 'accepted', 'rejected'] as const;
const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700',
  reviewed: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const EMPTY_FORM = {
  title: '', description: '', requirements: '', skill_tags: '', type: 'internship',
  location: '', is_remote: false, deadline: '',
};

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const token = (session as any)?.accessToken as string;
  const userRole = (session as any)?.user?.role as string | undefined;

  const [view, setView] = useState<View>('overview');
  const [stats, setStats] = useState<AdminJobStats | null>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');
  const [editingJob, setEditingJob] = useState<JobListing | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return; }
    if (status !== 'authenticated') return;
    if (userRole && userRole !== 'admin') { router.push('/dashboard'); return; }
    loadAll();
  }, [status, userRole]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAll() {
    setLoadingStats(true);
    try {
      const [statsData, jobsData] = await Promise.all([getAdminStats(token), getJobs(token)]);
      setStats(statsData as AdminJobStats);
      setJobs(jobsData as JobListing[]);
    } catch {} finally { setLoadingStats(false); }
  }

  const loadJobApplications = useCallback(async (jobId: string) => {
    setLoadingApps(true);
    try {
      setApplications((await getJobApplications(token, jobId)) as AdminApplication[]);
    } catch {} finally { setLoadingApps(false); }
  }, [token]);

  async function handleSelectJob(job: JobListing) {
    setSelectedJob(job);
    setView('job-detail');
    await loadJobApplications(job.id);
  }

  async function handleCreateJob() {
    if (!form.title.trim() || !form.description.trim()) {
      setFormError('Title and description are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const skillTagsArray = form.skill_tags.split(',').map(s => s.trim()).filter(Boolean);
      const data = await createJob(token, {
        ...form,
        skill_tags: skillTagsArray,
        deadline: form.deadline || null,
      });
      setJobs(prev => [data as JobListing, ...prev]);
      setForm({ ...EMPTY_FORM });
      setView('overview');
      loadAll();
    } catch (e: any) {
      setFormError(e.message || 'Failed to create job.');
    } finally { setSaving(false); }
  }

  async function handleToggleActive(job: JobListing) {
    try {
      const updated = await updateJob(token, job.id, { is_active: !job.is_active });
      setJobs(prev => prev.map(j => j.id === job.id ? updated as JobListing : j));
    } catch {}
  }

  async function handleDeleteJob(jobId: string) {
    if (!confirm('Delete this job listing? This cannot be undone.')) return;
    try {
      await deleteJob(token, jobId);
      setJobs(prev => prev.filter(j => j.id !== jobId));
      if (selectedJob?.id === jobId) setView('overview');
    } catch {}
  }

  async function handleStatusChange(appId: string, appStatus: string) {
    try {
      const updated = await updateApplicationStatus(token, appId, appStatus);
      setApplications(prev => prev.map(a => a.id === appId ? updated as AdminApplication : a));
    } catch {}
  }

  if (status === 'loading' || loadingStats) {
    return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;
  }

  if (userRole && userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-2">🚫</p>
          <p className="font-semibold text-gray-700">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Manage job listings and applications</p>
          </div>
          <button onClick={() => { setView('new-job'); setForm({ ...EMPTY_FORM }); setFormError(''); }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
            + Post New Job
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Jobs', value: stats.total_jobs, color: 'indigo' },
              { label: 'Active Jobs', value: stats.active_jobs, color: 'green' },
              { label: 'Applications', value: stats.total_applications, color: 'blue' },
              { label: 'Pending Review', value: stats.pending_applications, color: 'orange' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── New Job Form ───────────────────────────── */}
        {view === 'new-job' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Post New Job</h2>
              <button onClick={() => setView('overview')} className="text-sm text-gray-400 hover:text-gray-600">← Back</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Job Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="Frontend Developer Intern" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    {['internship', 'freelance', 'entry-level', 'full-time'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="What will the intern do? What will they learn?" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Requirements</label>
                <textarea rows={2} value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="List experience, tools, or skills required" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Skill Tags (comma separated)</label>
                  <input value={form.skill_tags} onChange={e => setForm(f => ({ ...f, skill_tags: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="React, Python, SQL" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                  <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="Kigali, Rwanda" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Deadline</label>
                  <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <input type="checkbox" id="remote" checked={form.is_remote} onChange={e => setForm(f => ({ ...f, is_remote: e.target.checked }))} />
                  <label htmlFor="remote" className="text-sm text-gray-700">Remote OK</label>
                </div>
              </div>

              {formError && <p className="text-red-600 text-sm">{formError}</p>}

              {saving ? <Loader message="Posting job…" /> : (
                <button onClick={handleCreateJob}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors">
                  Post Job Listing
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Job Detail + Applications ──────────────── */}
        {view === 'job-detail' && selectedJob && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">{selectedJob.title}</h2>
              <button onClick={() => setView('overview')} className="text-sm text-gray-400 hover:text-gray-600">← Back</button>
            </div>

            <p className="text-sm text-gray-600 mb-4">{selectedJob.description}</p>

            <h3 className="font-semibold text-gray-800 mb-3">Applications ({applications.length})</h3>

            {loadingApps ? <Loader message="Loading applications…" /> : applications.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No applications yet.</p>
            ) : (
              <div className="space-y-4">
                {applications.map(app => (
                  <div key={app.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{app.applicant_name}</p>
                        <p className="text-xs text-gray-500">{app.applicant_email} · {app.applicant_level}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                          {app.ai_match_score}% match
                        </span>
                        <select value={app.status}
                          onChange={e => handleStatusChange(app.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full border-0 font-semibold cursor-pointer focus:outline-none ${STATUS_COLORS[app.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    {app.ai_match_reason && (
                      <p className="text-xs text-gray-500 mb-2">{app.ai_match_reason}</p>
                    )}
                    {app.cover_note && (
                      <p className="text-xs text-gray-600 italic border-t border-gray-200 pt-2 mt-2">
                        "{app.cover_note}"
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">Applied {new Date(app.applied_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Jobs Overview Table ────────────────────── */}
        {view === 'overview' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Job Listings ({jobs.length})</h2>
            </div>
            {jobs.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">💼</p>
                <p>No jobs yet. Post your first listing!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {jobs.map(job => (
                  <div key={job.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-50">
                    <button onClick={() => handleSelectJob(job)} className="flex-1 text-left min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{job.title}</p>
                      <p className="text-xs text-gray-400">{job.type} · {job.application_count} applications</p>
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${job.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {job.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button onClick={() => handleToggleActive(job)}
                        className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2 py-1 rounded-lg">
                        {job.is_active ? 'Pause' : 'Activate'}
                      </button>
                      <button onClick={() => handleDeleteJob(job.id)}
                        className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-2 py-1 rounded-lg">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
