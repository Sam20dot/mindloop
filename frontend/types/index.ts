export interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  level: string;
  role: 'student' | 'admin';
  current_streak: number;
  longest_streak: number;
  created_at: string;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  earned_at: string;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

export interface LearningSession {
  id: string;
  topic: string;
  material_text: string;
  status: 'active' | 'completed' | 'abandoned';
  started_at: string;
  completed_at: string | null;
}

export interface Question {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'critical';
  question_type: 'multiple_choice' | 'open_ended';
  correct_answer: string;
}

export interface AnswerResult {
  answer_id: string;
  score: number;
  feedback: string;
  encouragement: string;
  points_awarded: number;
  new_total_points: number;
  new_badges: string[];
}

export interface Skill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  source: 'learning' | 'manual';
  earned_at: string;
}

export interface CVSkillEntry {
  name: string;
  level: string;
  description: string;
}

export interface CVAchievement {
  title: string;
  description: string;
}

export interface CVContent {
  summary: string;
  skills_section: CVSkillEntry[];
  achievements_section: CVAchievement[];
}

export interface CVEntry {
  id: string;
  summary: string;
  content: CVContent;
  generated_at: string;
}

export interface RoadmapStep {
  order: number;
  title: string;
  description: string;
  estimated_weeks: number;
  verification_type?: 'quiz' | 'github' | 'reflection';
  status?: 'not_started' | 'in_progress' | 'completed';
  verified?: boolean;
  verified_at?: string | null;
  proof_url?: string | null;
  proof_text?: string | null;
}

export interface QuizQuestion {
  question: string;
  correct_answer: string;
  user_answer?: string;
}

export interface VerifyStepResult {
  passed: boolean;
  feedback: string;
  roadmap: Roadmap;
  points_awarded: number;
  new_badges: string[];
}

export interface RoadmapProject {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface RoadmapResource {
  title: string;
  type: 'video' | 'article' | 'course' | 'book';
  url: string;
}

export interface Roadmap {
  id: string;
  skill_name: string;
  steps: RoadmapStep[];
  projects: RoadmapProject[];
  resources: RoadmapResource[];
  estimated_weeks: number;
  completed_steps: number[];
  created_at: string;
}

export interface MatchedOpportunity {
  id: string;
  opportunity_id: string | null;
  title: string;
  type: 'freelance' | 'internship' | 'entry-level';
  match_score: number;
  match_reason: string;
  action_steps: string[];
  source_url: string;
  skill_tags: string[];
  description: string;
  is_saved: boolean;
  generated_at: string;
}

export interface OpportunityMatchResult {
  opportunities: MatchedOpportunity[];
  cached: boolean;
}

export interface SavedOpportunity {
  id: string;
  opportunity_id: string;
  title: string;
  type: 'freelance' | 'internship' | 'entry-level';
  skill_tags: string[];
  description: string;
  source_url: string;
  saved_at: string;
}

export interface SkillGapRecommendation {
  name: string;
  reason: string;
  opportunities_unlocked: number;
}

export interface OpportunityStats {
  matched_count: number;
  saved_count: number;
}

export interface Post {
  id: string;
  user_name: string;
  user_level: string;
  user_initials: string;
  type: 'achievement' | 'cv_share' | 'opportunity_share' | 'learning_update';
  content: string;
  like_count: number;
  is_liked: boolean;
  created_at: string;
}

export interface CommunityFeedResult {
  results: Post[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  initials: string;
  level: string;
  value: number;
}

export interface MyRanks {
  points_rank: number | null;
  skills_rank: number | null;
  weekly_rank: number | null;
  total_users: number;
}

export interface Material {
  id: string;
  title: string;
  type: 'pdf' | 'docx' | 'text' | 'url' | 'youtube';
  content_text?: string;
  source_url?: string;
  created_at: string;
}

export interface JobListing {
  id: string;
  title: string;
  description: string;
  requirements: string;
  skill_tags: string[];
  type: 'internship' | 'freelance' | 'entry-level' | 'full-time';
  location: string;
  is_remote: boolean;
  posted_by_name: string;
  deadline: string | null;
  is_active: boolean;
  created_at: string;
  application_count: number;
}

export interface JobApplication {
  id: string;
  job: string;
  job_title: string;
  job_type: string;
  cover_note: string;
  cv_snapshot: Record<string, unknown>;
  ai_match_score: number;
  ai_match_reason: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  applied_at: string;
}

export interface JobMatchResult {
  job_id: string;
  title: string;
  type: string;
  location: string;
  is_remote: boolean;
  skill_tags: string[];
  deadline: string | null;
  match_score: number;
  match_reason: string;
  missing_skills: string[];
  strengths: string[];
}

export interface AdminApplication {
  id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_level: string;
  cover_note: string;
  cv_snapshot: Record<string, unknown>;
  ai_match_score: number;
  ai_match_reason: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  applied_at: string;
}

export interface AdminJobStats {
  total_jobs: number;
  active_jobs: number;
  total_applications: number;
  pending_applications: number;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  target_sessions: number;
  bonus_points: number;
  week_start: string;
  week_end: string;
  completed_sessions: number;
  bonus_awarded: boolean;
}
