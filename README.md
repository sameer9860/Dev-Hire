# DevHire — Full-Stack Developer Job Board

A production-ready job board where tech companies post jobs and developers apply.

Built with Next.js, TypeScript, Django REST Framework, and PostgreSQL.

---

## Executive Summary

### Overview

DevHire is a full-stack recruitment platform built specifically for the technology industry. It enables companies to create and manage job listings while allowing developers to discover opportunities, submit applications, and track their hiring progress through a modern, responsive web application.

### Problem

Many companies rely on generic job boards that are not optimized for technical hiring workflows. Developers often have to search across multiple platforms, while recruiters struggle to manage applications efficiently.

### Solution

DevHire provides a centralized hiring platform tailored for software developers and technology companies. The system streamlines job posting, application management, applicant tracking, and profile management within a single platform.

### Target Users

- Technology startups
- Software companies
- Recruiters and hiring managers
- Frontend, Backend, Full-Stack, and DevOps engineers
- Computer science students and job seekers

### Key Features

- Role-based authentication for Companies and Developers
- Advanced job search and filtering
- Job application management system
- Applicant tracking workflow
- Public company and developer profiles
- Responsive mobile-first design
- SEO-friendly job pages
- Secure JWT authentication

### Business Value

- Reduces recruitment management overhead
- Improves candidate discovery and application tracking
- Provides a focused hiring experience for the tech industry
- Creates a scalable foundation for future recruitment services

### Future Expansion Opportunities

- Resume parsing and AI-powered candidate matching
- Premium company subscriptions
- Featured job postings
- Interview scheduling tools
- Email notification automation
- Analytics dashboard for recruiters

### Project Status

✅ MVP Completed

✅ Production Deployment Available

✅ Responsive UI

✅ Authentication & Authorization Implemented

✅ PostgreSQL Database Integration

✅ Ready for Portfolio Demonstration and Further Scaling

---

## Live Demo

| Platform    | URL                                             |
| ----------- | ----------------------------------------------- |
| Frontend    | https://devhire-frontend-gamma.vercel.app       |
| Backend API | https://dev-hire-production-0047.up.railway.app |
| GitHub      | https://github.com/sameer9860/Dev-Hire.git      |

Replace the URLs above with your deployed Vercel, Railway, and GitHub links.

## Features

### Authentication & Roles

- JWT authentication with access + refresh tokens (`djangorestframework-simplejwt`)
- Role-based accounts: **Company** and **Developer**
- Protected routes and role-specific dashboards

### Jobs

- Public job listings with search, filters, and pagination
- Filters: job type, experience level, remote, salary range
- Companies can create, update, and manage their own listings
- Dynamic SEO metadata on job detail pages

### Applications

- Developers apply to jobs with cover letter and resume URL
- Duplicate application prevention
- Application status workflow: `pending` → `reviewing` → `shortlisted` → `accepted` / `rejected`
- Company dashboard to review and update applicant status
- Developer dashboard to track application history

### Profiles

- Public developer/company profile pages (`/profile/[username]`)
- Role-based profile editing (skills, portfolio, company info)

### Frontend

- Next.js App Router with Server + Client component split
- TypeScript strict mode with shared API types
- TanStack Query for data fetching and caching
- React Hook Form + Zod validation
- Route-level `loading.tsx` skeletons
- Responsive design (mobile → desktop)
- Toast notifications with Sonner

### Backend

- Django REST Framework with filtering, search, and ordering
- Pytest test suite for auth, jobs, and applications
- Production deploy with Gunicorn + WhiteNoise on Railway

---

## Tech Stack

| Layer         | Technology                                                |
| ------------- | --------------------------------------------------------- |
| Frontend      | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Data fetching | TanStack Query v5, Axios                                  |
| Forms         | React Hook Form + Zod                                     |
| Backend       | Django 6, Django REST Framework                           |
| Auth          | JWT (simplejwt)                                           |
| Database      | PostgreSQL                                                |
| Testing       | pytest, pytest-django                                     |
| Local dev     | Docker Compose                                            |
| Deployment    | Vercel (frontend) + Railway (backend)                     |

---

## Project Structure

```
devhire/
├── backend/                    # Django REST API
│   ├── accounts/               # Auth, users, profiles
│   ├── jobs/                   # Job listings
│   ├── applications/           # Job applications
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
│   │   ├── components/         # UI + feature components
│   │   ├── hooks/              # React Query hooks
│   │   ├── lib/                # API client, auth helpers
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

For local development, override the backend command in `docker-compose.yml`:

```yaml
command: python manage.py runserver 0.0.0.0:8000
```

### 4. Open the app

| Service           | URL                         |
| ----------------- | --------------------------- |
| Frontend          | http://localhost:3000       |
| Backend API       | http://localhost:8000/api   |
| Django Admin      | http://localhost:8000/admin |
| PostgreSQL (host) | localhost:5433              |

> `db_dump.sql` loads automatically on first database startup. To reload seed data: `docker compose down -v` then `docker compose up --build`.

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

| Method | Endpoint              | Description                    |
| ------ | --------------------- | ------------------------------ |
| GET    | `/applications/`      | List applications (role-based) |
| POST   | `/applications/`      | Apply to job (developer only)  |
| PATCH  | `/applications/<id>/` | Update status (company only)   |

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
- Application flow and status updates
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

## Environment Variables

### Backend (`.env`)

| Variable                                                      | Description                           |
| ------------------------------------------------------------- | ------------------------------------- |
| `DJANGO_SECRET_KEY`                                           | Django secret key                     |
| `DEBUG`                                                       | `True` locally, `False` in production |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` | Local PostgreSQL                      |
| `DATABASE_URL`                                                | Railway PostgreSQL (production)       |
| `ALLOWED_HOSTS`                                               | Comma-separated allowed hosts         |
| `CORS_ALLOWED_ORIGINS`                                        | Frontend origin(s)                    |
| `CSRF_TRUSTED_ORIGINS`                                        | Trusted origins for CSRF (production) |

### Frontend (`.env.local` / Vercel)

| Variable               | Description                      |
| ---------------------- | -------------------------------- |
| `NEXT_PUBLIC_API_URL`  | Backend API base URL             |
| `NEXT_PUBLIC_SITE_URL` | Site URL for metadata (optional) |

---

## Author

**Samir Khatiwada**  
Full-Stack Developer | Django + Next.js + TypeScript

- Portfolio: [samirkhatiwada.com.np](https://samirkhatiwada.com.np)

---

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.
