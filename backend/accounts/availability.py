"""Helpers for checking whether registration fields are already taken."""

from urllib.parse import urlparse

# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model

User = get_user_model()


def normalize_website(url: str) -> str:
    """Normalize website for uniqueness compares (host + path, no scheme/www)."""
    raw = (url or '').strip()
    if not raw:
        return ''
    if '://' not in raw:
        raw = f'https://{raw}'

    parsed = urlparse(raw)
    host = (parsed.hostname or '').lower()
    if host.startswith('www.'):
        host = host[4:]

    path = (parsed.path or '').rstrip('/')
    if path == '/':
        path = ''

    return f'{host}{path}'


def email_taken(email: str) -> bool:
    email = (email or '').strip()
    if not email:
        return False
    return User.objects.filter(email__iexact=email).exists()


def company_name_taken(name: str) -> bool:
    name = (name or '').strip()
    if not name:
        return False
    return User.objects.filter(role='company', company_name__iexact=name).exists()


def company_website_taken(website: str) -> bool:
    website = (website or '').strip()
    if not website:
        return False

    target = normalize_website(website)
    if not target:
        return False

    for existing in (
        User.objects.filter(role='company')
        .exclude(company_website='')
        .values_list('company_website', flat=True)
    ):
        if normalize_website(existing) == target:
            return True
    return False
