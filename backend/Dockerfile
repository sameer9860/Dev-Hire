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

# Expose port
EXPOSE 8000

# Default command for development (will be overridden or customized in compose if needed)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
