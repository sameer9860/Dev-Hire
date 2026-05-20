# pyrefly: ignore [missing-import]
from django.urls import path
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
       path('register/', views.RegisterView.as_view()),
       path('login/', TokenObtainPairView.as_view()),
       path('token/refresh/', TokenRefreshView.as_view()),
       path('me/', views.MeView.as_view()),
   ]