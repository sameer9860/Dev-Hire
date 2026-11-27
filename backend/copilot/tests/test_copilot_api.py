import pytest
from rest_framework import status
from applications.models import Application


@pytest.mark.django_db
class TestCopilotSearchAPI:

    def test_company_smart_search_returns_matched_candidates(
        self, auth_company_client, sample_job, developer_user
    ):
        developer_user.skills = ["React", "TypeScript", "Node.js"]
        developer_user.headline = "Senior React Developer"
        developer_user.save()

        app = Application.objects.create(
            developer=developer_user,
            job=sample_job,
            cover_letter="Experienced with React and TypeScript.",
            resume_url="https://resume.com/dev.pdf",
        )

        # Without job_id
        res = auth_company_client.post(
            "/api/copilot/search/",
            {"query": "React developers with TypeScript experience"},
            format="json",
        )
        assert res.status_code == status.HTTP_200_OK
        assert res.data["total_candidates"] == 1
        assert len(res.data["matched_candidates"]) == 1
        assert len(res.data["results"]) == 1
        candidate = res.data["matched_candidates"][0]
        assert candidate["id"] == app.id
        assert candidate["job_id"] == sample_job.id
        assert candidate["match_score"] > 30
        assert candidate["match_reason"]

        # With job_id filter
        res_filtered = auth_company_client.post(
            "/api/copilot/search/",
            {"query": "React TypeScript", "job_id": sample_job.id},
            format="json",
        )
        assert res_filtered.status_code == status.HTTP_200_OK
        assert len(res_filtered.data["matched_candidates"]) == 1

    def test_developer_cannot_use_copilot_search(self, auth_dev_client):
        res = auth_dev_client.post(
            "/api/copilot/search/",
            {"query": "React"},
            format="json",
        )
        assert res.status_code == status.HTTP_403_FORBIDDEN

