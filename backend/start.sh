#!/bin/bash
set -e

echo " Starting DevHire Backend..."

echo " Running migrations..."
python manage.py migrate --noinput

echo " Collecting static files..."
python manage.py collectstatic --noinput

echo " Migrations and static files ready"

# OTPs live in cache. Multiple workers need a shared Redis (REDIS_URL).
# Without it, LocMemCache is per-process and password-reset / email-change
# verification fails intermittently — stay on 1 worker in that case.
if [ -n "${REDIS_URL:-}" ]; then
  WORKERS=2
  echo " REDIS_URL set — starting Gunicorn with ${WORKERS} workers"
else
  WORKERS=1
  echo " WARNING: REDIS_URL not set — starting Gunicorn with 1 worker (OTP cache is in-process)"
fi

exec gunicorn core.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers "${WORKERS}" \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
