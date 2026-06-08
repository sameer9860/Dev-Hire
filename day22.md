# Day 22 — Deploy Django to Railway ✅

## What was implemented

All code changes needed to deploy the Django backend to Railway are complete.

---

## Files Changed / Created

| File | Change |
|---|---|
| `backend/requirements.txt` | Added `gunicorn`, `whitenoise`, `dj-database-url` |
| `backend/core/settings.py` | WhiteNoise middleware, `STATIC_ROOT`, `DATABASE_URL` support, production security headers |
| `backend/Dockerfile` | Switched CMD to `gunicorn`, added `collectstatic` step |
| `backend/Procfile` | `release` (migrate + collectstatic) + `web` (gunicorn) |
| `backend/railway.json` | Railway builder config |
| `backend/.env.example` | Documents all local + Railway env vars |
| `docker-compose.yml` | Overrides CMD to keep dev server for local Docker |

---

## Railway Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "feat: configure Django for Railway deployment (Day 22)"
git push origin main
```

### 2. Create Railway Project
1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub repo** → choose `DevHire`
3. Set the **Root Directory** to `backend`

### 3. Add PostgreSQL Plugin
- In Railway dashboard → **+ New** → **Database** → **Add PostgreSQL**
- Railway will automatically inject `DATABASE_URL` into your service environment

### 4. Set Environment Variables in Railway Dashboard

| Variable | Value |
|---|---|
| `DJANGO_SECRET_KEY` | Generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `your-app.up.railway.app` |
| `CORS_ALLOWED_ORIGINS` | `https://your-frontend.vercel.app` |
| `DATABASE_URL` | ← **auto-injected** by the PostgreSQL plugin, do not set manually |

> **Note:** `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` are NOT needed on Railway — `DATABASE_URL` replaces all of them.

### 5. Deploy
- Railway auto-deploys on every `git push`
- The `release` phase in `Procfile` runs `migrate` + `collectstatic` before traffic starts
- Check the **Deploy Logs** tab in Railway for any errors

### 6. Verify Live API
Test these endpoints on your Railway URL:
```
GET  https://your-app.up.railway.app/api/jobs/
POST https://your-app.up.railway.app/api/auth/register/
POST https://your-app.up.railway.app/api/auth/login/
```

---

## How Settings Work (Local vs Production)

```
DATABASE_URL set?  →  YES (Railway)  →  dj_database_url parses it
                   →  NO  (Local)    →  individual DB_* vars used
```

```
DEBUG=False?  →  WhiteNoise CompressedManifestStaticFilesStorage
              →  SECURE_SSL_REDIRECT, SECURE_PROXY_SSL_HEADER enabled
```

---

## Next → Day 23: Deploy Next.js frontend to Vercel
Set `NEXT_PUBLIC_API_URL=https://your-app.up.railway.app/api` in Vercel dashboard.
