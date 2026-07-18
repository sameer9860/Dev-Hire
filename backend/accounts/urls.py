# pyrefly: ignore [missing-import]
from django.urls import path
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
       path('register/', views.RegisterView.as_view()),
       path('login/', views.EmailTokenObtainPairView.as_view()),
       path('token/refresh/', TokenRefreshView.as_view()),
       path('me/', views.MeView.as_view()),
       path('check-username/', views.CheckUsernameView.as_view()),
       path('check-email/', views.CheckEmailView.as_view()),
       path('check-company-name/', views.CheckCompanyNameView.as_view()),
       path('check-company-website/', views.CheckCompanyWebsiteView.as_view()),
       path('oauth/config/', views.OAuthConfigView.as_view()),
       path('oauth/<str:provider>/', views.DeveloperOAuthView.as_view()),
       path('change-password/', views.ChangePasswordView.as_view()),
       path('delete-account/', views.DeleteAccountView.as_view()),
       # Day 16 — Profile endpoints
       path('profile/', views.ProfileUpdateView.as_view()),
       path('profile/<str:username>/', views.PublicProfileView.as_view()),
   ]