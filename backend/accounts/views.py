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


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


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


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Password updated successfully.'}, status=status.HTTP_200_OK)


class DeleteAccountView(APIView):
    """DELETE /api/auth/delete-account/ — requires password confirmation."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        serializer = DeleteAccountSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.delete()
        return Response({'detail': 'Account deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)


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
    Accepts a multipart file upload and saves it locally.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        # pyrefly: ignore [missing-import]
        from django.core.files.storage import default_storage
        # pyrefly: ignore [missing-import]
        from django.conf import settings
        import uuid
        import os
        
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'detail': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Save file with a unique name to avoid overwrites
        ext = os.path.splitext(uploaded_file.name)[1]
        unique_name = f"{uuid.uuid4()}{ext}"
        file_path = default_storage.save(f'uploads/{unique_name}', uploaded_file)
        
        # Construct public URL
        file_url = request.build_absolute_uri(settings.MEDIA_URL + file_path)
        return Response({'url': file_url}, status=status.HTTP_201_CREATED)

