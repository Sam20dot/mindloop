const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function apiFetch(path: string, options: RequestInit = {}) {
  const { headers: extraHeaders, ...restOptions } = options;
  const res = await fetch(`${API_URL}${path}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(extraHeaders as Record<string, string>),
    },
  });

  // Throw a typed sentinel so callers can distinguish auth failures
  if (res.status === 401) {
    throw new Error('UNAUTHORIZED');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.detail || 'Request failed');
  return data;
}

// ── Auth ──────────────────────────────────────────────────
export async function registerUser(name: string, email: string, password: string) {
  return apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
}

export async function loginUser(email: string, password: string) {
  return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function getMe(token: string) {
  return apiFetch('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
}

export async function getMyPoints(token: string) {
  return apiFetch('/auth/me/points', { headers: { Authorization: `Bearer ${token}` } });
}

export async function getMyBadges(token: string) {
  return apiFetch('/auth/me/badges', { headers: { Authorization: `Bearer ${token}` } });
}

// ── Sessions ──────────────────────────────────────────────
export async function startSession(token: string, topic: string, material_text: string) {
  return apiFetch('/sessions/start', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ topic, material_text }),
  });
}

export async function getSession(token: string, sessionId: string) {
  return apiFetch(`/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function completeSession(token: string, sessionId: string) {
  return apiFetch(`/sessions/${sessionId}/complete`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getSessionHistory(token: string) {
  return apiFetch('/sessions/history', { headers: { Authorization: `Bearer ${token}` } });
}

// ── Questions ─────────────────────────────────────────────
export async function generateQuestions(token: string, sessionId: string, difficulty = 'mixed') {
  return apiFetch('/questions/generate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ session_id: sessionId, difficulty }),
  });
}

export async function getQuestions(token: string, sessionId: string) {
  return apiFetch(`/questions/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Extract text from uploaded PDF or TXT (multipart — do NOT use apiFetch)
export async function extractTextFromFile(token: string, file: File): Promise<{ text: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/sessions/extract-text`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to extract text from file');
  return data;
}

// ── Skills ────────────────────────────────────────────────
export async function getMySkills(token: string) {
  return apiFetch('/skills/me', { headers: { Authorization: `Bearer ${token}` } });
}

export async function addSkill(token: string, name: string, level: string) {
  return apiFetch('/skills/add', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, level }),
  });
}

// ── CV ────────────────────────────────────────────────────
export async function generateCV(token: string) {
  return apiFetch('/cv/generate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** Always resolves to { exists: boolean, cv: CVEntry | null } — never throws on missing CV */
export async function getMyCV(token: string) {
  return apiFetch('/cv/me', { headers: { Authorization: `Bearer ${token}` } });
}

export async function getCV(token: string, userId: string) {
  return apiFetch(`/cv/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
}

// ── Roadmap ───────────────────────────────────────────────
export async function generateRoadmap(token: string, skillName: string) {
  return apiFetch('/roadmap/generate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ skill_name: skillName }),
  });
}

export async function getRoadmaps(token: string, userId: string) {
  return apiFetch(`/roadmap/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
}

export async function updateRoadmapStep(token: string, roadmapId: string, stepOrder: number, completed: boolean) {
  return apiFetch(`/roadmap/${roadmapId}/steps`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ step_order: stepOrder, completed }),
  });
}

export async function updateStepStatus(token: string, roadmapId: string, stepOrder: number, stepStatus: string) {
  return apiFetch('/roadmap/step/status', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ roadmap_id: roadmapId, step_order: stepOrder, status: stepStatus }),
  });
}

export async function generateStepQuiz(token: string, roadmapId: string, stepOrder: number) {
  return apiFetch('/roadmap/step/quiz', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ roadmap_id: roadmapId, step_order: stepOrder }),
  });
}

export async function verifyStep(
  token: string,
  roadmapId: string,
  stepOrder: number,
  verificationType: string,
  proof: string,
  quizAnswers?: { question: string; correct_answer: string; user_answer: string }[],
) {
  return apiFetch('/roadmap/step/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      roadmap_id: roadmapId,
      step_order: stepOrder,
      verification_type: verificationType,
      proof,
      quiz_answers: quizAnswers ?? [],
    }),
  });
}

// ── Opportunities ─────────────────────────────────────────
export async function getOpportunities(token: string) {
  return apiFetch('/opportunities/', { headers: { Authorization: `Bearer ${token}` } });
}

export async function getMatchedOpportunities(token: string) {
  return apiFetch('/opportunities/match', { headers: { Authorization: `Bearer ${token}` } });
}

export async function refreshMatchedOpportunities(token: string) {
  return apiFetch('/opportunities/match/refresh', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function logOpportunityView(token: string, opportunityId: string) {
  return apiFetch(`/opportunities/${opportunityId}/view`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function saveOpportunity(token: string, opportunityId: string) {
  return apiFetch(`/opportunities/${opportunityId}/save`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function unsaveOpportunity(token: string, opportunityId: string) {
  return apiFetch(`/opportunities/${opportunityId}/save`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getSavedOpportunities(token: string) {
  return apiFetch('/opportunities/saved', { headers: { Authorization: `Bearer ${token}` } });
}

export async function getSkillGaps(token: string) {
  return apiFetch('/opportunities/skill-gaps', { headers: { Authorization: `Bearer ${token}` } });
}

export async function getOpportunityStats(token: string) {
  return apiFetch('/opportunities/stats', { headers: { Authorization: `Bearer ${token}` } });
}

// ── Community ─────────────────────────────────────────────
export async function getCommunityFeed(token: string, page = 1) {
  return apiFetch(`/community/feed?page=${page}`, { headers: { Authorization: `Bearer ${token}` } });
}

export async function createPost(token: string, type: string, content: string) {
  return apiFetch('/community/posts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ type, content }),
  });
}

export async function likePost(token: string, postId: string) {
  return apiFetch(`/community/posts/${postId}/like`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function unlikePost(token: string, postId: string) {
  return apiFetch(`/community/posts/${postId}/like`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Leaderboard ───────────────────────────────────────────
export async function getLeaderboardPoints(token: string) {
  return apiFetch('/leaderboard/points', { headers: { Authorization: `Bearer ${token}` } });
}

export async function getLeaderboardSkills(token: string) {
  return apiFetch('/leaderboard/skills', { headers: { Authorization: `Bearer ${token}` } });
}

export async function getLeaderboardWeekly(token: string) {
  return apiFetch('/leaderboard/weekly', { headers: { Authorization: `Bearer ${token}` } });
}

export async function getMyRanks(token: string) {
  return apiFetch('/leaderboard/me', { headers: { Authorization: `Bearer ${token}` } });
}

export async function getMaterialCount(token: string): Promise<number> {
  const data = await apiFetch('/library/', { headers: { Authorization: `Bearer ${token}` } });
  return Array.isArray(data) ? data.length : 0;
}

// ── Challenges ────────────────────────────────────────────
export async function getCurrentChallenge(token: string) {
  const data = await apiFetch('/challenges/current', { headers: { Authorization: `Bearer ${token}` } });
  return data.challenge ?? null;
}

// ── Library ───────────────────────────────────────────────────
export async function getMaterials(token: string) {
  return apiFetch('/library/', { headers: { Authorization: `Bearer ${token}` } });
}

export async function getMaterial(token: string, id: string) {
  return apiFetch(`/library/${id}`, { headers: { Authorization: `Bearer ${token}` } });
}

export async function deleteMaterial(token: string, id: string) {
  return fetch(`${API_URL}/library/${id}/delete`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function uploadMaterialFile(token: string, file: File, title?: string): Promise<any> {
  const form = new FormData();
  form.append('file', file);
  if (title) form.append('title', title);
  const res = await fetch(`${API_URL}/library/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export async function uploadMaterialUrl(token: string, url: string, type: 'url' | 'youtube', title?: string) {
  return apiFetch('/library/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ type, url, title: title ?? '' }),
  });
}

// ── Jobs ──────────────────────────────────────────────────────
export async function getJobs(token: string) {
  return apiFetch('/jobs/', { headers: { Authorization: `Bearer ${token}` } });
}

export async function matchJobs(token: string) {
  return apiFetch('/jobs/match', { headers: { Authorization: `Bearer ${token}` } });
}

export async function applyToJob(token: string, jobId: string, coverNote: string) {
  return apiFetch(`/jobs/apply/${jobId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ cover_note: coverNote }),
  });
}

export async function getMyApplications(token: string) {
  return apiFetch('/jobs/my-applications', { headers: { Authorization: `Bearer ${token}` } });
}

export async function createJob(token: string, data: Record<string, unknown>) {
  return apiFetch('/jobs/admin/create', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function updateJob(token: string, jobId: string, data: Record<string, unknown>) {
  return apiFetch(`/jobs/admin/${jobId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function deleteJob(token: string, jobId: string) {
  return apiFetch(`/jobs/admin/${jobId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getJobApplications(token: string, jobId: string) {
  return apiFetch(`/jobs/admin/${jobId}/applications`, { headers: { Authorization: `Bearer ${token}` } });
}

export async function updateApplicationStatus(token: string, appId: string, appStatus: string) {
  return apiFetch(`/jobs/admin/applications/${appId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: appStatus }),
  });
}

export async function getAdminStats(token: string) {
  return apiFetch('/jobs/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
}

// ── Answers ───────────────────────────────────────────────
export async function submitAnswer(token: string, questionId: string, userResponse: string) {
  return apiFetch('/answers/submit', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ question_id: questionId, user_response: userResponse }),
  });
}
