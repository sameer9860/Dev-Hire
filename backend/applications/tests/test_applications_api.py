import pytest
# pyrefly: ignore [missing-import]
from rest_framework import status
from applications.models import Application

@pytest.mark.django_db
class TestApplicationsAPI:

    def test_developer_can_apply_to_job(self, auth_dev_client, sample_job):
        data = {
            "job": sample_job.id,
            "cover_letter": "I love Django, let me join!",
            "resume_url": "https://resume.com/john.pdf"
        }
        response = auth_dev_client.post("/api/applications/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["status"] == "pending"

    def test_prevent_duplicate_applications(self, auth_dev_client, sample_job):
        data = {
            "job": sample_job.id,
            "cover_letter": "First apply",
            "resume_url": "https://resume.com/john.pdf"
        }
        # First submission
        res1 = auth_dev_client.post("/api/applications/", data, format="json")
        assert res1.status_code == status.HTTP_201_CREATED

        # Second submission (should fail due to unique constraint)
        res2 = auth_dev_client.post("/api/applications/", data, format="json")
        assert res2.status_code == status.HTTP_400_BAD_REQUEST

    def test_role_based_applications_query(self, auth_dev_client, auth_company_client, sample_job, developer_user):
        # Create an application
        Application.objects.create(
            developer=developer_user,
            job=sample_job,
            cover_letter="Apply text",
            resume_url="https://resume.com"
        )
        
        # Developer retrieves applications (sees their own)
        dev_res = auth_dev_client.get("/api/applications/")
        assert dev_res.status_code == status.HTTP_200_OK
        # Check pagination wrapper or direct list
        if isinstance(dev_res.data, dict) and "results" in dev_res.data:
            assert len(dev_res.data["results"]) >= 1
        else:
            assert len(dev_res.data) >= 1

        # Company retrieves applications (sees applications sent to their jobs)
        co_res = auth_company_client.get("/api/applications/")
        assert co_res.status_code == status.HTTP_200_OK
        if isinstance(co_res.data, dict) and "results" in co_res.data:
            assert len(co_res.data["results"]) >= 1
        else:
            assert len(co_res.data) >= 1

    def test_company_can_update_application_status(self, auth_company_client, auth_dev_client, sample_job, developer_user):
        app = Application.objects.create(
            developer=developer_user,
            job=sample_job,
            status="pending"
        )

        # Developer tries to update status (should fail)
        dev_res = auth_dev_client.patch(f"/api/applications/{app.id}/status/", {"status": "accepted"}, format="json")
        assert dev_res.status_code == status.HTTP_403_FORBIDDEN

        # Job Owner Company updates status to reviewing (should succeed)
        co_res = auth_company_client.patch(f"/api/applications/{app.id}/status/", {"status": "reviewing"}, format="json")
        assert co_res.status_code == status.HTTP_200_OK
        assert co_res.data["status"] == "reviewing"
