# pyrefly: ignore [missing-import]
from rest_framework import generics, permissions
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.views import TokenObtainPairView
# pyrefly: ignore [missing-import]
from .serializers import RegisterSerializer, UserSerializer
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model

User = get_user_model()

class RegisterView(generics.CreateAPIView):
       queryset = User.objects.all()
       serializer_class = RegisterSerializer
       permission_classes = [permissions.AllowAny]

class MeView(generics.RetrieveUpdateAPIView):
       serializer_class = UserSerializer
       permission_classes = [permissions.IsAuthenticated]

       def get_object(self):
           return self.request.user