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
       path('change-email/request/', views.ChangeEmailRequestView.as_view()),
       path('change-email/verify-otp/', views.ChangeEmailVerifyOTPView.as_view()),
       path('change-email/confirm/', views.ChangeEmailConfirmView.as_view()),
       path('change-password/', views.ChangePasswordView.as_view()),
    path('password-reset/', views.PasswordResetRequestView.as_view()),
    path('password-reset-verify-otp/', views.PasswordResetVerifyOTPView.as_view()),
    path('password-reset-confirm/', views.PasswordResetConfirmView.as_view()),
       path('delete-account/', views.DeleteAccountView.as_view()),
       # Day 16 — Profile endpoints
       path('profile/', views.ProfileUpdateView.as_view()),
       path('profile/<str:username>/', views.PublicProfileView.as_view()),
       path('upload/', views.FileUploadView.as_view()),
       path('company-photos/', views.CompanyPhotoUploadView.as_view()),
       path('activity/', views.ActivityLogListView.as_view()),
       path('activity/read-all/', views.MarkActivityReadView.as_view()),
   ]
