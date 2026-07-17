import pytest
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model
# pyrefly: ignore [missing-import]
from rest_framework import status

User = get_user_model()

@pytest.mark.django_db
class TestAuthenticationAPI:
    
    def test_register_developer(self, api_client):
        data = {
            "username": "new_dev",
            "email": "dev@test.com",
            "password": "password123",
            "password2": "password123",
            "role": "developer"
        }
        response = api_client.post("/api/auth/register/", data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["username"] == "new_dev"
        assert response.data["role"] == "developer"

    def test_register_company(self, api_client):
        data = {
            "username": "new_co",
            "email": "co@test.com",
            "password": "password123",
            "password2": "password123",
            "role": "company",
            "company_name": "Test Company Inc",
            "company_website": "https://testcompany.com"
        }
        response = api_client.post("/api/auth/register/", data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["username"] == "new_co"
        assert response.data["role"] == "company"

    def test_register_passwords_dont_match(self, api_client):
        data = {
            "username": "mismatch_dev",
            "email": "mismatch@test.com",
            "password": "password123",
            "password2": "different123",
            "role": "developer"
        }
        response = api_client.post("/api/auth/register/", data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "non_field_errors" in response.data or "password" in response.data or "detail" in response.data or any("Passwords don't match" in str(v) for v in response.data.values())

    def test_login_returns_jwt_tokens(self, api_client, developer_user):
        data = {
            "username": "dev_john",
            "password": "securepass123"
        }
        response = api_client.post("/api/auth/login/", data)
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data

    def test_login_accepts_email(self, api_client, developer_user):
        data = {
            "email": developer_user.email,
            "password": "securepass123"
        }
        response = api_client.post("/api/auth/login/", data)
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data

    def test_get_current_user_profile(self, auth_dev_client, developer_user):
        response = auth_dev_client.get("/api/auth/me/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["username"] == developer_user.username

    def test_update_profile_based_on_role(self, auth_dev_client, auth_company_client):
        # Developer updating skills (allowed)
        dev_response = auth_dev_client.patch("/api/auth/profile/", {"skills": ["Django", "Docker"]}, format="json")
        assert dev_response.status_code == status.HTTP_200_OK
        assert "Django" in dev_response.data["skills"]

        # Company updating company website (allowed)
        co_response = auth_company_client.patch("/api/auth/profile/", {"company_website": "https://careers.google.com"}, format="json")
        assert co_response.status_code == status.HTTP_200_OK
        assert co_response.data["company_website"] == "https://careers.google.com"

    def test_public_profile_view(self, api_client, developer_user):
        response = api_client.get(f"/api/auth/profile/{developer_user.username}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["username"] == developer_user.username

    def test_change_password(self, auth_dev_client, developer_user):
        response = auth_dev_client.post("/api/auth/change-password/", {
            "current_password": "securepass123",
            "new_password": "newsecurepass456",
            "new_password2": "newsecurepass456",
        }, format="json")
        assert response.status_code == status.HTTP_200_OK
        developer_user.refresh_from_db()
        assert developer_user.check_password("newsecurepass456")

    def test_change_password_wrong_current(self, auth_dev_client):
        response = auth_dev_client.post("/api/auth/change-password/", {
            "current_password": "wrongpassword",
            "new_password": "newsecurepass456",
            "new_password2": "newsecurepass456",
        }, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_delete_account_requires_password(self, auth_dev_client, developer_user):
        response = auth_dev_client.delete("/api/auth/delete-account/", {
            "password": "wrongpassword",
        }, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert User.objects.filter(pk=developer_user.pk).exists()

    def test_delete_account_success(self, auth_dev_client, developer_user):
        user_id = developer_user.pk
        response = auth_dev_client.delete("/api/auth/delete-account/", {
            "password": "securepass123",
        }, format="json")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not User.objects.filter(pk=user_id).exists()
