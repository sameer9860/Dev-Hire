import pytest
import re
from django.contrib.auth import get_user_model
from django.core import mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache


User = get_user_model()


@pytest.mark.django_db
def test_password_reset_otp_flow(client, settings):
    settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

    # Create user
    user = User.objects.create_user(username='testuser', email='test@example.com', password='OldPass123!')

    # 1. Request OTP
    resp = client.post('/api/auth/password-reset/', {'email': 'test@example.com'}, content_type='application/json')
    assert resp.status_code == 200

    # Email sent containing 6-digit OTP
    assert len(mail.outbox) == 1
    body = mail.outbox[0].body
    match = re.search(r'\b\d{6}\b', body)
    assert match is not None
    otp_code = match.group(0)

    # 2. Verify invalid OTP
    resp_invalid = client.post(
        '/api/auth/password-reset-verify-otp/',
        {'email': 'test@example.com', 'otp': '000000'},
        content_type='application/json',
    )
    assert resp_invalid.status_code == 400

    # 3. Verify correct OTP
    resp_verify = client.post(
        '/api/auth/password-reset-verify-otp/',
        {'email': 'test@example.com', 'otp': otp_code},
        content_type='application/json',
    )
    assert resp_verify.status_code == 200
    reset_token = resp_verify.json().get('reset_token')
    assert reset_token is not None

    # 4. Confirm new password using reset_token
    new_password = 'NewStrongP@ss1'
    resp_confirm = client.post(
        '/api/auth/password-reset-confirm/',
        {
            'email': 'test@example.com',
            'reset_token': reset_token,
            'new_password': new_password,
            'new_password2': new_password,
        },
        content_type='application/json',
    )
    assert resp_confirm.status_code == 200

    # 5. Verify password updated
    user.refresh_from_db()
    assert user.check_password(new_password)


@pytest.mark.django_db
def test_password_reset_legacy_link_confirm(client, settings):
    settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
    user = User.objects.create_user(username='legacyuser', email='legacy@example.com', password='OldPass123!')

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    new_password = 'NewLegacyP@ss1'
    resp = client.post(
        '/api/auth/password-reset-confirm/',
        {
            'uid': uid,
            'token': token,
            'new_password': new_password,
            'new_password2': new_password,
        },
        content_type='application/json',
    )
    assert resp.status_code == 200
    user.refresh_from_db()
    assert user.check_password(new_password)


@pytest.mark.django_db
def test_password_reset_rate_limit(client, settings):
    settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
    settings.PASSWORD_RESET_REQUEST_LIMIT = 2
    settings.PASSWORD_RESET_REQUEST_WINDOW = 3600

    from accounts import views as accounts_views
    accounts_views.PasswordResetRateLimiter._requests.clear()

    user = User.objects.create_user(username='limituser', email='limit@example.com', password='OldPass123!')
    payload = {'email': 'limit@example.com'}

    resp1 = client.post('/api/auth/password-reset/', payload, content_type='application/json')
    assert resp1.status_code == 200
    resp2 = client.post('/api/auth/password-reset/', payload, content_type='application/json')
    assert resp2.status_code == 200

    resp3 = client.post('/api/auth/password-reset/', payload, content_type='application/json')
    assert resp3.status_code == 429
