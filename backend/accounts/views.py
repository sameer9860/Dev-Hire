# pyrefly: ignore [missing-import]
from rest_framework import generics, permissions, status
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.views import TokenObtainPairView
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