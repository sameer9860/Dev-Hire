#!/usr/bin/env python
import os
import sys
import django
from django.core.management import call_command
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def ensure_migrations():
    """Run pending migrations before starting the app."""
    print("🚀 Starting DevHire Backend...")
    print("📦 Running pending migrations...")
    try:
        call_command('migrate', '--noinput', verbosity=2)
        print("✅ Migrations completed successfully")
    except Exception as e:
        print(f"❌ Migration error: {e}")
        sys.exit(1)
    
    print("📂 Collecting static files...")
    try:
        call_command('collectstatic', '--noinput', verbosity=1)
        print("✅ Static files collected successfully")
    except Exception as e:
        print(f"⚠️  Static collection warning: {e}")
    
    print("✅ All setup complete. Starting Gunicorn...")

if __name__ == '__main__':
    ensure_migrations()
    
    # Start Gunicorn
    import gunicorn.app.wsgiapp
    sys.argv = [
        'gunicorn',
        'core.wsgi:application',
        '--bind', f"0.0.0.0:{os.environ.get('PORT', '8000')}",
        '--workers', '2',
        '--timeout', '120',
        '--access-logfile', '-',
        '--error-logfile', '-',
    ]
    gunicorn.app.wsgiapp.run()
