import pytest
from django.core import mail
from django.contrib.auth import get_user_model
from rest_framework import status

User = get_user_model()


@pytest.mark.django_db
class TestChangeEmailFlow:
    def test_change_email_otp_workflow(self, auth_dev_client, developer_user):
        new_email = "newjohn@dev.com"

        request_response = auth_dev_client.post(
            "/api/auth/change-email/request/",
            {"new_email": new_email},
            format="json",
        )

        assert request_response.status_code == status.HTTP_200_OK
        assert "verification code" in request_response.data["detail"].lower()
        assert len(mail.outbox) >= 1

        otp = "123456"
        cache_key = f"change_email_otp:{developer_user.pk}:{new_email.lower()}"
        from django.core.cache import cache
        cached = cache.get(cache_key)
        if cached and isinstance(cached, dict):
            otp = str(cached.get("otp", "123456"))

        verify_response = auth_dev_client.post(
            "/api/auth/change-email/verify-otp/",
            {"new_email": new_email, "otp": otp},
            format="json",
        )

        assert verify_response.status_code == status.HTTP_200_OK
        assert "verified" in verify_response.data["detail"].lower()

        confirm_response = auth_dev_client.post(
            "/api/auth/change-email/confirm/",
            {"new_email": new_email, "verification_token": verify_response.data["verification_token"]},
            format="json",
        )

        assert confirm_response.status_code == status.HTTP_200_OK
        developer_user.refresh_from_db()
        assert developer_user.email == new_email

    def test_company_role_enforces_company_email_for_change(self, auth_company_client, company_user):
        response = auth_company_client.post(
            "/api/auth/change-email/request/",
            {"new_email": "recruiter@gmail.com"},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "company email" in str(response.data).lower()
