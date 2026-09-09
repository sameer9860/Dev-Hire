# DevHire — Full-Stack Developer Job Board

A production-ready job board where tech companies post jobs and developers apply.

Built with Next.js, TypeScript, Django REST Framework, and PostgreSQL.

---

## Live Demo

| Platform    | URL                                             |
| ----------- | ----------------------------------------------- |
| Frontend    | https://devhire-frontend-gamma.vercel.app       |
| Backend API | https://dev-hire-production-0047.up.railway.app |
| GitHub      | https://github.com/sameer9860/Dev-Hire.git      |

## Executive Summary

### Overview

DevHire is a full-stack recruitment platform built specifically for the technology industry. It enables companies to create and manage job listings while allowing developers to discover opportunities, submit applications, and track their hiring progress through a modern, responsive web application.

### Problem

Many companies rely on generic job boards that are not optimized for technical hiring workflows. Developers often have to search across multiple platforms, while recruiters struggle to manage applications efficiently.

### Solution

DevHire provides a centralized hiring platform tailored for software developers and technology companies. The system streamlines job posting, application management, applicant tracking, candidate evaluation, and profile management within a single unified platform.

### Target Users

- Technology startups
- Software companies
- Recruiters and hiring managers
- Frontend, Backend, Full-Stack, and DevOps engineers
- Computer science students and job seekers

### Key Features

- Role-based authentication for Companies, Developers, and Admin
- Advanced job search, filtering, and pagination
- Specialized **Candidates & Applicants Management** page with real-time status counts and filters (All, Pending, Reviewing, Shortlisted, Accepted, Rejected, Saved)
- Dedicated **Candidate Application Detail Page** (`/dashboard/company/applications/[id]`) for candidate evaluation, resume viewing, and internal recruitment notes
- Collapsible sidebar navigation for seamless access to jobs and applicants
- Public company and developer profiles
- Responsive mobile-first design with dark mode accents
- SEO-friendly job pages with dynamic metadata
- Secure JWT authentication with OTP password reset & email verification

### Business Value

- Reduces recruitment management overhead
- Improves candidate discovery and structured application tracking
- Provides a focused hiring experience for the tech industry
- Creates a scalable foundation for future recruitment services

### Future Expansion Opportunities

- AI-powered candidate resume parsing and job matching
- Premium company subscriptions & featured job listings
- Integrated interview scheduling calendar
- Automated email notification triggers
- Recruiter analytics dashboard

### Project Status

✅ MVP Completed  
✅ Production Deployment Available  
✅ Responsive UI & Modern Layout  
✅ Dedicated Candidate Detail & Pipeline Management  
✅ Authentication & Authorization Implemented  
✅ PostgreSQL Database Integration  
✅ Ready for Portfolio Demonstration and Further Scaling  

---

## Features

### Authentication & Roles

- JWT authentication with access + refresh tokens (`djangorestframework-simplejwt`)
- Role-based accounts: **Company**, **Developer**, and **Admin**
- Protected routes, auth state hydration, and role-specific dashboards
- Email verification & password reset with Redis OTP caching

### Jobs

- Public job listings with live search, filters, and pagination
- Filters: job type, experience level, remote option, salary range
- Companies can create, edit, toggle status, and manage their listings
- Dynamic SEO metadata on job detail pages

### Applications & Candidate Management

- Developers apply to jobs with cover letters and attached resume URLs
- Duplicate application prevention per job
- Application status workflow: `pending` → `reviewing` → `shortlisted` → `accepted` / `rejected`
- Dedicated **Candidates & Applicants** view (`/dashboard/company/applications`) with search, sorting, bookmarking, and tab filtering
- Standalone **Application Detail Page** (`/dashboard/company/applications/[id]`) with:
  - Deep candidate profile inspection & skills overview
  - Direct resume download / external document link
  - Real-time status pipeline updates & saveable internal evaluation notes
- Developer dashboard to track application status history

### Navigation & UI Shell

- Collapsible sidebar navigation with user-controlled expand/collapse behavior (`Jobs` and `Candidates`)
- Notification bell & user account dropdown menu
- Skeletons and empty state feedback for smooth user feedback

### Profiles

- Public developer/company profile pages (`/profile/[username]`)
- Role-based profile editing (skills, bio, social links, company details)

### Frontend Architecture

- Next.js App Router with Server + Client component split
- TypeScript strict mode with shared API interfaces
- TanStack Query v5 for client-side data fetching and mutation caching
- React Hook Form + Zod schema validation
- Toast notifications with Sonner

### Backend Architecture

- Django REST Framework with filtering, search, and ordering
- Pytest test suite for auth, jobs, and applications
- Production deployment with Gunicorn + WhiteNoise on Railway

---

## Tech Stack

| Layer         | Technology                                                |
| ------------- | --------------------------------------------------------- |
| Frontend      | Next.js 16, React 19, TypeScript, Tailwind CSS, Lucide icons |
| Data fetching | TanStack Query v5, Axios                                  |
| Forms         | React Hook Form + Zod                                     |
| Backend       | Django 6, Django REST Framework                           |
| Auth          | JWT (simplejwt)                                           |
| Caching       | Redis (OTP caching)                                       |
| Database      | PostgreSQL                                                |
| Testing       | pytest, pytest-django                                     |
| Local dev     | Docker Compose                                            |
| Deployment    | Vercel (frontend) + Railway (backend)                     |

---

## Project Structure

```
devhire/
├── backend/                    # Django REST API
│   ├── accounts/               # Auth, users, profiles, OTP handlers
│   ├── jobs/                   # Job listings & management
│   ├── applications/           # Applications, candidate detail & status tracking
│   ├── core/                   # Settings, URLs, WSGI
│   ├── db_dump.sql             # Seed data for local Docker
│   ├── Dockerfile              # Used by Railway + local Docker
│   ├── railway.json
│   ├── start.sh                # Migrate, collectstatic, Gunicorn
│   ├── requirements.txt
│   └── pytest.ini
├── frontend/                   # Next.js app
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   │   └── dashboard/
│   │   │       ├── company/
│   │   │       │   ├── applications/
│   │   │       │   │   ├── page.tsx          # Candidates list page
│   │   │       │   │   └── [id]/page.tsx     # Candidate detail page
│   │   │       │   └── jobs/
│   │   │       ├── developer/
│   │   │       ├── admin/
│   │   │       └── messages/
│   │   ├── components/         # UI & feature components
│   │   │   ├── dashboard/
│   │   │   │   ├── CompanyApplicationsClient.tsx
│   │   │   │   ├── CompanyApplicationDetailClient.tsx
│   │   │   │   └── CompanyDashboard.tsx
│   │   │   └── AppShell.tsx
│   │   ├── hooks/              # React Query hooks (useApplications, useAuth, etc.)
│   │   ├── lib/                # API client, auth helpers, cookies
│   │   ├── schemas/            # Zod schemas
│   │   └── types/              # TypeScript interfaces
│   ├── Dockerfile
│   └── vercel.json
├── docker-compose.example.yml  # Local Docker template
└── README.md
```

---

## Quick Start (Docker — Recommended)

### Prerequisites

- Docker & Docker Compose
- Git

### 1. Clone the repo

```bash
git clone https://github.com/sameer9860/Dev-Hire.git
cd devhire
```

### 2. Create environment file

```bash
cp backend/.env.example .env
```

Fill in `.env`:

```env
DJANGO_SECRET_KEY=your-local-dev-secret-key
DEBUG=True
DB_NAME=devhire
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1,backend
CORS_ALLOWED_ORIGINS=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 3. Start services

```bash
cp docker-compose.example.yml docker-compose.yml
docker compose up --build
```

### 4. Open the app

| Service           | URL                         |
| ----------------- | --------------------------- |
| Frontend          | http://localhost:3000       |
| Backend API       | http://localhost:8000/api   |
| Django Admin      | http://localhost:8000/admin |
| PostgreSQL (host) | localhost:5433              |

---

## Manual Local Setup (Without Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # configure DB vars
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local
npm run dev
```

---

## API Endpoints

### Auth (`/api/auth/`)

| Method | Endpoint               | Description                           |
| ------ | ---------------------- | ------------------------------------- |
| POST   | `/register/`           | Register company or developer         |
| POST   | `/login/`              | Login (email + password) → JWT tokens |
| POST   | `/token/refresh/`      | Refresh access token                  |
| GET    | `/me/`                 | Current authenticated user            |
| PATCH  | `/profile/`            | Update own profile                    |
| GET    | `/profile/<username>/` | Public profile                        |

### Jobs (`/api/jobs/`)

| Method    | Endpoint      | Description                    |
| --------- | ------------- | ------------------------------ |
| GET       | `/jobs/`      | List jobs (public, filterable) |
| POST      | `/jobs/`      | Create job (company only)      |
| GET       | `/jobs/<id>/` | Job detail                     |
| PATCH/PUT | `/jobs/<id>/` | Update job (owner only)        |
| DELETE    | `/jobs/<id>/` | Delete job (owner only)        |

**Query filters:** `search`, `job_type`, `experience_level`, `is_remote`, `salary_min`, `salary_max`, `ordering`, `page`

### Applications (`/api/applications/`)

| Method | Endpoint                    | Description                                  |
| ------ | --------------------------- | -------------------------------------------- |
| GET    | `/applications/`            | List applications (role-based filterable)    |
| POST   | `/applications/`            | Apply to job (developer only)                |
| GET    | `/applications/<id>/`       | Single application detail (company/applicant)|
| PATCH  | `/applications/<id>/`       | Update status & internal notes (company only)|

### Health

| Method | Endpoint   | Description                     |
| ------ | ---------- | ------------------------------- |
| GET    | `/health/` | Backend + database health check |

---

## Running Tests

```bash
cd backend
pytest
```

Tests cover:

- User registration and JWT login
- Job CRUD permissions (company vs developer)
- Application flow, detail fetching, and status updates
- Duplicate application prevention

---

## Deployment

### Backend — Railway

1. Connect GitHub repo → set root directory to `backend`
2. Add PostgreSQL plugin
3. Set environment variables:

```env
DJANGO_SECRET_KEY=<strong-random-key>
DEBUG=False
DATABASE_URL=<from-railway-postgres>
ALLOWED_HOSTS=your-backend.up.railway.app
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
CSRF_TRUSTED_ORIGINS=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app

REDIS_URL=<redis or upstash rediss://...>
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_HOST_USER=...
EMAIL_HOST_PASSWORD=...
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

4. Railway builds from `Dockerfile` via `railway.json`
5. `start.sh` runs migrations, collectstatic, and starts Gunicorn

### Frontend — Vercel

1. Import GitHub repo → set root directory to `frontend`
2. Set environment variable:

```env
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api
```

3. Deploy — Vercel auto-detects Next.js

---

## TypeScript Concepts Used

| Concept             | Where                                                      |
| ------------------- | ---------------------------------------------------------- |
| `interface`         | `frontend/src/types/api.ts` — User, Job, Application       |
| Discriminated union | `AuthState`, `ProfileUpdate`                               |
| Generics            | `PaginatedResponse<T>`                                     |
| Utility types       | `Partial<JobFilters>`, `Record<ApplicationStatus, string>` |
| Zod inference       | `z.infer<typeof schema>` in form schemas                   |
| Type guards         | Role-based UI rendering (company vs developer)             |

---

## Author

**Samir Khatiwada**  
Full-Stack Developer | Django + Next.js + TypeScript

- Portfolio: [samirkhatiwada.com.np](https://samirkhatiwada.com.np)

---

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.
