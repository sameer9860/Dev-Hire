FROM python:3.12-slim

# Install system dependencies needed for compiling psycopg2 and general tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend files
COPY . .

# Note: Static files are collected during the release phase in Procfile
# This is done to avoid database connectivity issues during Docker build

# Expose port (Railway injects $PORT at runtime)
EXPOSE 8000

# Use gunicorn in production; Railway overrides $PORT automatically
CMD gunicorn core.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120

