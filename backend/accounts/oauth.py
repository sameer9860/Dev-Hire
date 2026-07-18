"""Google / GitHub OAuth token exchange for developer accounts only."""

import json
import secrets
import urllib.error
import urllib.parse
import urllib.request

# pyrefly: ignore [missing-import]
from django.conf import settings
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model
# pyrefly: ignore [missing-import]
from rest_framework.exceptions import ValidationError
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


def _http_json(method: str, url: str, data: dict | None = None, headers: dict | None = None):
    body = None
    req_headers = dict(headers or {})
    if data is not None:
        body = urllib.parse.urlencode(data).encode('utf-8')
        req_headers.setdefault('Content-Type', 'application/x-www-form-urlencoded')
    request = urllib.request.Request(url, data=body, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=20) as resp:
            raw = resp.read().decode('utf-8')
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode('utf-8', errors='ignore')
        raise ValidationError({'detail': f'OAuth provider error: {detail or exc.reason}'}) from exc
    except urllib.error.URLError as exc:
        raise ValidationError({'detail': f'Could not reach OAuth provider: {exc.reason}'}) from exc


def exchange_google_code(code: str, redirect_uri: str) -> dict:
    client_id = settings.GOOGLE_CLIENT_ID
    client_secret = settings.GOOGLE_CLIENT_SECRET
    if not client_id or not client_secret:
        raise ValidationError({'detail': 'Google OAuth is not configured on the server.'})

    token_data = _http_json(
        'POST',
        'https://oauth2.googleapis.com/token',
        {
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code',
        },
    )
    access_token = token_data.get('access_token')
    if not access_token:
        raise ValidationError({'detail': 'Failed to obtain Google access token.'})

    profile = _http_json(
        'GET',
        'https://www.googleapis.com/oauth2/v3/userinfo',
        headers={'Authorization': f'Bearer {access_token}'},
    )
    email = (profile.get('email') or '').strip().lower()
    if not email:
        raise ValidationError({'detail': 'Google account email is required.'})
    if not profile.get('email_verified', True):
        raise ValidationError({'detail': 'Google email is not verified.'})

    return {
        'provider': 'google',
        'uid': str(profile.get('sub') or ''),
        'email': email,
        'name': profile.get('name') or email.split('@')[0],
        'avatar_url': profile.get('picture') or '',
    }


def exchange_github_code(code: str, redirect_uri: str) -> dict:
    client_id = settings.GITHUB_CLIENT_ID
    client_secret = settings.GITHUB_CLIENT_SECRET
    if not client_id or not client_secret:
        raise ValidationError({'detail': 'GitHub OAuth is not configured on the server.'})

    token_data = _http_json(
        'POST',
        'https://github.com/login/oauth/access_token',
        {
            'client_id': client_id,
            'client_secret': client_secret,
            'code': code,
            'redirect_uri': redirect_uri,
        },
        headers={'Accept': 'application/json'},
    )
    access_token = token_data.get('access_token')
    if not access_token:
        raise ValidationError({'detail': token_data.get('error_description') or 'Failed to obtain GitHub access token.'})

    profile = _http_json(
        'GET',
        'https://api.github.com/user',
        headers={
            'Authorization': f'Bearer {access_token}',
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'DevHire',
        },
    )
    emails = _http_json(
        'GET',
        'https://api.github.com/user/emails',
        headers={
            'Authorization': f'Bearer {access_token}',
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'DevHire',
        },
    )

    email = ''
    if isinstance(emails, list):
        primary = next((e for e in emails if e.get('primary') and e.get('verified')), None)
        verified = next((e for e in emails if e.get('verified')), None)
        chosen = primary or verified or (emails[0] if emails else None)
        if chosen:
            email = (chosen.get('email') or '').strip().lower()

    if not email:
        email = (profile.get('email') or '').strip().lower()
    if not email:
        raise ValidationError({'detail': 'GitHub account email is required. Make your email public or grant email scope.'})

    return {
        'provider': 'github',
        'uid': str(profile.get('id') or ''),
        'email': email,
        'name': profile.get('login') or profile.get('name') or email.split('@')[0],
        'avatar_url': profile.get('avatar_url') or '',
        'github_url': profile.get('html_url') or '',
    }


def _unique_username(base: str) -> str:
    import re

    cleaned = re.sub(r'[^a-zA-Z0-9_]', '', (base or 'dev'))[:30] or 'dev'
    candidate = cleaned
    n = 0
    while User.objects.filter(username__iexact=candidate).exists():
        n += 1
        suffix = secrets.token_hex(2) if n > 20 else str(n)
        candidate = f'{cleaned}{suffix}'[:50]
    return candidate


def get_or_create_developer_from_oauth(identity: dict):
    provider = identity['provider']
    uid = identity['uid']
    email = identity['email']

    if not uid:
        raise ValidationError({'detail': 'Invalid OAuth identity.'})

    user = User.objects.filter(oauth_provider=provider, oauth_uid=uid).first()
    if user:
        if user.role != 'developer':
            raise ValidationError({'detail': 'This social account is linked to a non-developer user.'})
        return user

    existing = User.objects.filter(email__iexact=email).first()
    if existing:
        if existing.role != 'developer':
            raise ValidationError({
                'detail': 'This email belongs to a company account. Please sign in with email and password.',
            })
        existing.oauth_provider = provider
        existing.oauth_uid = uid
        if identity.get('avatar_url') and not existing.avatar_url:
            existing.avatar_url = identity['avatar_url']
        if identity.get('github_url') and not existing.github_url:
            existing.github_url = identity['github_url']
        existing.save()
        return existing

    user = User(
        username=_unique_username(identity.get('name') or email.split('@')[0]),
        email=email,
        role='developer',
        oauth_provider=provider,
        oauth_uid=uid,
        avatar_url=identity.get('avatar_url') or '',
        github_url=identity.get('github_url') or '',
    )
    user.set_unusable_password()
    user.save()
    return user


def issue_tokens_for_user(user) -> dict:
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
        },
    }
