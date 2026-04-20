# MindLoop — Complete Technical Book

> Written for developers who want to understand, maintain, extend, or rebuild the MindLoop platform.
> Every chapter is based on the actual source code in this repository.

---

## Table of Contents

1. [Project Overview](#chapter-1-project-overview)
2. [Project Structure](#chapter-2-project-structure)
3. [Database Design](#chapter-3-database-design)
4. [Backend — Django](#chapter-4-backend-django)
5. [AI Integration — Claude API](#chapter-5-ai-integration-claude-api)
6. [Frontend — Next.js](#chapter-6-frontend-nextjs)
7. [Gamification System](#chapter-7-gamification-system)
8. [Deployment](#chapter-8-deployment)
9. [How to Build From Scratch](#chapter-9-how-to-build-from-scratch)
10. [How to Add New Features](#chapter-10-how-to-add-new-features)

---

# Chapter 1: Project Overview

## What is MindLoop?

MindLoop is an AI-powered learning, career development, and economic opportunity platform. It transforms students from passive readers into career-ready, skill-driven individuals by combining structured learning sessions with Claude AI evaluation, gamification, and real job/opportunity matching.

### The Problem It Solves

| Problem | How MindLoop solves it |
|---------|----------------------|
| Students lose focus while learning | Structured sessions with AI-generated comprehension questions |
| Students don't know what skills lead to jobs | AI career roadmaps + opportunity matching based on actual skills |
| No structured portfolio or CV | Auto-generated CV that updates after every session |
| No connection to real economic opportunities | Job board + AI matching + skill gap analysis |
| No motivation to keep learning | Gamification: points, badges, streaks, leaderboards |

### Target Users
- University and high school students
- Self-learners and job seekers
- Young professionals in Africa and globally

---

## The Full User Journey

```
1.  User registers / logs in (NextAuth + JWT)
2.  Dashboard loads → shows points, badges, skills, recent sessions, streak
3.  User uploads study material to the Library (PDF, URL, YouTube)
4.  User starts a Learning Session on a topic
5.  User pastes or selects their study material
6.  Clicks "Generate Questions" → Claude creates 5–8 questions
7.  User answers each question one by one
8.  Each answer → Claude evaluates it → score (0-100) + feedback shown
9.  Session completes → points awarded → streak updated → badges checked
10. Claude extracts skills from the session and saves them
11. CV auto-updates with new skills
12. Career Roadmap generated → 4-7 step plan with projects and resources
13. Opportunity matching runs → Claude ranks real opportunities by fit
14. Jobs board → user can apply with AI matching score
15. Community feed → user shares achievements
16. Leaderboard → user competes with others
```

---

## Tech Stack

| Layer | Technology | Why this was chosen |
|-------|-----------|-------------------|
| Frontend | Next.js 16 (App Router) | Server-side rendering, file-based routing, Vercel deployment |
| Styling | Tailwind CSS v4 | Utility-first, no CSS files needed, fast iteration |
| Auth | NextAuth v4 | Handles JWT sessions, refresh tokens, multiple providers |
| Backend | Django 5 + DRF | Mature, batteries-included, excellent ORM, easy REST APIs |
| Database | PostgreSQL 17 | Relational, supports JSONB for flexible AI-generated content |
| AI | Anthropic Claude API | Best model for structured JSON output, long context, reasoning |
| File Parsing | pdfplumber, python-docx, BeautifulSoup | Extract text from PDFs, Word docs, web pages |
| Math Rendering | KaTeX | Render LaTeX math formulas in questions/answers |
| Hosting — Backend | Railway | Auto-deploys from GitHub, managed PostgreSQL, env vars |
| Hosting — Frontend | Vercel | Zero-config Next.js deployment, global CDN |
| Language | TypeScript (frontend), Python (backend) | Type safety prevents bugs at both ends |

---

# Chapter 2: Project Structure

## Full Folder Structure

```
/mindloop                          ← Project root
├── .env                           ← Secret keys (NEVER commit this)
├── .gitignore                     ← What Git ignores
├── CLAUDE.md                      ← Instructions for Claude Code AI
├── MINDLOOP_BOOK.md               ← This file
├── QUICK_REFERENCE.md             ← Quick lookup table
│
├── /backend                       ← Django project (deployed to Railway)
│   ├── Procfile                   ← Railway startup command
│   ├── runtime.txt                ← Python version for Railway
│   ├── railway.json               ← Railway deploy config
│   ├── requirements.txt           ← Python packages
│   ├── manage.py                  ← Django management tool
│   │
│   ├── /mindloop_project          ← Django project settings
│   │   ├── settings.py            ← All configuration
│   │   ├── urls.py                ← Root URL routing
│   │   ├── wsgi.py                ← WSGI server entry point
│   │   └── asgi.py                ← ASGI server entry point
│   │
│   ├── /apps                      ← All Django applications
│   │   ├── /users                 ← Auth, profiles, leaderboard
│   │   ├── /learning_sessions     ← Study session lifecycle
│   │   ├── /questions             ← AI-generated questions
│   │   ├── /answers               ← User answers + AI evaluation
│   │   ├── /skills                ← Skill tracking
│   │   ├── /cv                    ← AI-generated CV
│   │   ├── /roadmap               ← Career roadmaps
│   │   ├── /opportunities         ← Job/freelance opportunities
│   │   ├── /community             ← Social feed
│   │   ├── /challenges            ← Weekly learning challenges
│   │   ├── /library               ← Study material storage
│   │   └── /jobs                  ← Job board + applications
│   │
│   └── /ai                        ← All Claude API logic
│       ├── question_generator.py
│       ├── answer_evaluator.py
│       ├── roadmap_generator.py
│       ├── cv_generator.py
│       ├── opportunity_matcher.py
│       ├── skill_extractor.py
│       ├── job_matcher.py
│       ├── roadmap_verifier.py
│       └── skill_gap_analyzer.py
│
└── /frontend                      ← Next.js project (deployed to Vercel)
    ├── next.config.ts             ← Next.js configuration
    ├── package.json               ← Node.js dependencies
    ├── tsconfig.json              ← TypeScript configuration
    ├── postcss.config.mjs         ← PostCSS/Tailwind config
    │
    ├── /app                       ← Next.js App Router pages
    │   ├── layout.tsx             ← Root layout (Navbar, SessionProvider)
    │   ├── page.tsx               ← Landing page (/)
    │   ├── globals.css            ← Global styles + dark mode
    │   ├── /dashboard             ← /dashboard
    │   ├── /learn                 ← /learn
    │   ├── /library               ← /library
    │   ├── /career                ← /career
    │   ├── /cv                    ← /cv
    │   ├── /opportunities         ← /opportunities
    │   ├── /community             ← /community
    │   ├── /leaderboard           ← /leaderboard
    │   ├── /auth                  ← /auth/login, /auth/register
    │   ├── /admin-dashboard       ← /admin-dashboard
    │   └── /api/auth/[...nextauth] ← NextAuth API routes
    │
    ├── /components                ← Reusable React components
    │   ├── /ui                    ← Generic UI primitives
    │   ├── /learning              ← Learning session components
    │   ├── /career                ← Roadmap components
    │   ├── /cv                    ← CV components
    │   ├── /community             ← Community components
    │   ├── /library               ← Library components
    │   ├── /opportunities         ← Opportunity components
    │   └── /leaderboard           ← Leaderboard components
    │
    ├── /lib                       ← Utility functions
    │   ├── api.ts                 ← All backend API calls
    │   └── auth.ts                ← NextAuth configuration
    │
    └── /types                     ← TypeScript type definitions
        └── index.ts               ← All interfaces/types
```

---

## How Frontend and Backend Communicate

```
Vercel (Next.js)                    Railway (Django)
     │                                     │
     │  1. User action (button click)       │
     │  2. frontend/lib/api.ts called       │
     │  3. fetch(BASE_URL + /api/v1/...)    │
     │ ──────────────────────────────────► │
     │     Authorization: Bearer <JWT>      │
     │                                     │
     │                          4. Django middleware:
     │                             - CORS check
     │                             - JWT decode
     │                             - Permission check
     │                             - Route to view
     │                             - AI call if needed
     │                             - DB read/write
     │                                     │
     │ ◄────────────────────────────────── │
     │  5. JSON response                   │
     │  6. React state update              │
     │  7. UI re-renders                   │
```

The `BASE_URL` is set via `NEXT_PUBLIC_API_URL` environment variable on Vercel.
In `frontend/lib/api.ts`:
```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.detail || 'Request failed');
  return data;
}
```

Every protected API call includes the JWT:
```typescript
export async function getMySkills(token: string) {
  return apiFetch('/skills/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
}
```

---

# Chapter 3: Database Design

## Overview

The database is PostgreSQL 17. All access goes through Django's ORM — no raw SQL. Most primary keys are UUIDs for security (harder to enumerate than sequential integers).

---

## Table: `users_user` (custom User model)

This replaces Django's built-in User model. It uses email instead of username.

```python
# backend/apps/users/models.py
class User(AbstractBaseUser, PermissionsMixin):
    id                    = UUIDField(primary_key=True, default=uuid4)
    name                  = CharField(max_length=255)
    email                 = EmailField(unique=True)        # Used as login
    points                = IntegerField(default=0)        # Gamification
    level                 = CharField(default='beginner')  # Computed from points
    current_streak        = IntegerField(default=0)        # Days in a row
    longest_streak        = IntegerField(default=0)        # Best streak ever
    last_session_date     = DateField(null=True)           # For streak tracking
    streak_freeze_used    = BooleanField(default=False)    # One-time freeze
    streak_freeze_available = BooleanField(default=True)
    role                  = CharField(choices=['student','admin'], default='student')
    is_active             = BooleanField(default=True)
    is_staff              = BooleanField(default=False)
    created_at            = DateTimeField(auto_now_add=True)
```

**Level thresholds** (computed by `update_level()` method):
```
0    pts → beginner
100  pts → explorer
300  pts → learner
600  pts → achiever
1000 pts → expert
2000 pts → master
```

---

## Table: `users_badge`

```python
class Badge(models.Model):
    id         = UUIDField(primary_key=True)
    user       = ForeignKey(User, related_name='badges')  # Many badges per user
    name       = CharField(max_length=100)                 # e.g. "Focus Master"
    earned_at  = DateTimeField(auto_now_add=True)
```

---

## Table: `learning_sessions_learningsession`

```python
class LearningSession(models.Model):
    id            = UUIDField(primary_key=True)
    user          = ForeignKey(User)
    topic         = CharField(max_length=255)    # e.g. "Python for Data Science"
    material_text = TextField()                  # The study material pasted by user
    status        = CharField(choices=['active','completed','abandoned'])
    started_at    = DateTimeField(auto_now_add=True)
    completed_at  = DateTimeField(null=True)
```

---

## Table: `questions_question`

```python
class Question(models.Model):
    id             = UUIDField(primary_key=True)
    session        = ForeignKey(LearningSession)
    text           = TextField()                  # The question itself
    difficulty     = CharField(choices=['easy','medium','critical'])
    question_type  = CharField(choices=['multiple_choice','open_ended'])
    correct_answer = TextField()                  # Used for evaluation
```

---

## Table: `answers_answer`

```python
class Answer(models.Model):
    id            = UUIDField(primary_key=True)
    question      = ForeignKey(Question)
    user          = ForeignKey(User)
    user_response = TextField()
    score         = IntegerField()        # 0-100, set by Claude
    feedback      = TextField()           # AI-generated encouragement
    submitted_at  = DateTimeField(auto_now_add=True)
```

---

## Table: `skills_skill`

```python
class Skill(models.Model):
    id        = UUIDField(primary_key=True)
    user      = ForeignKey(User, related_name='skills')
    name      = CharField(max_length=255)              # e.g. "Python"
    level     = CharField(choices=['beginner','intermediate','advanced'])
    source    = CharField(choices=['learning','manual']) # How it was earned
    earned_at = DateTimeField(auto_now_add=True)
```

---

## Table: `cv_cventry`

```python
class CVEntry(models.Model):
    id           = UUIDField(primary_key=True)
    user         = ForeignKey(User)
    summary      = TextField()         # Short bio paragraph
    content      = JSONField()         # Full structured CV from Claude
    generated_at = DateTimeField(auto_now_add=True)
```

The `content` JSONField stores:
```json
{
  "summary": "...",
  "skills_section": [{"skill": "Python", "level": "intermediate"}],
  "achievements_section": ["Completed 10 sessions", "Earned Focus Master badge"]
}
```

---

## Table: `roadmap_roadmap`

```python
class Roadmap(models.Model):
    id              = UUIDField(primary_key=True)
    user            = ForeignKey(User)
    skill_name      = CharField(max_length=255)    # e.g. "Machine Learning"
    steps           = JSONField()                  # Array of step objects
    projects        = JSONField(default=list)
    resources       = JSONField(default=list)
    completed_steps = JSONField(default=list)      # Indices of verified steps
    estimated_weeks = IntegerField(default=8)
    created_at      = DateTimeField(auto_now_add=True)
```

Steps JSONField structure:
```json
[
  {
    "order": 1,
    "title": "Learn Python basics",
    "description": "...",
    "duration_weeks": 2,
    "verification_type": "quiz",
    "status": "not_started"
  }
]
```

---

## Table: `opportunities_opportunity`

```python
class Opportunity(models.Model):
    id          = UUIDField(primary_key=True)
    title       = CharField(max_length=255)
    type        = CharField(choices=['freelance','internship','entry-level'])
    skill_tags  = JSONField()              # ["Python", "Django"]
    description = TextField()
    source_url  = CharField(null=True)
    posted_at   = DateTimeField(auto_now_add=True)
```

---

## Table: `jobs_joblisting`

```python
class JobListing(models.Model):
    id          = UUIDField(primary_key=True)
    title       = CharField(max_length=255)
    company     = CharField(max_length=255)
    type        = CharField(choices=['internship','freelance','entry-level','full-time'])
    description = TextField()
    skill_tags  = JSONField()
    deadline    = DateTimeField(null=True)
    is_active   = BooleanField(default=True)
    created_at  = DateTimeField(auto_now_add=True)
```

---

## Table: `jobs_application`

```python
class Application(models.Model):
    id          = UUIDField(primary_key=True)
    job         = ForeignKey(JobListing)
    user        = ForeignKey(User)
    cover_note  = TextField()
    match_score = IntegerField(default=0)   # Set by Claude job matcher
    status      = CharField(choices=['pending','reviewed','accepted','rejected'])
    applied_at  = DateTimeField(auto_now_add=True)
```

---

## Table: `library_material`

```python
class Material(models.Model):
    id           = UUIDField(primary_key=True)
    user         = ForeignKey(User)
    title        = CharField(max_length=255)
    type         = CharField(choices=['pdf','docx','text','url','youtube'])
    content_text = TextField()              # Extracted text for AI
    source_url   = CharField(null=True)
    created_at   = DateTimeField(auto_now_add=True)
```

---

## Table: `community_post`

```python
class Post(models.Model):
    id         = UUIDField(primary_key=True)
    user       = ForeignKey(User)
    type       = CharField(choices=['achievement','cv_share','opportunity_share','learning_update'])
    content    = TextField(max_length=500)
    created_at = DateTimeField(auto_now_add=True)
```

---

## Table: `challenges_weeklychallenge`

```python
class WeeklyChallenge(models.Model):
    id             = UUIDField(primary_key=True)
    title          = CharField(max_length=255)   # e.g. "Complete 5 sessions"
    description    = TextField()
    target_sessions = IntegerField()
    bonus_points   = IntegerField()
    week_start     = DateField()
    week_end       = DateField()
    is_active      = BooleanField(default=True)
```

---

## Table Relationships Diagram

```
User ──┬──< LearningSession ──< Question ──< Answer
       ├──< Skill
       ├──< CVEntry
       ├──< Roadmap
       ├──< Badge
       ├──< Post ──< PostLike
       ├──< Material
       ├──< Application >── JobListing
       ├──< MatchedOpportunity >── Opportunity
       └──< SavedOpportunity >── Opportunity
```

---

# Chapter 4: Backend (Django)

## Django Setup

The backend is a standard Django project with Django REST Framework (DRF). Here is the key `settings.py` configuration:

```python
# backend/mindloop_project/settings.py

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'dev-fallback-key')
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

# Allow all hosts (set ALLOWED_HOSTS env var to restrict in production)
_allowed = os.environ.get('ALLOWED_HOSTS', '')
ALLOWED_HOSTS = [h.strip() for h in _allowed.split(',') if h.strip()] if _allowed else ['*']

# Database: use DATABASE_URL from Railway, or individual vars for local
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600)}
else:
    DATABASES = {'default': {'ENGINE': 'django.db.backends.postgresql', ...}}
```

### Key Middleware (order matters!)

```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',      # 1st: CORS headers before everything
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # Serves static files
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    ...
]
```

### DRF Authentication

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}
```

---

## How JWT Authentication Works

```
Step 1 — Login
  POST /api/v1/auth/login
  Body: { "email": "...", "password": "..." }
  Returns: { "access": "<JWT>", "refresh": "<refresh_token>", "user": {...} }

Step 2 — Making authenticated requests
  Every request includes header:
  Authorization: Bearer <access_JWT>
  
Step 3 — JWT expires (after 1 hour)
  Frontend calls: POST /api/v1/auth/token/refresh
  Body: { "refresh": "<refresh_token>" }
  Returns: { "access": "<new_JWT>" }
  
Step 4 — This happens automatically in frontend/lib/auth.ts
  The NextAuth jwt() callback checks if the token has expired.
  If expired, it calls refreshAccessToken() silently.
```

---

## App: `users`

Handles registration, login, user profiles, and leaderboards.

### Register

```python
# POST /api/v1/auth/register
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=201)
    # Returns first error as a readable string
    return Response({'error': readable_error, 'errors': serializer.errors}, status=400)
```

`RegisterSerializer` accepts: `name`, `email`, `password` (min 8 chars).

### Login

```python
# POST /api/v1/auth/login
def login(request):
    user = authenticate(request, username=email, password=password)
    if user is None:
        return Response({'error': 'Invalid credentials.'}, status=401)
    refresh = RefreshToken.for_user(user)
    return Response({'user': ..., 'access': ..., 'refresh': ...})
```

### Leaderboard

Three leaderboard types:

```python
# GET /api/v1/leaderboard/points   — top 20 by total points
# GET /api/v1/leaderboard/skills   — top 20 by skill count
# GET /api/v1/leaderboard/weekly   — top 20 by points earned this week
# GET /api/v1/leaderboard/me       — current user's rank on all three
```

---

## App: `learning_sessions`

The core of the platform. Manages the lifecycle of a study session.

### Start Session

```python
# POST /api/v1/sessions/start
# Body: { "topic": "...", "material_text": "..." }
def start_session(request):
    session = LearningSession.objects.create(
        user=request.user,
        topic=data['topic'],
        material_text=data['material_text'],
        status='active'
    )
    # Award 5 points for reading
    request.user.points += 5
    request.user.save()
    return Response(SessionSerializer(session).data, status=201)
```

### Complete Session

This is the most complex endpoint — it does many things in sequence:

```python
# PATCH /api/v1/sessions/:id/complete
def complete_session(request, session_id):
    session.status = 'completed'
    session.completed_at = now()
    session.save()
    
    # 1. Award 20 points for completion
    # 2. Update streak (check if consecutive day)
    # 3. Check and award streak badges
    # 4. Extract skills from session using Claude
    # 5. Auto-generate CV
    # 6. Update challenge progress
    
    return Response({
        'session': ...,
        'points_earned': 20,
        'new_badges': [...],
        'skills_extracted': [...]
    })
```

---

## App: `questions`

### Generate Questions

```python
# POST /api/v1/questions/generate
# Body: { "session_id": "...", "difficulty": "mixed" }
def generate_questions(request):
    session = get_object_or_404(LearningSession, id=data['session_id'])
    
    # Delete old questions for this session
    Question.objects.filter(session=session).delete()
    
    # Call Claude AI
    questions_data = generate_questions_ai(
        topic=session.topic,
        material_text=session.material_text,
        difficulty=data.get('difficulty', 'mixed')
    )
    
    # Save to database
    for q in questions_data['questions']:
        Question.objects.create(session=session, ...)
    
    return Response({'questions': [...]})
```

---

## App: `answers`

### Submit Answer

```python
# POST /api/v1/answers/submit
# Body: { "question_id": "...", "user_response": "..." }
def submit_answer(request):
    result = evaluate_answer_ai(
        question_text=question.text,
        correct_answer=question.correct_answer,
        user_response=data['user_response']
    )
    
    answer = Answer.objects.create(
        question=question,
        user=request.user,
        user_response=data['user_response'],
        score=result['score'],
        feedback=result['feedback']
    )
    
    # Award 10 points if score >= 70
    if result['score'] >= 70:
        request.user.points += 10
        request.user.save()
    
    # Check Quick Learner badge (90+ on first attempt)
    check_quick_learner_badge(request.user, answer)
    
    return Response({'score': ..., 'feedback': ..., 'points_earned': ...})
```

---

## App: `cv`

### Generate CV

```python
# POST /api/v1/cv/generate
def generate_cv(request):
    user = request.user
    skills = Skill.objects.filter(user=user)
    sessions = LearningSession.objects.filter(user=user, status='completed')
    badges = Badge.objects.filter(user=user)
    
    cv_data = generate_cv_ai(
        user_name=user.name,
        skills=list(skills.values()),
        session_history=list(sessions.values()),
        badges=list(badges.values())
    )
    
    # Update or create CV entry
    CVEntry.objects.update_or_create(
        user=user,
        defaults={'summary': cv_data['summary'], 'content': cv_data}
    )
    
    # Award 30 points
    user.points += 30
    user.save()
    
    return Response(cv_data)
```

---

## App: `roadmap`

The roadmap app lets users generate a step-by-step career path for any skill.

### Step Verification

Each step can be verified three ways:
- `quiz` — Claude generates 3 questions, user answers them
- `github` — User pastes a GitHub link as proof
- `reflection` — User writes a reflection, Claude grades it

```python
# POST /api/v1/roadmap/step/verify
def verify_step(request):
    if verification_type == 'quiz':
        result = verify_step_ai(
            step_info=step,
            verification_type='quiz',
            quiz_answers=data['quiz_answers']
        )
    elif verification_type in ['github', 'reflection']:
        result = verify_step_ai(
            step_info=step,
            verification_type=verification_type,
            proof=data['proof']
        )
    
    if result['passed']:
        roadmap.completed_steps.append(step_order)
        roadmap.save()
        # Create skill, update CV, check badges
```

---

## App: `library`

Stores study materials. Supports multiple source types with automatic text extraction.

### File Upload Flow

```python
# POST /api/v1/library/upload (multipart form)
def upload_material(request):
    if request.FILES.get('file'):
        file = request.FILES['file']
        if file.name.endswith('.pdf'):
            text = extract_pdf_text(file)       # pdfplumber
        elif file.name.endswith('.docx'):
            text = extract_docx_text(file)      # python-docx
        elif file.name.endswith('.txt'):
            text = file.read().decode('utf-8')
    
    elif data.get('type') == 'url':
        text = scrape_url_text(data['url'])     # BeautifulSoup
    
    elif data.get('type') == 'youtube':
        # Store URL, note that YouTube transcripts are not auto-fetched
        text = f"YouTube video: {data['url']}"
    
    Material.objects.create(user=user, title=title, type=type, content_text=text)
    # Award 10 points
```

---

## All API Endpoints

### Auth (`/api/v1/auth/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Create account → returns JWT |
| POST | `/auth/login` | No | Login → returns JWT |
| POST | `/auth/logout` | Yes | Blacklist refresh token |
| GET | `/auth/me` | Yes | Current user profile |
| GET | `/auth/me/points` | Yes | User points + level |
| GET | `/auth/me/badges` | Yes | User's earned badges |
| POST | `/auth/token/refresh` | No | Get new access token |

### Sessions (`/api/v1/sessions/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/sessions/start` | Yes | Start a new learning session |
| GET | `/sessions/:id` | Yes | Get session details |
| PATCH | `/sessions/:id/complete` | Yes | Complete session → awards points/skills/CV |
| GET | `/sessions/history` | Yes | All completed sessions |
| POST | `/sessions/extract-text` | Yes | Extract text from uploaded file |

### Questions (`/api/v1/questions/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/questions/generate` | Yes | Generate questions via Claude |
| GET | `/questions/:session_id` | Yes | Get questions for a session |

### Answers (`/api/v1/answers/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/answers/submit` | Yes | Submit answer → Claude evaluates |
| GET | `/answers/:session_id` | Yes | All answers for a session |

### Skills (`/api/v1/skills/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/skills/me` | Yes | Current user's skills |
| POST | `/skills/add` | Yes | Manually add a skill |

### CV (`/api/v1/cv/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/cv/generate` | Yes | Generate CV via Claude |
| GET | `/cv/me` | Yes | Get current user's CV |
| GET | `/cv/:user_id` | Yes | Get any user's CV |

### Roadmap (`/api/v1/roadmap/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/roadmap/generate` | Yes | Generate career roadmap via Claude |
| GET | `/roadmap/:user_id` | Yes | Get user's saved roadmaps |
| PATCH | `/roadmap/:id/steps` | Yes | Mark step complete/incomplete |
| PATCH | `/roadmap/step/status` | Yes | Update step status |
| POST | `/roadmap/step/quiz` | Yes | Generate quiz for a step |
| POST | `/roadmap/step/verify` | Yes | Verify step completion |

### Opportunities (`/api/v1/opportunities/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/opportunities/` | Yes | All opportunities |
| GET | `/opportunities/match` | Yes | AI-matched opportunities |
| POST | `/opportunities/match/refresh` | Yes | Force re-run AI matching |
| POST | `/opportunities/:id/view` | Yes | Log a view (for Opportunity Seeker badge) |
| POST | `/opportunities/:id/save` | Yes | Save an opportunity |
| DELETE | `/opportunities/:id/save` | Yes | Unsave an opportunity |
| GET | `/opportunities/saved` | Yes | Saved opportunities |
| GET | `/opportunities/skill-gaps` | Yes | AI skill gap analysis |
| GET | `/opportunities/stats` | Yes | View/save stats |

### Community (`/api/v1/community/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/community/feed?page=N` | Yes | Paginated community feed |
| POST | `/community/posts` | Yes | Create a post |
| POST | `/community/posts/:id/like` | Yes | Like a post |
| DELETE | `/community/posts/:id/like` | Yes | Unlike a post |

### Leaderboard (`/api/v1/leaderboard/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/leaderboard/points` | Yes | Top 20 by total points |
| GET | `/leaderboard/skills` | Yes | Top 20 by skill count |
| GET | `/leaderboard/weekly` | Yes | Top 20 by weekly points |
| GET | `/leaderboard/me` | Yes | Current user's ranks |

### Library (`/api/v1/library/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/library/` | Yes | All user's materials |
| GET | `/library/:id` | Yes | Get one material with content |
| POST | `/library/upload` | Yes | Upload file or URL |
| DELETE | `/library/:id/delete` | Yes | Delete a material |

### Jobs (`/api/v1/jobs/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/jobs/` | Yes | All active job listings |
| GET | `/jobs/match` | Yes | AI-matched jobs for user |
| POST | `/jobs/apply/:id` | Yes | Apply to a job |
| GET | `/jobs/my-applications` | Yes | User's applications |
| POST | `/jobs/admin/create` | Admin | Create job listing |
| PATCH | `/jobs/admin/:id` | Admin | Update job listing |
| DELETE | `/jobs/admin/:id` | Admin | Delete job listing |
| GET | `/jobs/admin/:id/applications` | Admin | Applications for a job |
| PATCH | `/jobs/admin/applications/:id/status` | Admin | Update application status |
| GET | `/jobs/admin/stats` | Admin | Platform statistics |

### Challenges (`/api/v1/challenges/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/challenges/current` | Yes | Current active challenge + progress |

---

# Chapter 5: AI Integration (Claude API)

## Overview

All AI calls go through Python functions in `/backend/ai/`. Each function:
1. Builds a structured prompt
2. Calls `anthropic.Anthropic().messages.create()`
3. Parses the JSON response
4. Returns Python dict with validated data

The model used throughout: `claude-sonnet-4-20250514`

**The golden rule**: Every Claude call instructs the model to return ONLY valid JSON. No extra text. This makes parsing reliable.

---

## How a Claude API Call is Structured

```python
import anthropic
import json
import os

client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))

def call_claude(system_prompt, user_message):
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}]
    )
    # Extract the text content
    raw = message.content[0].text
    # Parse as JSON
    return json.loads(raw)
```

---

## 1. Question Generator (`ai/question_generator.py`)

**Purpose**: Generate comprehension questions from study material.

**Input**:
```python
generate_questions(topic="Python basics", difficulty="mixed", material_text="...")
```

**System prompt**:
```
You are an expert learning coach creating questions to test student understanding.
Generate 5-8 questions based on the provided material.
Mix difficulty levels: easy (recall), medium (understanding), critical (application).
Return ONLY a valid JSON object. No extra text.
```

**User prompt**:
```
Topic: {topic}
Difficulty: {difficulty}
Material: {material_text}
```

**Output**:
```json
{
  "questions": [
    {
      "text": "What is a Python list?",
      "type": "open_ended",
      "correct_answer": "A list is an ordered, mutable collection...",
      "difficulty": "easy"
    }
  ]
}
```

---

## 2. Answer Evaluator (`ai/answer_evaluator.py`)

**Purpose**: Grade a student's answer and provide encouraging feedback.

**Input**:
```python
evaluate_answer(
    question_text="What is a Python list?",
    correct_answer="A mutable ordered sequence...",
    user_response="It's like an array that stores things"
)
```

**System prompt**:
```
You are a supportive tutor evaluating student answers.
Be encouraging even when the answer is wrong.
Focus on what they got right, then gently correct misunderstandings.
Return ONLY a valid JSON object.
```

**Output**:
```json
{
  "score": 72,
  "feedback": "Great intuition comparing it to an array! You're right that lists store items. To be more precise, Python lists are ordered and allow duplicates...",
  "encouragement": "You're on the right track! Keep practicing."
}
```

---

## 3. Skill Extractor (`ai/skill_extractor.py`)

**Purpose**: Identify what skills a student demonstrated in a session.

**System prompt**:
```
You are a skill assessment expert. Based on the learning session topic
and student performance, identify 1-5 skills the student demonstrated.
Return ONLY valid JSON.
```

**Output**:
```json
{
  "skills": [
    {"name": "Python", "level": "beginner"},
    {"name": "Data Structures", "level": "beginner"}
  ]
}
```

---

## 4. Roadmap Generator (`ai/roadmap_generator.py`)

**Purpose**: Create a structured learning path for a skill.

**Input**: `skill_name`, `user_level`

**System prompt**:
```
You are a career advisor creating a practical learning roadmap.
Each step must be achievable within 1-2 weeks.
Include real projects and free/paid resources.
Return ONLY valid JSON.
```

**Output**:
```json
{
  "steps": [
    {
      "order": 1,
      "title": "Python Fundamentals",
      "description": "Learn variables, loops, functions",
      "duration_weeks": 2,
      "verification_type": "quiz"
    }
  ],
  "projects": ["Build a calculator", "Create a todo list"],
  "resources": ["Python.org docs", "freeCodeCamp Python course"],
  "estimated_weeks": 12
}
```

---

## 5. CV Generator (`ai/cv_generator.py`)

**Purpose**: Write a professional CV from the user's activity data.

**Input**: user name, list of skills, session history, badges earned

**System prompt**:
```
You are a professional CV writer for students and young professionals.
Write a concise, compelling career profile.
Highlight skills earned through active learning, not just theory.
Return ONLY valid JSON.
```

**Output**:
```json
{
  "summary": "Driven computer science student with demonstrated proficiency in Python and data analysis, verified through 12 active learning sessions...",
  "skills_section": [
    {"skill": "Python", "level": "intermediate"},
    {"skill": "Data Analysis", "level": "beginner"}
  ],
  "achievements_section": [
    "Completed 12 learning sessions on MindLoop",
    "Earned Focus Master badge for consistent learning",
    "98% answer accuracy in Python sessions"
  ]
}
```

---

## 6. Opportunity Matcher (`ai/opportunity_matcher.py`)

**Purpose**: Rank opportunities by how well they match the user's skills.

**Input**: user's skill list, user level, all available opportunities

**System prompt**:
```
You are a career coach matching students to opportunities.
Score each opportunity 0-100 based on skill alignment.
Identify which skills the user already has vs. which they're missing.
Return ONLY valid JSON.
```

**Output**:
```json
{
  "matches": [
    {
      "opportunity_id": "...",
      "match_score": 87,
      "match_reason": "You have 4 of 5 required skills",
      "action_steps": ["Build one portfolio project", "Learn REST APIs"]
    }
  ]
}
```

---

## 7. Job Matcher (`ai/job_matcher.py`)

**Purpose**: Evaluate a user's fit for job listings.

**Input**: user skills, job requirements

**Output**:
```json
{
  "match_score": 74,
  "missing_skills": ["Docker", "AWS"],
  "strengths": ["Python", "Django"],
  "recommendation": "Strong candidate. Suggest learning Docker before applying."
}
```

---

## 8. Roadmap Verifier (`ai/roadmap_verifier.py`)

**Purpose**: Verify that a user has genuinely completed a roadmap step.

**For quiz verification**:
```json
{
  "passed": true,
  "score": 80,
  "feedback": "Well done! You answered 2 of 3 questions correctly.",
  "questions": [
    {
      "question": "Explain what a decorator is in Python",
      "correct_answer": "...",
      "user_answer": "...",
      "correct": true
    }
  ]
}
```

**For reflection/github verification**:
```json
{
  "passed": true,
  "feedback": "Your GitHub project demonstrates solid understanding of the concepts covered in this step."
}
```

---

## 9. Skill Gap Analyzer (`ai/skill_gap_analyzer.py`)

**Purpose**: Tell the user what skills to learn next based on market demand.

**Output**:
```json
{
  "recommended_skills": [
    {
      "skill": "Docker",
      "reason": "Required for 73% of DevOps roles matching your profile",
      "priority": "high"
    }
  ]
}
```

---

## How to Write Good Prompts for Claude

### Rule 1: Always demand JSON output

```python
system = """
You are a [role]. [Task description].
Return ONLY a valid JSON object. No extra text, no explanation.
"""
```

### Rule 2: Provide a concrete JSON schema in the prompt

```python
user = f"""
Generate questions for:
Topic: {topic}
Material: {material}

Return exactly this structure:
{{
  "questions": [
    {{
      "text": "question text",
      "type": "open_ended or multiple_choice",
      "correct_answer": "...",
      "difficulty": "easy, medium, or critical"
    }}
  ]
}}
"""
```

### Rule 3: Always wrap in try/except

```python
try:
    result = call_claude(system, user_message)
    return result
except json.JSONDecodeError:
    # Claude returned non-JSON — return safe fallback
    return {"questions": []}
except anthropic.APIError as e:
    # API error — log and return fallback
    logger.error(f"Claude API error: {e}")
    return {"questions": []}
```

### Rule 4: Validate the response before using it

```python
result = call_claude(system, prompt)
questions = result.get('questions', [])
if not isinstance(questions, list):
    return {"questions": []}
```

---

# Chapter 6: Frontend (Next.js)

## How Next.js App Router Works

Next.js 16 uses the "App Router" — every folder under `/app` becomes a URL route.

```
/app/page.tsx          → URL: /
/app/dashboard/page.tsx → URL: /dashboard
/app/learn/page.tsx     → URL: /learn
/app/auth/login/page.tsx → URL: /auth/login
```

### Client vs Server Components

By default, all components are Server Components (run on server, no React state/hooks allowed).
Add `'use client';` at the top to make it a Client Component (runs in browser, can use hooks).

MindLoop uses `'use client'` on almost every page because they need:
- `useState` for UI state
- `useEffect` for data fetching
- `useSession` for auth (from NextAuth)

---

## Root Layout (`app/layout.tsx`)

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>   {/* Makes NextAuth session available everywhere */}
          <Navbar />         {/* Sticky top nav on every page */}
          {children}         {/* The current page renders here */}
        </SessionProvider>
      </body>
    </html>
  );
}
```

---

## Every Page Explained

### `/` — Landing Page (`app/page.tsx`)
- Public page, no auth required
- Shows MindLoop hero, feature cards (Learn, CV, Opportunities)
- CTA buttons to `/auth/register` and `/auth/login`

### `/auth/login` and `/auth/register`
- Public pages
- Register calls `registerUser()` then auto-signs in via `signIn('credentials',...)`
- Login calls NextAuth's `signIn()` which internally calls `loginUser()`
- On success, redirects to `/dashboard`

### `/dashboard`
- Requires auth (redirects to login if not authenticated)
- Fetches and displays:
  - Points, level, session count, skill count
  - Current streak + streak freeze availability
  - Weekly challenge progress
  - Opportunity stats (matches, saved, applications)
  - Leaderboard snippet (user's ranks)
  - Recent badges
  - Quick action cards (Start Learning, View Library, etc.)

### `/learn`
- The core learning flow
- Form: topic input + study material textarea + PDF/TXT upload
- On submit: `startSession()` → shows `<LearningSession>` component
- `<LearningSession>` calls `generateQuestions()` → shows `<QuestionCard>` for each

### `/library`
- Shows all uploaded materials in a card grid
- Upload modal (file/URL/YouTube)
- Search materials by title
- Click material → view full text
- "Start Session" on a card → navigates to `/learn?topic=...&material=...`

### `/career`
- Input a skill name → generates a career roadmap via Claude
- Lists saved roadmaps in left panel
- `<RoadmapViewer>` shows step-by-step plan with verification buttons
- Each step can be verified (quiz/GitHub/reflection)

### `/cv`
- Shows latest generated CV
- "Regenerate" button → calls `generateCV()` → updates CV
- Print button → browser print (navbar hidden via print CSS)
- Copy link button → copy CV URL to clipboard

### `/opportunities`
- Three tabs:
  1. **AI Matches** — opportunities ranked by Claude
  2. **Job Board** — all jobs with AI matching
  3. **My Applications** — applied jobs with status
- Save/unsave opportunities

### `/opportunities/saved`
- List of saved opportunities with unsave button

### `/community`
- Paginated feed of posts from all users
- Like/unlike posts
- "Share with Community" modal to create posts
- Post types: learning_update, achievement, cv_share, opportunity_share

### `/leaderboard`
- Three tabs: All-Time Points, Skills Count, This Week
- My Ranks panel (always visible)
- Animated loading states

### `/admin-dashboard`
- Only visible to users with `role === 'admin'`
- Create/edit/delete job listings
- Review applications, update status (pending/reviewed/accepted/rejected)
- Platform stats

---

## Component Library Explained

### `components/ui/Navbar.tsx`
- Sticky top bar on every page
- Desktop: horizontal nav links with active highlighting
- Mobile: hamburger menu with dropdown
- Right: points badge, user initials avatar, sign out, dark mode toggle
- Returns `null` if no session (not logged in)

### `components/ui/DarkModeToggle.tsx`
- Reads preference from `localStorage` on mount
- Toggles `.dark` class on `<html>` element
- Saves preference to `localStorage`
- Shows 🌙 (light mode) or ☀️ (dark mode)

### `components/learning/LearningSession.tsx`
- Manages the full session flow
- State: list of questions, current question index, answers
- Shows `<ProgressBar>` at top
- Shows `<QuestionCard>` for current question
- On all questions answered: shows completion screen, calls `completeSession()`

### `components/learning/QuestionCard.tsx`
- Shows question text (with LaTeX support via `<LatexText>`)
- Textarea for answer input
- Submit → calls `submitAnswer()` → shows `<FeedbackPanel>`
- Shows badge popup if new badge earned

### `components/learning/FeedbackPanel.tsx`
- Shows score (colored: green >= 70, orange >= 50, red < 50)
- Shows Claude's feedback text
- Shows correct answer if score < 70

### `components/career/RoadmapViewer.tsx`
- Renders roadmap steps as a timeline
- Each step: title, description, duration, status indicator
- Buttons: "Start Quiz", "Submit GitHub", "Write Reflection"
- Calls verify/quiz API on user action

### `components/cv/CVViewer.tsx`
- Renders the structured CV JSON from Claude
- Sections: Summary, Skills, Achievements

### `components/ui/LatexText.tsx`
- Renders text that may contain LaTeX formulas
- `$$...$$` → block math (display mode)
- `$...$` → inline math
- Uses KaTeX library for rendering

---

## How Dark Mode Works

The dark mode system has two parts:

**Part 1 — Toggle Component** (`components/ui/DarkModeToggle.tsx`):
```tsx
useEffect(() => {
  const saved = localStorage.getItem('theme');
  const dark = saved === 'dark';
  document.documentElement.classList.toggle('dark', dark);
}, []);

function toggle() {
  const next = !isDark;
  document.documentElement.classList.toggle('dark', next);
  localStorage.setItem('theme', next ? 'dark' : 'light');
}
```

**Part 2 — CSS Overrides** (`app/globals.css`):
```css
/* Tailwind v4 class-based dark mode */
@custom-variant dark (&:where(.dark, .dark *));

/* Override Tailwind utility classes when .dark is on <html> */
.dark .bg-white    { background-color: #1e293b; }
.dark .bg-gray-50  { background-color: #0f172a; }
.dark .text-gray-900 { color: #f8fafc; }
/* ...etc for all common utility classes */
```

`.dark .bg-white` has higher CSS specificity than `.bg-white` so it wins without `!important`.

---

## How NextAuth Works

### Configuration (`lib/auth.ts`)

```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        // Call our Django backend login endpoint
        const data = await loginUser(credentials.email, credentials.password);
        return {
          id: data.user.id,
          accessToken: data.access,     // JWT from Django
          refreshToken: data.refresh,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // First login: store tokens in JWT
      if (user) return { ...token, accessToken: user.accessToken, ... };
      
      // Token still valid: return as-is
      if (Date.now() < token.accessTokenExpiry) return token;
      
      // Token expired: refresh it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Attach the access token to the session for use in components
      session.accessToken = token.accessToken;
      return session;
    }
  }
};
```

### Using Auth in a Page

```tsx
'use client';
import { useSession } from 'next-auth/react';

export default function SomePage() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return <Loader />;
  if (status === 'unauthenticated') { router.push('/auth/login'); return null; }
  
  const token = (session as any).accessToken;
  // Now use token in API calls
}
```

---

## TypeScript Types (`types/index.ts`)

All data models have TypeScript interfaces matching the Django serializers:

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  level: string;
  role: 'student' | 'admin';
  current_streak: number;
  longest_streak: number;
  badges: Badge[];
}

export interface LearningSession {
  id: string;
  topic: string;
  status: 'active' | 'completed' | 'abandoned';
  started_at: string;
  completed_at: string | null;
}

export interface Question {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'critical';
  question_type: 'open_ended' | 'multiple_choice';
  correct_answer: string;
}
// ...etc for all models
```

---

# Chapter 7: Gamification System

## Points System

Every action in MindLoop that represents learning progress rewards points:

| Action | Points | Where it happens |
|--------|--------|-----------------|
| Reading a material (starting a session) | +5 | `sessions/start` view |
| Correct answer (score >= 70) | +10 | `answers/submit` view |
| Session completion | +20 | `sessions/:id/complete` view |
| CV generated | +30 | `cv/generate` view |
| First skill earned | +50 | `skills/add` view |
| Uploading a library material | +10 | `library/upload` view |
| Applying to a job | +5 | `jobs/apply/:id` view |
| Completing a roadmap step | +15 | `roadmap/step/verify` view |
| Weekly challenge bonus | variable | `sessions/:id/complete` view |

---

## Level Progression

Levels are computed automatically by `User.update_level()` whenever points change:

```python
LEVEL_THRESHOLDS = [
    (2000, 'master'),
    (1000, 'expert'),
    (600,  'achiever'),
    (300,  'learner'),
    (100,  'explorer'),
    (0,    'beginner'),
]
```

---

## Badges

| Badge | Trigger | Where it's checked |
|-------|---------|-------------------|
| Quick Learner | Score 90%+ on your very first answer attempt | `answers/submit` |
| Focus Master | Complete 3 sessions in a row (same or consecutive days) | `sessions/complete` |
| Consistent Student | 7-day learning streak | `sessions/complete` |
| Skill Builder | Earn 5 distinct skills | `skills/add` view |
| Opportunity Seeker | View 10+ opportunities | `opportunities/:id/view` |

Badge earning logic (example — Focus Master):
```python
def check_focus_master(user):
    # Count sessions completed in last 3 days
    three_days_ago = now() - timedelta(days=3)
    recent_sessions = LearningSession.objects.filter(
        user=user,
        status='completed',
        completed_at__gte=three_days_ago
    ).count()
    
    if recent_sessions >= 3:
        # Check if they don't already have this badge
        if not Badge.objects.filter(user=user, name='Focus Master').exists():
            Badge.objects.create(user=user, name='Focus Master')
            # Auto-post to community
            Post.objects.create(
                user=user,
                type='achievement',
                content=f'{user.name} earned the Focus Master badge!'
            )
            return True
    return False
```

---

## Streak System

Streaks track consecutive days of learning:

```python
def update_streak(user):
    today = timezone.now().date()
    yesterday = today - timedelta(days=1)
    
    if user.last_session_date == today:
        return  # Already counted today
    
    if user.last_session_date == yesterday:
        # Consecutive day — extend streak
        user.current_streak += 1
    elif user.streak_freeze_available and user.last_session_date == today - timedelta(days=2):
        # Missed one day but has streak freeze
        user.current_streak += 1
        user.streak_freeze_used = True
        user.streak_freeze_available = False
    else:
        # Streak broken
        user.current_streak = 1
    
    user.longest_streak = max(user.longest_streak, user.current_streak)
    user.last_session_date = today
    user.save()
```

---

## Leaderboard System

Three separate leaderboards, all computed in real-time:

```python
# Points leaderboard
top_users = User.objects.order_by('-points')[:20]

# Skills leaderboard
top_users = User.objects.annotate(
    skill_count=Count('skills')
).order_by('-skill_count')[:20]

# Weekly leaderboard
week_start = today - timedelta(days=today.weekday())
# For each active user this week, sum: completed_sessions*20 + correct_answers*10
```

---

# Chapter 8: Deployment

## Architecture Overview

```
GitHub Repository (main branch)
    │
    ├──► Railway (auto-deploys on push)
    │       ├── Django Backend (gunicorn, 2 workers)
    │       └── PostgreSQL Database (managed)
    │
    └──► Vercel (auto-deploys on push)
            └── Next.js Frontend (CDN, global)
```

---

## Backend — Railway

### What Railway Does Automatically
1. Detects Python project via `runtime.txt`
2. Builds with Nixpacks (installs packages from `requirements.txt`)
3. Reads `railway.json` for start command

### `railway.json` (the most important file)

```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "python manage.py migrate --no-input && python manage.py collectstatic --no-input && gunicorn mindloop_project.wsgi --bind 0.0.0.0:$PORT --workers 2 --timeout 120"
  }
}
```

This single command:
1. Runs all database migrations (creates/updates tables)
2. Collects static files for WhiteNoise to serve
3. Starts Gunicorn with 2 worker processes

### Required Railway Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DJANGO_SECRET_KEY` | Random secret string | `abc123xyz...` |
| `DEBUG` | Should be `False` in production | `False` |
| `DATABASE_URL` | Auto-provided by Railway PostgreSQL | `postgresql://...` |
| `ANTHROPIC_API_KEY` | Your Claude API key | `sk-ant-...` |
| `CORS_ALLOWED_ORIGINS` | Your Vercel URL | `https://mindloop-psi.vercel.app` |

### Deploying to Railway

1. Push code to GitHub: `git push origin main`
2. Railway auto-detects the push and starts a new build
3. Build takes ~2-3 minutes (installs packages)
4. Start command runs (~30 seconds for migrations)
5. App is live

### Monitoring

- Railway dashboard → your service → **Logs** tab
- You'll see migration output, gunicorn startup, and request logs

---

## Frontend — Vercel

### What Vercel Does Automatically
1. Detects Next.js project
2. Runs `npm run build`
3. Deploys to global CDN

### Required Vercel Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_SECRET` | Random secret string | `any-long-random-string` |
| `NEXTAUTH_URL` | Your Vercel URL | `https://mindloop-psi.vercel.app` |
| `NEXT_PUBLIC_API_URL` | Your Railway backend URL | `https://mindloop-production.up.railway.app` |

**Important**: `NEXT_PUBLIC_API_URL` must NOT include `/api/v1` — the frontend adds that prefix automatically.

### Deploying to Vercel

1. Push code to GitHub: `git push origin main`
2. Vercel auto-detects the push
3. Runs `npm run build` (~1-2 minutes)
4. Deployed globally

---

## Common Deployment Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Error reading runtime.txt — stream did not contain valid UTF-8` | File saved as UTF-16 (Windows encoding) | `printf 'python-3.11.9\n' > runtime.txt` |
| `Invalid HTTP_HOST header` / 400 Bad Request | `ALLOWED_HOSTS` doesn't include Railway domain | Set `ALLOWED_HOSTS` env var or use `['*']` default |
| `relation "users_user" does not exist` / 500 | Migrations never ran | Ensure `railway.json` has the migrate command in `startCommand` |
| `No directory at: /app/staticfiles/` | `collectstatic` never ran | Same fix — ensure it's in `startCommand` |
| `ssl_require` error | `dj_database_url.parse(..., ssl_require=True)` | Remove `ssl_require=True` parameter |
| `Starting gunicorn` without migrate output | Railway ignoring Procfile `release:` type | Use `railway.json` `startCommand` instead of `Procfile` |
| `CORS error` in browser console | Backend CORS_ALLOWED_ORIGINS missing Vercel URL | Add Vercel URL to `CORS_ALLOWED_ORIGINS` setting |
| White text on white background | Tailwind + OS dark mode CSS variable conflict | Fix: remove `@media (prefers-color-scheme: dark)` from globals.css |

---

## How to Redeploy After Changes

```bash
# Make your code changes, then:
git add .
git commit -m "Your change description"
git push origin main
# Both Railway and Vercel auto-deploy from main branch
```

---

# Chapter 9: How to Build From Scratch

This chapter walks through rebuilding MindLoop completely from zero.

## Prerequisites

Install these before starting:
- Python 3.11+ (`python --version`)
- Node.js 18+ (`node --version`)
- PostgreSQL 17 (`psql --version`)
- Git (`git --version`)

---

## Step 1: Create PostgreSQL Database

```bash
# Start PostgreSQL
psql -U postgres

# Inside psql:
CREATE DATABASE mindloop;
CREATE USER mindloop_admin WITH PASSWORD 'admin123';
GRANT ALL PRIVILEGES ON DATABASE mindloop TO mindloop_admin;
\q
```

---

## Step 2: Set Up Django Backend

```bash
mkdir mindloop && cd mindloop
mkdir backend && cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate          # Mac/Linux
# OR
venv\Scripts\activate             # Windows

# Install packages
pip install django djangorestframework djangorestframework-simplejwt psycopg2-binary anthropic python-dotenv django-cors-headers pdfplumber pypdf python-docx beautifulsoup4 requests gunicorn whitenoise dj-database-url

pip freeze > requirements.txt

# Create Django project
django-admin startproject mindloop_project .
```

---

## Step 3: Configure settings.py

```python
# Add to INSTALLED_APPS:
'rest_framework',
'rest_framework_simplejwt',
'corsheaders',

# Configure database (see Chapter 4)
# Configure JWT (see Chapter 4)
# Configure CORS

CORS_ALLOWED_ORIGINS = ['http://localhost:3000']
CORS_ALLOW_CREDENTIALS = True
```

---

## Step 4: Create Django Apps

```bash
# Create each app
mkdir apps && cd apps
touch __init__.py

python manage.py startapp users
python manage.py startapp learning_sessions
python manage.py startapp questions
python manage.py startapp answers
python manage.py startapp skills
python manage.py startapp cv
python manage.py startapp roadmap
python manage.py startapp opportunities
python manage.py startapp community
python manage.py startapp challenges
python manage.py startapp library
python manage.py startapp jobs
```

For each app, you need to create:
- `models.py` — database tables
- `serializers.py` — data validation + JSON conversion
- `views.py` — API logic
- `urls.py` — URL patterns

---

## Step 5: Create Custom User Model

**Important**: Do this BEFORE running any migrations.

```python
# apps/users/models.py
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None):
        user = self.model(email=self.normalize_email(email), name=name)
        user.set_password(password)
        user.save()
        return user

class User(AbstractBaseUser, PermissionsMixin):
    # See Chapter 3 for full model
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']
    objects = UserManager()
```

```python
# settings.py
AUTH_USER_MODEL = 'users.User'
```

---

## Step 6: Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

---

## Step 7: Create AI Functions

```bash
mkdir ai && cd ai
touch __init__.py
# Create question_generator.py, answer_evaluator.py, etc.
# See Chapter 5 for the full structure of each function
```

---

## Step 8: Create .env File

```bash
# mindloop/.env
DJANGO_SECRET_KEY=your-long-random-secret-here
DEBUG=True
DB_NAME=mindloop
DB_USER=mindloop_admin
DB_PASSWORD=admin123
DB_HOST=localhost
DB_PORT=5432
ANTHROPIC_API_KEY=sk-ant-your-key-here
NEXTAUTH_SECRET=another-random-secret
NEXTAUTH_URL=http://localhost:3000
```

---

## Step 9: Test Backend

```bash
python manage.py runserver
# Visit http://localhost:8000/api/v1/auth/register in Postman
```

---

## Step 10: Set Up Next.js Frontend

```bash
cd ..  # Back to /mindloop
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd frontend

# Install additional packages
npm install next-auth katex @types/katex
```

---

## Step 11: Configure NextAuth

```typescript
// frontend/lib/auth.ts
// See Chapter 6 for full implementation
```

```typescript
// frontend/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

---

## Step 12: Create Types File

```typescript
// frontend/types/index.ts
// See Chapter 6 for all interfaces
```

---

## Step 13: Create API Client

```typescript
// frontend/lib/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
// See Chapter 2 for full implementation
```

---

## Step 14: Build Pages and Components

Build in this order (each depends on the previous):
1. `app/layout.tsx` (with SessionProvider + Navbar)
2. `app/auth/login/page.tsx` and `register/page.tsx`
3. `app/dashboard/page.tsx`
4. `app/learn/page.tsx` + learning components
5. `app/library/page.tsx` + library components
6. `app/career/page.tsx` + RoadmapViewer
7. `app/cv/page.tsx` + CVViewer
8. `app/opportunities/page.tsx`
9. `app/community/page.tsx`
10. `app/leaderboard/page.tsx`

---

## Step 15: Create Deployment Files

```bash
# backend/Procfile
web: python manage.py migrate --no-input && python manage.py collectstatic --no-input && gunicorn mindloop_project.wsgi --bind 0.0.0.0:$PORT --workers 2 --timeout 120
```

```bash
# backend/runtime.txt  (must be UTF-8 encoded!)
python-3.11.9
```

```json
// backend/railway.json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "python manage.py migrate --no-input && python manage.py collectstatic --no-input && gunicorn mindloop_project.wsgi --bind 0.0.0.0:$PORT --workers 2 --timeout 120"
  }
}
```

---

## Step 16: Deploy

```bash
cd /mindloop
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/mindloop.git
git push -u origin main
# Then connect Railway and Vercel to GitHub repo
```

---

# Chapter 10: How to Add New Features

## The Pattern for Every New Feature

Every new feature follows the same pattern:

```
1. Django: Create/update Model
2. Django: Create Migration
3. Django: Create Serializer
4. Django: Create View
5. Django: Add URL
6. Django: Add AI function (if needed)
7. Frontend: Add TypeScript type
8. Frontend: Add API function in lib/api.ts
9. Frontend: Create component or page
10. Test locally → push → auto-deploy
```

---

## How to Create a New Django App

Example: adding a "Notes" feature

```bash
cd backend
python manage.py startapp notes
# Add 'apps.notes' to INSTALLED_APPS in settings.py
```

```python
# apps/notes/models.py
import uuid
from django.db import models

class Note(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
```

```python
# apps/notes/serializers.py
from rest_framework import serializers
from .models import Note

class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ('id', 'title', 'content', 'created_at')
        read_only_fields = ('id', 'created_at')
```

```python
# apps/notes/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Note
from .serializers import NoteSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_notes(request):
    notes = Note.objects.filter(user=request.user).order_by('-created_at')
    return Response(NoteSerializer(notes, many=True).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_note(request):
    serializer = NoteSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response({'error': str(list(serializer.errors.values())[0][0])}, status=400)
```

```python
# apps/notes/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_notes, name='notes-list'),
    path('create', views.create_note, name='notes-create'),
]
```

```python
# mindloop_project/urls.py — add this line:
path('api/v1/notes/', include('apps.notes.urls')),
```

```bash
python manage.py makemigrations notes
python manage.py migrate
```

---

## How to Add a New API Function in Frontend

```typescript
// frontend/lib/api.ts — add these functions:

export async function getNotes(token: string) {
  return apiFetch('/notes/', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function createNote(token: string, title: string, content: string) {
  return apiFetch('/notes/create', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, content })
  });
}
```

---

## How to Add a New Frontend Page

```tsx
// frontend/app/notes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getNotes, createNote } from '@/lib/api';

export default function NotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return; }
    if (status === 'authenticated') {
      const token = (session as any).accessToken;
      getNotes(token).then(setNotes);
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">My Notes</h1>
        {notes.map((note: any) => (
          <div key={note.id} className="bg-white rounded-xl p-4 mt-4 border border-gray-200">
            <h2 className="font-semibold text-gray-900">{note.title}</h2>
            <p className="text-gray-600 mt-1">{note.content}</p>
          </div>
        ))}
      </main>
    </div>
  );
}
```

---

## How to Add a New AI Feature

Example: "Study Summary Generator"

```python
# backend/ai/summary_generator.py
import anthropic
import json
import os

def generate_summary(topic: str, material_text: str) -> dict:
    client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))
    
    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system="""You are an expert at summarizing educational material.
Create a concise summary with key points and takeaways.
Return ONLY a valid JSON object. No extra text.""",
            messages=[{
                "role": "user",
                "content": f"""Summarize this material about {topic}:

{material_text}

Return this structure:
{{
  "summary": "2-3 paragraph summary",
  "key_points": ["point 1", "point 2", "point 3"],
  "key_terms": {{"term": "definition"}}
}}"""
            }]
        )
        return json.loads(message.content[0].text)
    except json.JSONDecodeError:
        return {"summary": "Summary unavailable", "key_points": [], "key_terms": {}}
    except Exception as e:
        return {"summary": "Summary unavailable", "key_points": [], "key_terms": {}}
```

Then add it to the sessions view:

```python
# apps/learning_sessions/views.py
from ai.summary_generator import generate_summary

# In start_session view:
summary = generate_summary(topic, material_text)
# Include in the response
```

---

## How to Deploy New Features

```bash
# After making all changes:

# 1. Test locally
python manage.py check          # Backend checks
npm run build                   # Frontend checks

# 2. Run migrations if models changed
python manage.py makemigrations
python manage.py migrate

# 3. Push everything
git add .
git commit -m "Add [feature name]"
git push origin main

# 4. Railway auto-runs migrations on deploy via startCommand
# 5. Vercel auto-builds frontend
# 6. Both live in ~3-5 minutes
```

---

*End of MindLoop Technical Book — Built with Django, Next.js, and Claude AI*
