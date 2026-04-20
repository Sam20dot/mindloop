# MindLoop Quick Reference

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | Login, get JWT | No |
| POST | `/api/v1/auth/logout` | Logout | Yes |
| GET | `/api/v1/auth/me` | Get current user | Yes |
| POST | `/api/v1/auth/token/refresh` | Refresh JWT | Yes |
| POST | `/api/v1/sessions/start` | Start learning session | Yes |
| GET | `/api/v1/sessions/:id` | Get session details | Yes |
| PATCH | `/api/v1/sessions/:id/complete` | Complete session | Yes |
| GET | `/api/v1/sessions/history` | Session history | Yes |
| POST | `/api/v1/questions/generate` | AI generate questions | Yes |
| GET | `/api/v1/questions/:session_id` | Get session questions | Yes |
| POST | `/api/v1/answers/submit` | Submit + AI evaluate answer | Yes |
| GET | `/api/v1/answers/:session_id` | Get session answers | Yes |
| GET | `/api/v1/skills/me` | Get user skills | Yes |
| POST | `/api/v1/skills/add` | Add skill manually | Yes |
| GET | `/api/v1/cv/:user_id` | Get user CV | Yes |
| POST | `/api/v1/cv/generate` | AI generate CV | Yes |
| POST | `/api/v1/roadmap/generate` | AI generate roadmap | Yes |
| GET | `/api/v1/roadmap/:user_id` | Get user roadmaps | Yes |
| GET | `/api/v1/opportunities/` | All opportunities | Yes |
| GET | `/api/v1/opportunities/match` | Matched to user skills | Yes |
| POST | `/api/v1/materials/upload-file` | Upload PDF/DOCX/TXT | Yes |
| POST | `/api/v1/materials/upload-url` | Upload URL/YouTube | Yes |
| GET | `/api/v1/materials/` | Get user materials | Yes |
| DELETE | `/api/v1/materials/:id` | Delete material | Yes |
| GET | `/api/v1/community/posts/` | Get community posts | Yes |
| POST | `/api/v1/community/posts/` | Create post | Yes |
| POST | `/api/v1/community/posts/:id/like` | Like/unlike post | Yes |
| POST | `/api/v1/community/posts/:id/comments` | Add comment | Yes |
| GET | `/api/v1/leaderboard/` | Global leaderboard | Yes |
| GET | `/api/v1/badges/me` | Get user badges | Yes |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Example | Required |
|----------|---------|----------|
| `SECRET_KEY` | `django-insecure-...` | Yes |
| `DEBUG` | `False` | Yes |
| `ALLOWED_HOSTS` | `mindloop-production.up.railway.app` | Yes |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | Yes |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Yes |
| `FRONTEND_URL` | `https://mindloop-psi.vercel.app` | Yes |

### Frontend (`frontend/.env.local`)

| Variable | Example | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_API_URL` | `https://mindloop-production.up.railway.app` | Yes |
| `NEXTAUTH_URL` | `https://mindloop-psi.vercel.app` | Yes |
| `NEXTAUTH_SECRET` | `any-random-strong-string` | Yes |

---

## Local Development Commands

### Backend

```bash
cd mindloop/backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver     # Runs on http://localhost:8000
```

### Frontend

```bash
cd mindloop/frontend
npm install
npm run dev                    # Runs on http://localhost:3000
```

### Both at once (two terminals)

```bash
# Terminal 1
cd mindloop/backend && venv\Scripts\activate && python manage.py runserver

# Terminal 2
cd mindloop/frontend && npm run dev
```

---

## Deployment Commands

### Deploy to Railway (backend)

```bash
# First time — link project
railway login
railway link

# Every deploy — just push to main
git add .
git commit -m "your message"
git push origin main

# Railway auto-runs on deploy:
# python manage.py migrate --no-input
# python manage.py collectstatic --no-input
# gunicorn mindloop_project.wsgi --bind 0.0.0.0:$PORT --workers 2 --timeout 120
```

### Deploy to Vercel (frontend)

```bash
# First time
cd frontend
vercel --prod

# Every deploy — just push to main (auto-deploys if connected)
git push origin main
```

### Manually trigger Railway redeploy

```bash
railway redeploy
```

---

## Useful Debug Commands

```bash
# Check Django configuration
cd backend && python manage.py check

# Run Django shell
python manage.py shell

# Check pending migrations
python manage.py showmigrations

# Create new migration after model change
python manage.py makemigrations <app_name>

# Frontend type check
cd frontend && npx tsc --noEmit

# Frontend production build test
cd frontend && npm run build

# View Railway logs
railway logs

# View all environment variables on Railway
railway variables
```

---

## Points Reference

| Action | Points |
|--------|--------|
| Upload material | +10 |
| Read material chunk | +5 |
| Correct answer | +10 |
| Session completion | +20 |
| First skill earned | +50 |
| CV generated | +30 |

## Badge Reference

| Badge | Trigger |
|-------|---------|
| Focus Master | Complete 3 sessions in a row |
| Quick Learner | Score 90%+ on first attempt |
| Consistent Student | 7-day learning streak |
| Skill Builder | Earn 5 distinct skills |
| Opportunity Seeker | View 10+ opportunities |

---

## Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router) | 15+ |
| Styling | Tailwind CSS | v4 |
| Auth | NextAuth | v4 |
| Backend | Django + DRF | 5.x |
| Database | PostgreSQL | 17 |
| AI | Anthropic Claude | `claude-sonnet-4-20250514` |
| Backend hosting | Railway | — |
| Frontend hosting | Vercel | — |
