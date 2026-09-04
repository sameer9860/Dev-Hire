# pyrefly: ignore [missing-import]
from rest_framework import generics, permissions, status
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from rest_framework.parsers import MultiPartParser, FormParser
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.views import TokenObtainPairView
import random
import re
from .serializers import EmailTokenObtainPairSerializer
# pyrefly: ignore [missing-import]
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    DeveloperProfileSerializer,
    CompanyProfileSerializer,
    PublicProfileSerializer,
    ChangePasswordSerializer,
    DeleteAccountSerializer,
)
from .serializers import PasswordResetSerializer, PasswordResetVerifyOTPSerializer, PasswordResetConfirmSerializer
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Q
from django.core.cache import cache
import logging
import secrets

logger = logging.getLogger(__name__)
# pyrefly: ignore [missing-import]
from .oauth import (
    exchange_google_code,
    exchange_github_code,
    get_or_create_developer_from_oauth,
    issue_tokens_for_user,
)
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model

User = get_user_model()


class LoginRateLimiter:
    """In-memory rate limiter: max 3 failed login attempts per IP per hour."""
    _attempts: dict[str, list[float]] = {}
    MAX_ATTEMPTS = 3
    WINDOW = 3600  # 1 hour in seconds

    @classmethod
    def _clean(cls, key: str) -> list[float]:
        import time
        now = time.time()
        cls._attempts[key] = [t for t in cls._attempts.get(key, []) if now - t < cls.WINDOW]
        return cls._attempts[key]

    @classmethod
    def is_locked(cls, key: str) -> bool:
        return len(cls._clean(key)) >= cls.MAX_ATTEMPTS

    @classmethod
    def remaining(cls, key: str) -> int:
        return max(0, cls.MAX_ATTEMPTS - len(cls._clean(key)))

    @classmethod
    def seconds_until_reset(cls, key: str) -> int:
        import time
        attempts = cls._clean(key)
        if not attempts:
            return 0
        return max(0, int(cls.WINDOW - (time.time() - attempts[0])))

    @classmethod
    def record_failure(cls, key: str) -> None:
        import time
        cls._clean(key)
        cls._attempts.setdefault(key, []).append(time.time())

    @classmethod
    def reset(cls, key: str) -> None:
        cls._attempts.pop(key, None)


def _get_client_ip(request) -> str:
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


class PasswordResetRateLimiter:
    """Simple in-memory rate limiter for password reset requests."""
    _requests: dict[str, list[float]] = {}

    @classmethod
    def _clean(cls, key: str) -> list[float]:
        import time
        now = time.time()
        window = getattr(settings, 'PASSWORD_RESET_REQUEST_WINDOW', 3600)
        cls._requests[key] = [t for t in cls._requests.get(key, []) if now - t < window]
        return cls._requests[key]

    @classmethod
    def is_limited(cls, key: str) -> bool:
        limit = getattr(settings, 'PASSWORD_RESET_REQUEST_LIMIT', 5)
        return len(cls._clean(key)) >= limit

    @classmethod
    def seconds_until_reset(cls, key: str) -> int:
        import time
        attempts = cls._clean(key)
        if not attempts:
            return 0
        window = getattr(settings, 'PASSWORD_RESET_REQUEST_WINDOW', 3600)
        return max(0, int(window - (time.time() - attempts[0])))

    @classmethod
    def record(cls, key: str) -> None:
        import time
        cls._clean(key)
        cls._requests.setdefault(key, []).append(time.time())


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        ip = _get_client_ip(request)
        if LoginRateLimiter.is_locked(ip):
            remaining_seconds = LoginRateLimiter.seconds_until_reset(ip)
            remaining_minutes = max(1, (remaining_seconds + 59) // 60)
            return Response(
                {
                    'detail': f'Too many failed login attempts. Please try again in {remaining_minutes} minute{"s" if remaining_minutes != 1 else ""}.',
                    'retry_after': remaining_seconds,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        try:
            response = super().post(request, *args, **kwargs)
        except Exception:
            LoginRateLimiter.record_failure(ip)
            raise
        if response.status_code == 200:
            LoginRateLimiter.reset(ip)
        else:
            LoginRateLimiter.record_failure(ip)
        return response


class RegisterView(generics.CreateAPIView):
       queryset = User.objects.all()
       serializer_class = RegisterSerializer
       permission_classes = [permissions.AllowAny]

class MeView(generics.RetrieveUpdateAPIView):
       serializer_class = UserSerializer
       permission_classes = [permissions.IsAuthenticated]

       def get_object(self):
           return self.request.user


class ProfileUpdateView(generics.RetrieveUpdateAPIView):
    """
    GET/PUT/PATCH /api/auth/profile/
    Returns role-appropriate serializer so developers can't edit company fields and vice versa.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        user = self.request.user
        if user.role == 'company':
            return CompanyProfileSerializer
        return DeveloperProfileSerializer

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        from .activity import PROFILE_FIELD_MESSAGES, log_profile_changes

        user = self.request.user
        tracked = list(PROFILE_FIELD_MESSAGES.keys())
        previous = {field: getattr(user, field, None) for field in tracked}
        serializer.save()
        user.refresh_from_db()
        updated = {field: getattr(user, field, None) for field in tracked}
        # Only log fields present in the request payload
        payload_fields = set(getattr(serializer, 'validated_data', {}).keys())
        log_profile_changes(
            user,
            previous,
            {field: updated[field] for field in tracked if field in payload_fields},
        )


class PublicProfileView(generics.RetrieveAPIView):
    """
    GET /api/auth/profile/<username>/
    Public profile — anyone can view.
    """
    serializer_class = PublicProfileSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'username'

    def get_queryset(self):
        return User.objects.all()


class CompanyPhotoUploadView(APIView):
    """POST /api/auth/company-photos/ — upload a company gallery image."""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if getattr(request.user, 'role', None) != 'company':
            return Response({'detail': 'Only company accounts can upload photos.'}, status=status.HTTP_403_FORBIDDEN)

        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'detail': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        if uploaded_file.size > 1 * 1024 * 1024:
            return Response({'detail': 'Each photo must be smaller than 1MB.'}, status=status.HTTP_400_BAD_REQUEST)

        from .storage import save_file_to_supabase_or_local
        photo_url = save_file_to_supabase_or_local(uploaded_file, request=request, folder='company-photos')
        photos = list(request.user.company_photos or [])
        if len(photos) >= 5:
            return Response({'detail': 'A company can have at most 5 photos.'}, status=status.HTTP_400_BAD_REQUEST)
        photos.append(photo_url)
        request.user.company_photos = photos
        request.user.save(update_fields=['company_photos'])
        return Response({'url': photo_url, 'company_photos': photos}, status=status.HTTP_201_CREATED)


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        from .activity import log_activity
        log_activity(
            request.user,
            category='security',
            action='password_changed',
            message='Changed password',
        )
        return Response({'detail': 'Password updated successfully.'}, status=status.HTTP_200_OK)


class DeleteAccountView(APIView):
    """DELETE /api/auth/delete-account/ — requires password confirmation."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        serializer = DeleteAccountSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.delete()
        return Response({'detail': 'Account deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)


def _email_change_cache_key(user_id, email: str) -> str:
    return f'change_email_otp:{user_id}:{(email or "").strip().lower()}'


def _email_change_verified_key(user_id, email: str) -> str:
    return f'change_email_verified:{user_id}:{(email or "").strip().lower()}'


class ChangeEmailRequestView(APIView):
    """POST /api/auth/change-email/request/ — body: { "new_email": "user@example.com" }"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from .serializers import ChangeEmailRequestSerializer
        serializer = ChangeEmailRequestSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        new_email = serializer.validated_data['new_email']
        user = request.user
        otp_code = f"{random.randint(100000, 999999)}"
        verification_token = secrets.token_urlsafe(32)
        cache_key = _email_change_cache_key(user.pk, new_email)
        cache.set(
            cache_key,
            {
                'otp': otp_code,
                'verification_token': verification_token,
                'user_id': user.pk,
                'attempts': 0,
            },
            timeout=600,
        )

        subject = 'Verify your new DevHire email address'
        message = (
            f"Hi {user.username},\n\n"
            f"You requested to change your DevHire email to {new_email}.\n"
            f"Your 6-digit verification code is: {otp_code}\n\n"
            f"Enter this code in Settings to confirm the change.\n"
            f"This code will expire in 10 minutes.\n"
            f"If you did not request this change, please ignore this email."
        )
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None)
        try:
            send_mail(subject, message, from_email, [new_email], fail_silently=False)
        except Exception:
            logger.exception('Failed to send email-change verification to %s', new_email)
            cache.delete(cache_key)
            return Response(
                {'detail': 'Could not send verification email. Check email settings and try again.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {'detail': 'Verification code sent to your new email. Confirm it before the email is updated.'},
            status=status.HTTP_200_OK,
        )


class ChangeEmailVerifyOTPView(APIView):
    """POST /api/auth/change-email/verify-otp/ — body: { "new_email": "user@example.com", "otp": "123456" }"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from .serializers import ChangeEmailVerifyOTPSerializer
        serializer = ChangeEmailVerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_email = serializer.validated_data['new_email']
        otp = serializer.validated_data['otp']
        cache_key = _email_change_cache_key(request.user.pk, new_email)
        change_data = cache.get(cache_key)

        if not change_data:
            return Response(
                {'detail': 'Verification code has expired or is invalid. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if change_data.get('attempts', 0) >= 5:
            cache.delete(cache_key)
            return Response(
                {'detail': 'Too many failed verification attempts. Please request a new verification email.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if change_data.get('otp') != otp:
            change_data['attempts'] = change_data.get('attempts', 0) + 1
            cache.set(cache_key, change_data, timeout=600)
            return Response(
                {'detail': 'Invalid verification code. Please check and try again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        verified_key = _email_change_verified_key(request.user.pk, new_email)
        verification_token = change_data.get('verification_token') or secrets.token_urlsafe(32)
        cache.set(
            verified_key,
            {
                'new_email': new_email,
                'verification_token': verification_token,
                'user_id': request.user.pk,
            },
            timeout=600,
        )
        cache.delete(cache_key)

        return Response(
            {
                'detail': 'New email verified successfully.',
                'verification_token': verification_token,
            },
            status=status.HTTP_200_OK,
        )


class ChangeEmailConfirmView(APIView):
    """POST /api/auth/change-email/confirm/ — body: { "new_email": "user@example.com", "verification_token": "..." }"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from .serializers import ChangeEmailConfirmSerializer
        serializer = ChangeEmailConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_email = serializer.validated_data['new_email']
        verification_token = serializer.validated_data['verification_token']
        verified_key = _email_change_verified_key(request.user.pk, new_email)
        verified_data = cache.get(verified_key)

        if not verified_data or verified_data.get('verification_token') != verification_token:
            return Response(
                {'detail': 'Email verification is invalid or expired. Please verify the new email again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.email = new_email
        request.user.save(update_fields=['email'])
        cache.delete(verified_key)

        from .activity import log_activity
        log_activity(
            request.user,
            category='security',
            action='email_changed',
            message='Email address updated after verification',
        )

        return Response({'detail': 'Email changed successfully.'}, status=status.HTTP_200_OK)


def _username_suggestions(base: str, count: int = 3) -> list[str]:
    """Build related unused usernames from a taken base (no spaces)."""
    cleaned = re.sub(r'\s+', '', base or '').strip()[:40]
    if not cleaned:
        return []

    suffixes = [
        str(random.randint(10, 99)),
        str(random.randint(100, 999)),
        str(random.randint(1000, 9999)),
        '1',
        '2',
        'x',
        'dev',
        'hq',
        'co',
        'pro',
        str(random.randint(10, 99)) + 'x',
    ]
    random.shuffle(suffixes)

    suggestions: list[str] = []
    for suffix in suffixes:
        candidate = f'{cleaned}{suffix}'[:50]
        if candidate.lower() == cleaned.lower():
            continue
        if User.objects.filter(username__iexact=candidate).exists():
            continue
        if candidate not in suggestions:
            suggestions.append(candidate)
        if len(suggestions) >= count:
            break

    # Fallback numeric loop if still short
    n = 1
    while len(suggestions) < count and n < 500:
        candidate = f'{cleaned}{n}'[:50]
        n += 1
        if User.objects.filter(username__iexact=candidate).exists():
            continue
        if candidate not in suggestions:
            suggestions.append(candidate)

    return suggestions[:count]


class CheckUsernameView(APIView):
    """
    GET /api/auth/check-username/?username=foo
    Returns availability and up to 3 related suggestions when taken.
    Works for both developer and company registration.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        username = (request.query_params.get('username') or '').strip()
        if not username:
            return Response(
                {'available': False, 'detail': 'Username is required.', 'suggestions': []},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if any(ch.isspace() for ch in username):
            return Response(
                {'available': False, 'detail': 'Username cannot contain spaces.', 'suggestions': []},
                status=status.HTTP_400_BAD_REQUEST,
            )
        from .password_rules import password_charset_ok, USERNAME_CHARSET_ERROR
        if not password_charset_ok(username):
            return Response(
                {'available': False, 'detail': USERNAME_CHARSET_ERROR, 'suggestions': []},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(username) < 3:
            return Response(
                {'available': False, 'detail': 'Username must be at least 3 characters.', 'suggestions': []},
                status=status.HTTP_400_BAD_REQUEST,
            )

        taken = User.objects.filter(username__iexact=username).exists()
        if taken:
            return Response({
                'available': False,
                'username': username,
                'detail': 'Username is already taken.',
                'suggestions': _username_suggestions(username, 3),
            })

        return Response({
            'available': True,
            'username': username,
            'detail': 'Username is available.',
            'suggestions': [],
        })


class CheckEmailView(APIView):
    """GET /api/auth/check-email/?email=user@example.com"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        email = (request.query_params.get('email') or '').strip()
        if not email:
            return Response(
                {'available': False, 'detail': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if any(ch.isspace() for ch in email):
            return Response(
                {'available': False, 'detail': 'Email cannot contain spaces.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if '@' not in email or '.' not in email.rsplit('@', 1)[-1]:
            return Response(
                {'available': False, 'detail': 'Enter a valid email address.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .availability import email_taken
        taken = email_taken(email)
        return Response({
            'available': not taken,
            'email': email,
            'detail': 'This email is already registered.' if taken else 'Email is available.',
        })


class CheckCompanyNameView(APIView):
    """GET /api/auth/check-company-name/?company_name=Acme"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        name = (request.query_params.get('company_name') or '').strip()
        if not name:
            return Response(
                {'available': False, 'detail': 'Company name is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if any(ch.isspace() for ch in name):
            return Response(
                {'available': False, 'detail': 'Company name cannot contain spaces.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .availability import company_name_taken
        taken = company_name_taken(name)
        return Response({
            'available': not taken,
            'company_name': name,
            'detail': 'This company name is already taken.' if taken else 'Company name is available.',
        })


class CheckCompanyWebsiteView(APIView):
    """GET /api/auth/check-company-website/?company_website=https://acme.com"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        website = (request.query_params.get('company_website') or '').strip()
        if not website:
            return Response(
                {'available': False, 'detail': 'Company website is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if any(ch.isspace() for ch in website):
            return Response(
                {'available': False, 'detail': 'Company website cannot contain spaces.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .availability import company_website_taken, normalize_website
        if not normalize_website(website):
            return Response(
                {'available': False, 'detail': 'Enter a valid website URL.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        taken = company_website_taken(website)
        return Response({
            'available': not taken,
            'company_website': website,
            'detail': (
                'This company website is already registered.'
                if taken
                else 'Company website is available.'
            ),
        })


class DeveloperOAuthView(APIView):
    """
    POST /api/auth/oauth/<provider>/
    Body: { "code": "...", "redirect_uri": "..." }
    Exchanges OAuth code and returns JWT for a developer account (create or login).
    Providers: google, github
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, provider: str):
        provider = (provider or '').lower()
        if provider not in ('google', 'github'):
            return Response({'detail': 'Unsupported provider.'}, status=status.HTTP_400_BAD_REQUEST)

        code = request.data.get('code')
        redirect_uri = request.data.get('redirect_uri')
        if not code or not redirect_uri:
            return Response(
                {'detail': 'code and redirect_uri are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if provider == 'google':
            identity = exchange_google_code(code, redirect_uri)
        else:
            identity = exchange_github_code(code, redirect_uri)

        user = get_or_create_developer_from_oauth(identity)
        return Response(issue_tokens_for_user(user), status=status.HTTP_200_OK)


class OAuthConfigView(APIView):
    """GET /api/auth/oauth/config/ — public client IDs for the frontend."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # pyrefly: ignore [missing-import]
        from django.conf import settings
        return Response({
            'google_client_id': getattr(settings, 'GOOGLE_CLIENT_ID', '') or '',
            'github_client_id': getattr(settings, 'GITHUB_CLIENT_ID', '') or '',
        })


class FileUploadView(APIView):
    """
    POST /api/auth/upload/
    Accepts a multipart file upload and saves it to Supabase Storage (or local storage fallback).
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        from .storage import save_file_to_supabase_or_local
        
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'detail': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)
        
        file_url = save_file_to_supabase_or_local(uploaded_file, request=request)
        return Response({'url': file_url}, status=status.HTTP_201_CREATED)


class ActivityLogListView(generics.ListAPIView):
    """GET /api/auth/activity/ — recent account activity for the current user."""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from .models import ActivityLog
        return ActivityLog.objects.filter(user=self.request.user)[:50]

    def list(self, request, *args, **kwargs):
        from .models import ActivityLog
        logs = list(self.get_queryset())
        unread_count = ActivityLog.objects.filter(user=request.user, is_read=False).count()
        data = [
            {
                'id': log.id,
                'category': log.category,
                'action': log.action,
                'message': log.message,
                'metadata': log.metadata,
                'is_read': log.is_read,
                'created_at': log.created_at,
            }
            for log in logs
        ]
        return Response({
            'count': len(data),
            'unread_count': unread_count,
            'results': data,
        })


class MarkActivityReadView(APIView):
    """POST /api/auth/activity/read-all/ — mark all activity as read."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from .models import ActivityLog
        updated = ActivityLog.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'updated': updated}, status=status.HTTP_200_OK)



class PasswordResetRequestView(APIView):
    """POST /api/auth/password-reset/ — body: { "email": "user@example.com" }"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].strip().lower()
        user = User.objects.filter(email__iexact=email).first()

        # Rate limit password reset requests per email and per IP
        ip = _get_client_ip(request)
        email_key = f'pwreset:email:{email}'
        ip_key = f'pwreset:ip:{ip}'

        if PasswordResetRateLimiter.is_limited(email_key) or PasswordResetRateLimiter.is_limited(ip_key):
            retry_seconds = max(PasswordResetRateLimiter.seconds_until_reset(email_key), PasswordResetRateLimiter.seconds_until_reset(ip_key))
            return Response({'detail': 'Too many password reset requests. Try again later.', 'retry_after': retry_seconds}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        if user:
            # Generate 6-digit numeric OTP code
            otp_code = f"{random.randint(100000, 999999)}"
            cache_key = f'pwreset_otp:{email}'
            cache.set(
                cache_key,
                {
                    'otp': otp_code,
                    'user_id': user.pk,
                    'attempts': 0,
                },
                timeout=600,  # 10 minutes TTL
            )

            subject = 'Your DevHire Password Reset Verification Code'
            message = (
                f"Hi {user.username},\n\n"
                f"You requested a password reset for your DevHire account.\n"
                f"Your 6-digit verification code is: {otp_code}\n\n"
                f"This code will expire in 10 minutes.\n"
                f"If you did not request this password reset, please ignore this email."
            )
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None)
            try:
                send_mail(subject, message, from_email, [user.email], fail_silently=False)
            except Exception:
                # Keep response enumeration-safe; log so Railway SMTP misconfig is visible.
                logger.exception('Failed to send password-reset OTP to %s', user.email)

        PasswordResetRateLimiter.record(email_key)
        PasswordResetRateLimiter.record(ip_key)

        return Response(
            {'detail': 'If an account with that email exists, a 6-digit verification code has been sent.'},
            status=status.HTTP_200_OK,
        )


class PasswordResetVerifyOTPView(APIView):
    """POST /api/auth/password-reset-verify-otp/ — body: { "email": "user@example.com", "otp": "123456" }"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetVerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].strip().lower()
        otp = serializer.validated_data['otp'].strip()

        cache_key = f'pwreset_otp:{email}'
        otp_data = cache.get(cache_key)

        if not otp_data:
            return Response(
                {'detail': 'Verification code has expired or is invalid. Please request a new code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp_data.get('attempts', 0) >= 5:
            cache.delete(cache_key)
            return Response(
                {'detail': 'Too many failed verification attempts. Please request a new code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp_data.get('otp') != otp:
            otp_data['attempts'] = otp_data.get('attempts', 0) + 1
            cache.set(cache_key, otp_data, timeout=300)
            return Response(
                {'detail': 'Invalid verification code. Please check and try again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Code is valid! Create a temporary single-use reset_token
        reset_token = secrets.token_urlsafe(32)
        verified_key = f'pwreset_verified:{email}'
        cache.set(
            verified_key,
            {
                'user_id': otp_data['user_id'],
                'reset_token': reset_token,
            },
            timeout=600,  # 10 minutes to complete password reset
        )
        # Clear the OTP code so it cannot be reused
        cache.delete(cache_key)

        return Response(
            {
                'detail': 'Verification code confirmed successfully.',
                'reset_token': reset_token,
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """POST /api/auth/password-reset-confirm/ — body: { email, reset_token, new_password, new_password2 }"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = (serializer.validated_data.get('email') or '').strip().lower()
        reset_token = serializer.validated_data.get('reset_token')
        uid = serializer.validated_data.get('uid')
        token = serializer.validated_data.get('token')
        new_password = serializer.validated_data.get('new_password')

        user = None

        # Method 1: OTP Verified Token (Email + Reset Token)
        if email and reset_token:
            verified_key = f'pwreset_verified:{email}'
            verified_data = cache.get(verified_key)
            if not verified_data or verified_data.get('reset_token') != reset_token:
                return Response(
                    {'detail': 'Invalid or expired reset session. Please verify your OTP code again.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user = User.objects.filter(pk=verified_data.get('user_id')).first()
            if user:
                cache.delete(verified_key)

        # Method 2: Legacy UID + Token direct link
        elif uid and token:
            try:
                uid_decoded = force_str(urlsafe_base64_decode(uid))
                user = User.objects.filter(pk=uid_decoded).first()
            except Exception:
                return Response({'detail': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)

            if not user or not default_token_generator.check_token(user, token):
                return Response({'detail': 'Invalid or expired reset token.'}, status=status.HTTP_400_BAD_REQUEST)

        if not user:
            return Response({'detail': 'User not found or session invalid.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        from .activity import log_activity
        log_activity(
            user,
            category='security',
            action='password_reset',
            message='Password reset via OTP verification',
        )
        return Response({'detail': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)


from .serializers import (
    ContactMessageSerializer,
    DirectMessageSerializer,
    AdminUserUpdateSerializer,
)
from .models import ContactMessage, DirectMessage


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_staff or request.user.is_superuser or getattr(request.user, 'role', '') == 'admin')
        )


class ContactCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        name = (request.data.get('name') or '').strip()
        email = (request.data.get('email') or '').strip()
        subject = (request.data.get('subject') or '').strip()
        category = request.data.get('category') or 'others'
        description = (request.data.get('description') or '').strip()
        attachment_url = (request.data.get('attachment_url') or '').strip()

        if request.user and request.user.is_authenticated:
            if not name:
                name = request.user.username
            if not email:
                email = request.user.email

        if not name or not email or not subject or not description:
            return Response(
                {'detail': 'Name, email, subject, and description are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        contact_msg = ContactMessage.objects.create(
            user=request.user if (request.user and request.user.is_authenticated) else None,
            name=name,
            email=email,
            subject=subject,
            category=category,
            description=description,
            attachment_url=attachment_url,
        )

        if request.user and request.user.is_authenticated:
            from .activity import log_activity
            log_activity(
                request.user,
                category='profile',
                action='contact_submission',
                message=f'Contact submission sent: {subject[:30]}',
            )

        serializer = ContactMessageSerializer(contact_msg)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from jobs.models import Job
        from applications.models import Application

        total_users = User.objects.count()
        total_developers = User.objects.filter(role='developer').count()
        total_companies = User.objects.filter(role='company').count()
        total_admins = User.objects.filter(Q(role='admin') | Q(is_staff=True) | Q(is_superuser=True)).distinct().count()

        total_jobs = Job.objects.count()
        active_jobs = Job.objects.filter(is_active=True).count()
        closed_jobs = Job.objects.filter(is_active=False).count()

        total_applications = Application.objects.count()
        pending_applications = Application.objects.filter(status='pending').count()
        accepted_applications = Application.objects.filter(status='accepted').count()

        total_contact_messages = ContactMessage.objects.count()
        pending_contact_messages = ContactMessage.objects.filter(status='pending').count()

        unread_direct_messages = DirectMessage.objects.filter(recipient=request.user, is_read=False).count()

        return Response({
            'total_users': total_users,
            'total_developers': total_developers,
            'total_companies': total_companies,
            'total_admins': total_admins,
            'total_jobs': total_jobs,
            'active_jobs': active_jobs,
            'closed_jobs': closed_jobs,
            'total_applications': total_applications,
            'pending_applications': pending_applications,
            'accepted_applications': accepted_applications,
            'total_contact_messages': total_contact_messages,
            'pending_contact_messages': pending_contact_messages,
            'unread_direct_messages': unread_direct_messages,
        })


class AdminUserListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        queryset = User.objects.all().order_by('-date_joined')
        role = request.query_params.get('role')
        search = request.query_params.get('search')
        is_active = request.query_params.get('is_active')

        if role:
            queryset = queryset.filter(role=role)
        if is_active is not None:
            if is_active.lower() == 'true':
                queryset = queryset.filter(is_active=True)
            elif is_active.lower() == 'false':
                queryset = queryset.filter(is_active=False)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(company_name__icontains=search) |
                Q(headline__icontains=search)
            )

        serializer = UserSerializer(queryset, many=True)
        return Response({'results': serializer.data, 'count': queryset.count()})


class AdminUserDetailView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        target_user = generics.get_object_or_404(User, pk=pk)
        is_active = request.data.get('is_active')
        role = request.data.get('role')

        if is_active is not None:
            target_user.is_active = bool(is_active)
        if role in ['developer', 'company', 'admin']:
            target_user.role = role
            if role == 'admin':
                target_user.is_staff = True

        target_user.save()
        serializer = UserSerializer(target_user)
        return Response(serializer.data)

    def delete(self, request, pk):
        target_user = generics.get_object_or_404(User, pk=pk)
        if target_user.pk == request.user.pk:
            return Response({'detail': 'Cannot delete your own admin account.'}, status=status.HTTP_400_BAD_REQUEST)
        target_user.delete()
        return Response({'detail': 'User account deleted successfully.'}, status=status.HTTP_200_OK)


class AdminJobListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from jobs.models import Job
        from jobs.serializers import JobSerializer

        queryset = Job.objects.all().select_related('company').order_by('-created_at')
        search = request.query_params.get('search')
        is_active = request.query_params.get('is_active')

        if is_active is not None:
            if is_active.lower() == 'true':
                queryset = queryset.filter(is_active=True)
            elif is_active.lower() == 'false':
                queryset = queryset.filter(is_active=False)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(company__company_name__icontains=search) |
                Q(location__icontains=search)
            )

        serializer = JobSerializer(queryset, many=True)
        return Response({'results': serializer.data, 'count': queryset.count()})


class AdminJobDetailView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        from jobs.models import Job
        from jobs.serializers import JobSerializer

        job = generics.get_object_or_404(Job, pk=pk)
        is_active = request.data.get('is_active')
        if is_active is not None:
            job.is_active = bool(is_active)
            job.save()

        serializer = JobSerializer(job)
        return Response(serializer.data)

    def delete(self, request, pk):
        from jobs.models import Job

        job = generics.get_object_or_404(Job, pk=pk)
        job.delete()
        return Response({'detail': 'Job posting deleted.'}, status=status.HTTP_200_OK)


class AdminContactMessageListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        queryset = ContactMessage.objects.all().select_related('user').order_by('-created_at')
        category = request.query_params.get('category')
        msg_status = request.query_params.get('status')
        search = request.query_params.get('search')

        if category:
            queryset = queryset.filter(category=category)
        if msg_status:
            queryset = queryset.filter(status=msg_status)
        if search:
            queryset = queryset.filter(
                Q(subject__icontains=search) |
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(description__icontains=search)
            )

        serializer = ContactMessageSerializer(queryset, many=True)
        return Response({'results': serializer.data, 'count': queryset.count()})


class AdminContactMessageDetailView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        msg = generics.get_object_or_404(ContactMessage, pk=pk)
        msg_status = request.data.get('status')
        admin_notes = request.data.get('admin_notes')
        reply_body = (request.data.get('reply') or '').strip()

        if msg_status:
            msg.status = msg_status
        if admin_notes is not None:
            msg.admin_notes = admin_notes
        msg.save()

        if reply_body:
            recipient_user = msg.user
            if not recipient_user and msg.email:
                recipient_user = User.objects.filter(email__iexact=msg.email).first()

            if recipient_user:
                DirectMessage.objects.create(
                    sender=request.user,
                    recipient=recipient_user,
                    subject=f"Re: {msg.subject}",
                    body=reply_body,
                )

        serializer = ContactMessageSerializer(msg)
        return Response(serializer.data)


class MessageableUsersView(APIView):
    """Return users that the current user is allowed to message."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        is_admin = user.is_staff or user.is_superuser or user.role == 'admin'
        search = request.query_params.get('search', '').strip()

        if is_admin:
            # Admin can message everyone except themselves
            qs = User.objects.exclude(pk=user.pk)
        elif user.role == 'company':
            # Company can message admins and developers
            qs = User.objects.filter(
                Q(role='developer') | Q(role='admin') | Q(is_staff=True) | Q(is_superuser=True)
            ).exclude(pk=user.pk)
        else:
            # Developer can message admins and companies
            qs = User.objects.filter(
                Q(role='company') | Q(role='admin') | Q(is_staff=True) | Q(is_superuser=True)
            ).exclude(pk=user.pk)

        if search:
            qs = qs.filter(
                Q(username__icontains=search) | Q(email__icontains=search)
            )

        qs = qs.filter(is_active=True).order_by('username')[:50]
        serializer = UserSerializer(qs, many=True)
        return Response({'results': serializer.data, 'count': len(serializer.data)})


class DirectMessageListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        target_user_id = request.query_params.get('user_id')

        if target_user_id:
            # Filter conversation with a specific user
            messages_qs = DirectMessage.objects.filter(
                (Q(sender=user) & Q(recipient_id=target_user_id)) |
                (Q(sender_id=target_user_id) & Q(recipient=user))
            ).select_related('sender', 'recipient').order_by('created_at')
        else:
            # Return all messages for this user
            messages_qs = DirectMessage.objects.filter(
                Q(sender=user) | Q(recipient=user)
            ).select_related('sender', 'recipient').order_by('-created_at')

        serializer = DirectMessageSerializer(messages_qs, many=True)
        return Response({'results': serializer.data, 'count': messages_qs.count()})

    def post(self, request):
        sender = request.user
        recipient_id = request.data.get('recipient_id')
        subject = (request.data.get('subject') or '').strip()
        body = (request.data.get('body') or '').strip()

        if not body:
            return Response({'detail': 'Message body is required.'}, status=status.HTTP_400_BAD_REQUEST)

        recipient = None
        if recipient_id:
            recipient = User.objects.filter(pk=recipient_id).first()

        if not recipient:
            admin_user = User.objects.filter(
                Q(role='admin') | Q(is_staff=True) | Q(is_superuser=True)
            ).first()
            if not admin_user:
                return Response({'detail': 'No admin user found to receive your message.'}, status=status.HTTP_404_NOT_FOUND)
            recipient = admin_user

        message_obj = DirectMessage.objects.create(
            sender=sender,
            recipient=recipient,
            subject=subject,
            body=body,
        )

        serializer = DirectMessageSerializer(message_obj)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MarkMessagesReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        DirectMessage.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'detail': 'Messages marked as read.'}, status=status.HTTP_200_OK)



