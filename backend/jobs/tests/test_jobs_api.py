import pytest
# pyrefly: ignore [missing-import]
from rest_framework import status
from jobs.models import Job

@pytest.mark.django_db
class TestJobsAPI:

    def test_list_jobs_is_public(self, api_client, sample_job):
        response = api_client.get("/api/jobs/")
        assert response.status_code == status.HTTP_200_OK
        # Check pagination wrapper or direct list
        if isinstance(response.data, dict) and "results" in response.data:
            assert len(response.data["results"]) >= 1
            assert response.data["results"][0]["title"] == sample_job.title
        else:
            assert len(response.data) >= 1
            assert response.data[0]["title"] == sample_job.title

    def test_create_job_requires_company_role(self, auth_company_client):
        data = {
            "title": "React Engineer",
            "description": "Build premium UIs",
            "requirements": "React mastery",
            "location": "Kathmandu",
            "is_remote": False,
            "job_type": "full-time",
            "experience_level": "junior",
            "tech_stack": ["React", "CSS"]
        }
        response = auth_company_client.post("/api/jobs/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["title"] == "React Engineer"

    def test_developer_cannot_create_job(self, auth_dev_client):
        data = {
            "title": "Malicious Post",
            "description": "Build premium UIs",
            "requirements": "React mastery",
            "location": "Kathmandu",
            "is_remote": False,
            "job_type": "full-time",
            "experience_level": "junior",
            "tech_stack": ["React", "CSS"]
        }
        response = auth_dev_client.post("/api/jobs/", data, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_only_owner_can_modify_job(self, auth_company_client, auth_dev_client, sample_job):
        # Developer tries to update company's job (should fail)
        response_dev = auth_dev_client.patch(f"/api/jobs/{sample_job.id}/", {"title": "Hacked Title"}, format="json")
        assert response_dev.status_code == status.HTTP_403_FORBIDDEN

        # Owner company updates job (should succeed)
        response_owner = auth_company_client.patch(f"/api/jobs/{sample_job.id}/", {"title": "Updated Title"}, format="json")
        assert response_owner.status_code == status.HTTP_200_OK
        assert response_owner.data["title"] == "Updated Title"

    def test_company_view_their_own_jobs(self, auth_company_client, sample_job):
        response = auth_company_client.get("/api/jobs/my_jobs/")
        assert response.status_code == status.HTTP_200_OK
        if isinstance(response.data, dict) and "results" in response.data:
            assert len(response.data["results"]) >= 1
        else:
            assert len(response.data) >= 1

    def test_closed_deadline_jobs_excluded_from_find_opportunities(self, api_client, auth_dev_client, auth_company_client, company_user):
        from datetime import timedelta
        from django.utils import timezone

        today = timezone.localdate()
        expired_job = Job.objects.create(
            company=company_user,
            title="Expired Job",
            description="Past deadline",
            requirements="Python",
            location="Kathmandu",
            deadline=today - timedelta(days=1),
            is_active=True,
        )
        open_job = Job.objects.create(
            company=company_user,
            title="Open Job",
            description="Future deadline",
            requirements="Python",
            location="Kathmandu",
            deadline=today + timedelta(days=5),
            is_active=True,
        )
        closing_today_job = Job.objects.create(
            company=company_user,
            title="Closing Today Job",
            description="Deadline today",
            requirements="Python",
            location="Kathmandu",
            deadline=today,
            is_active=True,
        )

        # Public, developer, and company Find Opportunities list should hide expired_job
        for client in (api_client, auth_dev_client, auth_company_client):
            res = client.get("/api/jobs/")
            assert res.status_code == status.HTTP_200_OK
            items = res.data["results"] if isinstance(res.data, dict) and "results" in res.data else res.data
            titles = [item["title"] for item in items]
            assert expired_job.title not in titles
            assert open_job.title in titles
            assert closing_today_job.title in titles

        # Company's own my_jobs dashboard still includes the expired job
        my_jobs_res = auth_company_client.get("/api/jobs/my_jobs/")
        assert my_jobs_res.status_code == status.HTTP_200_OK
        my_items = my_jobs_res.data["results"] if isinstance(my_jobs_res.data, dict) and "results" in my_jobs_res.data else my_jobs_res.data
        my_titles = [item["title"] for item in my_items]
        assert expired_job.title in my_titles
            
    def test_developer_cannot_view_company_own_jobs(self, auth_dev_client, sample_job):
        response = auth_dev_client.get("/api/jobs/my_jobs/")
        assert response.status_code == status.HTTP_403_FORBIDDEN
