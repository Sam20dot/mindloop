# 🧠 CLAUDE.md — MindLoop / SkillFlow AI

> This is the master context file for Claude Code.
> Read this FULLY before writing any code, creating any file, or making any decision.
> Every technical decision must align with what is written here.

---

## 📌 Project Overview

**MindLoop** is an AI-powered learning, career development, and economic opportunity platform.
It transforms students from passive learners into career-ready, skill-driven individuals.

**The problem it solves:**
- Students lose focus while learning
- Students don't know what skills lead to jobs
- Students have no structured portfolio or CV
- Students have no connection to real economic opportunities

**Core Loop:**
```
LEARN → UNDERSTAND → SKILL BUILD → TRACK PROGRESS → BUILD CV → FIND OPPORTUNITY
```

**Target Users:**
- University and high school students
- Self-learners and job seekers
- Young professionals in Africa and globally

---

## 🏗️ Project Structure

```
/mindloop
  CLAUDE.md                        ← This file (always read first)
  .env                             ← Environment variables (never commit to Git)
  .gitignore

  /frontend                        → Next.js + Tailwind CSS (Port 3000)
    /app
      /dashboard                   → Main user dashboard
      /learn                       → Learning session pages
      /career                      → Career roadmap pages
      /cv                          → CV builder and viewer
      /opportunities               → Job/freelance opportunity feed
      /auth                        → Login and register pages
    /components
      /ui                          → Reusable UI primitives
      /learning                    → Learning session components
      /career                      → Career roadmap components
      /cv                          → CV components
      /opportunities               → Opportunity components
    /lib
      /api.ts                      → API fetch helpers (calls Django backend)
      /auth.ts                     → NextAuth config
    /hooks                         → Custom React hooks
    /types                         → TypeScript type definitions
    next.config.js
    tailwind.config.js
    package.json

  /backend                         → Django + Django REST Framework (Port 8000)
    /mindloop_project              → Django project root
      settings.py
      urls.py
      wsgi.py
    /apps
      /users                       → User model, auth, profiles
      /sessions                    → Learning sessions
      /questions                   → AI question generation and storage
      /answers                     → User answers and AI evaluation
      /skills                      → Skill tracking
      /cv                          → CV generation
      /opportunities               → Opportunity matching
      /roadmap                     → Career roadmap generation
    /ai                            → All Claude API call logic
      question_generator.py
      answer_evaluator.py
      roadmap_generator.py
      cv_generator.py
      opportunity_matcher.py
    requirements.txt
    manage.py

  /db
    schema.md                      → Human-readable schema reference
```

---

## 🛠️ Tech Stack

| Layer        | Technology                             | Notes                              |
|--------------|----------------------------------------|------------------------------------|
| Frontend     | Next.js (App Router)                   | NOT Pages Router                   |
| Styling      | Tailwind CSS                           | Mobile-first, utility classes only |
| Auth         | NextAuth                               | JWT strategy                       |
| Backend      | Django + Django REST Framework         | DRF for all API endpoints          |
| Database     | PostgreSQL 17                          | Via Django ORM only                |
| AI           | Anthropic Claude API                   | Model: claude-sonnet-4-20250514    |
| Language     | TypeScript (frontend), Python (backend)|                                    |
| Hosting      | Vercel (frontend) + Railway (backend)  |                                    |

---

## 🔑 Environment Variables

Create a `.env` file at the project root `/mindloop/.env`:

```
# Database (PostgreSQL — already installed locally)
DB_NAME=mindloop
DB_USER=mindloop_admin
DB_PASSWORD=admin123
DB_HOST=localhost
DB_PORT=5432

# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# NextAuth
NEXTAUTH_SECRET=any_random_strong_string_here
NEXTAUTH_URL=http://localhost:3000

# Django
DJANGO_SECRET_KEY=any_random_strong_string_here
DEBUG=True
```

> ⚠️ NEVER commit `.env` to Git. Always add it to `.gitignore`.

---

## 🗄️ Database Schema (PostgreSQL)

> Database name: `mindloop`
> User: `mindloop_admin`
> Already created locally on this machine.

### `users`
```
id              UUID          PRIMARY KEY
name            VARCHAR
email           VARCHAR       UNIQUE
password_hash   VARCHAR
points          INTEGER       DEFAULT 0
level           VARCHAR       DEFAULT 'beginner'
created_at      TIMESTAMP
```

### `badges`
```
id              UUID          PRIMARY KEY
user_id         FK → users
name            VARCHAR       (Focus Master, Quick Learner, etc.)
earned_at       TIMESTAMP
```

### `sessions`
```
id              UUID          PRIMARY KEY
user_id         FK → users
topic           VARCHAR
material_text   TEXT
status          VARCHAR       (active, completed, abandoned)
started_at      TIMESTAMP
completed_at    TIMESTAMP
```

### `questions`
```
id              UUID          PRIMARY KEY
session_id      FK → sessions
text            TEXT
difficulty      VARCHAR       (easy, medium, critical)
question_type   VARCHAR       (multiple_choice, open_ended)
correct_answer  TEXT
```

### `answers`
```
id              UUID          PRIMARY KEY
question_id     FK → questions
user_id         FK → users
user_response   TEXT
score           INTEGER       (0–100)
feedback        TEXT          (AI-generated)
submitted_at    TIMESTAMP
```

### `skills`
```
id              UUID          PRIMARY KEY
user_id         FK → users
name            VARCHAR
level           VARCHAR       (beginner, intermediate, advanced)
source          VARCHAR       (learning, manual)
earned_at       TIMESTAMP
```

### `cv_entries`
```
id              UUID          PRIMARY KEY
user_id         FK → users
skill_id        FK → skills
summary         TEXT          (AI-generated)
generated_at    TIMESTAMP
```

### `roadmaps`
```
id              UUID          PRIMARY KEY
user_id         FK → users
skill_name      VARCHAR
steps           JSONB
projects        JSONB
resources       JSONB
created_at      TIMESTAMP
```

### `opportunities`
```
id              UUID          PRIMARY KEY
title           VARCHAR
type            VARCHAR       (freelance, internship, entry-level)
skill_tags      JSONB
description     TEXT
source_url      VARCHAR
posted_at       TIMESTAMP
```

---

## 🔌 API Endpoints (Django REST Framework)

All endpoints prefixed with `/api/v1/`

### Auth
```
POST   /api/v1/auth/register           → Register new user
POST   /api/v1/auth/login              → Login, return JWT token
POST   /api/v1/auth/logout             → Logout
GET    /api/v1/auth/me                 → Get current user profile
```

### Sessions
```
POST   /api/v1/sessions/start          → Start a learning session
GET    /api/v1/sessions/:id            → Get session details
PATCH  /api/v1/sessions/:id/complete   → Mark session as complete
GET    /api/v1/sessions/history        → Get user session history
```

### Questions
```
POST   /api/v1/questions/generate      → AI generates questions from material
GET    /api/v1/questions/:session_id   → Get all questions for a session
```

### Answers
```
POST   /api/v1/answers/submit          → Submit answer, trigger AI evaluation
GET    /api/v1/answers/:session_id     → Get all answers for a session
```

### Skills
```
GET    /api/v1/skills/me               → Get current user's skills
POST   /api/v1/skills/add              → Manually add a skill
```

### CV
```
GET    /api/v1/cv/:user_id             → Get user's full CV
POST   /api/v1/cv/generate             → AI generates CV from skills + history
```

### Roadmap
```
POST   /api/v1/roadmap/generate        → AI generates career roadmap for a skill
GET    /api/v1/roadmap/:user_id        → Get user's saved roadmaps
```

### Opportunities
```
GET    /api/v1/opportunities/          → Get all opportunities
GET    /api/v1/opportunities/match     → Get opportunities matched to user skills
```

---

## 🤖 Claude AI Integration

All Claude API calls live in `/backend/ai/`.
**Model to use:** `claude-sonnet-4-20250514`
**API Key:** stored in `.env` as `ANTHROPIC_API_KEY` — never hardcode it.

### 1. Question Generator (`question_generator.py`)
```
Input:   { topic, difficulty, material_text }
System:  "You are an expert learning coach. Generate questions to test understanding.
          Return ONLY a valid JSON object. No extra text."
Output:  { questions: [{ text, type, correct_answer, difficulty }] }
```

### 2. Answer Evaluator (`answer_evaluator.py`)
```
Input:   { question_text, correct_answer, user_response }
System:  "You are a supportive tutor. Evaluate the answer and give encouraging feedback.
          Return ONLY a valid JSON object. No extra text."
Output:  { score (0-100), feedback, encouragement }
```

### 3. Career Roadmap Generator (`roadmap_generator.py`)
```
Input:   { skill_name, user_level }
System:  "You are a career advisor. Generate a structured learning roadmap.
          Return ONLY a valid JSON object. No extra text."
Output:  { steps[], projects[], resources[], estimated_weeks }
```

### 4. CV Generator (`cv_generator.py`)
```
Input:   { user_name, skills[], session_history[], badges[] }
System:  "You are a professional CV writer. Generate a concise career profile.
          Return ONLY a valid JSON object. No extra text."
Output:  { summary, skills_section, achievements_section }
```

### 5. Opportunity Matcher (`opportunity_matcher.py`)
```
Input:   { user_skills[], user_level }
System:  "You are a career coach. Match the user's skills to real opportunities.
          Return ONLY a valid JSON object. No extra text."
Output:  { opportunities: [{ title, type, match_reason, action_steps[] }] }
```

### Rules for ALL Claude API calls:
- Always wrap in try/except blocks
- Always validate and parse Claude response before saving to DB
- Never expose the API key on the frontend
- All AI calls must go through Django backend only
- Always show a loading state on the frontend during AI calls
- Never display raw Claude output — always format it before showing the user
- Do NOT hallucinate job listings — clearly label AI-suggested roles

---

## 🧩 Frontend Component Map (Next.js)

```
/components/learning
  <LearningSession />        → Full session view (material + questions)
  <QuestionCard />           → Single question with answer input
  <FeedbackPanel />          → AI feedback after answer submission
  <ProgressBar />            → Session completion progress

/components/career
  <RoadmapViewer />          → Visual career path steps
  <SkillBadge />             → Individual skill badge display

/components/cv
  <CVBuilder />              → Full CV layout
  <CVSection />              → Individual CV section
  <ExportButton />           → Export CV as PDF or shareable link

/components/opportunities
  <OpportunityFeed />        → List of matched opportunities
  <OpportunityCard />        → Single opportunity with match reason

/components/ui
  <Button />
  <Card />
  <Modal />
  <Loader />                 → Always show during AI calls
  <PointsBadge />            → Gamification points display
  <Navbar />
  <Sidebar />
```

---

## 🔁 Full User Flow

```
1.  User registers / logs in via NextAuth
2.  Dashboard loads → shows points, badges, skills, recent sessions
3.  User selects a topic (e.g. "Python for Data Science")
4.  User reads the study material
5.  Clicks "Generate Questions" → POST /api/v1/questions/generate
6.  Claude generates 5–10 questions (easy / medium / critical)
7.  User answers each question one by one
8.  Each answer → POST /api/v1/answers/submit → Claude evaluates
9.  Score and feedback shown immediately via <FeedbackPanel />
10. Session completes → points awarded → badges checked
11. Skills extracted from session and saved to DB
12. CV auto-updated → visible at /cv
13. Career roadmap generated → POST /api/v1/roadmap/generate
14. Opportunities matched → GET /api/v1/opportunities/match
15. User views updated dashboard with full profile
```

---

## 🏆 Gamification System

### Points
| Action                    | Points |
|---------------------------|--------|
| Reading a material chunk  | +5     |
| Correct answer            | +10    |
| Session completion        | +20    |
| First skill earned        | +50    |
| CV generated              | +30    |

### Badges
| Badge                | Trigger                            |
|----------------------|------------------------------------|
| Focus Master         | Complete 3 sessions in a row       |
| Quick Learner        | Score 90%+ on first attempt        |
| Consistent Student   | 7-day learning streak              |
| Skill Builder        | Earn 5 distinct skills             |
| Opportunity Seeker   | View 10+ opportunities             |

---

## 🌍 Design & Coding Rules

1. **Mobile-first always** — most users are on phones (African market)
2. **Low-bandwidth friendly** — no heavy images, lazy load everything
3. **TypeScript everywhere** on the frontend — no raw `.js` files
4. **Every Claude API call must show a loading spinner** — no exceptions
5. **Django REST Framework serializers** for all data validation
6. **Never expose Anthropic API key on the frontend** — all AI calls through Django
7. **All DB queries use Django ORM** — no raw SQL
8. **NextAuth session** verified on every protected Next.js route
9. **Django JWT** verifies every protected API endpoint
10. **Error boundaries** on all major frontend components
11. **All responses from Claude must be parsed as JSON** — never render raw text

---

## 🛡️ Ethics & Safety Rules

- AI must always be supportive and encouraging — never harsh
- No misleading job promises — all opportunities labeled as AI suggestions
- Users always remain in control of their data
- No dark patterns in gamification
- Content moderation on all user-generated content

---

## 🎯 MVP Build Order (Follow This Exactly)

```
Phase 1 — Foundation
  1. Django project setup + PostgreSQL connection
  2. User model + Auth (register, login, JWT)
  3. NextAuth setup on frontend
  4. Basic dashboard layout

Phase 2 — Core Learning Loop
  5. Learning session flow
  6. Claude question generation
  7. Answer submission + Claude evaluation
  8. Points and badges system

Phase 3 — Career & CV
  9. Skill tracking system
  10. Claude CV generator
  11. Claude career roadmap generator

Phase 4 — Opportunities
  12. Opportunity matching with Claude
  13. Opportunity feed UI

Phase 5 — Polish (Phase 2 of product)
  14. Community features
  15. Leaderboards
  16. Advanced gamification
```

---

## 💻 Local Development Setup

### Already Done on This Machine ✅
- PostgreSQL 17 installed and running
- Database `mindloop` created
- User `mindloop_admin` created with full privileges
- Node.js v24 installed
- Python installed
- Claude Code installed (v2.1.114)

### To Start the Backend
```bash
cd mindloop/backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### To Start the Frontend
```bash
cd mindloop/frontend
npm install
npm run dev
```

### Required Python Packages (`requirements.txt`)
```
django
djangorestframework
djangorestframework-simplejwt
psycopg2-binary
anthropic
python-dotenv
django-cors-headers
```

### Required Node Packages
```
next
react
react-dom
tailwindcss
next-auth
typescript
@types/react
@types/node
```

---

## 🚀 First Command for Claude Code

When Claude Code opens this project for the first time, run:

```
Read CLAUDE.md and set up the full MindLoop project structure
with Django backend and Next.js frontend exactly as described.
Start with Phase 1 of the MVP Build Order.
```