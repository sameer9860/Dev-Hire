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

    def test_company_compare_interview_summary_and_draft(
        self, auth_company_client, sample_job, developer_user, django_user_model
    ):
        developer_user.skills = ["Python", "Django"]
        developer_user.projects = [{"title": "DevHire", "description": None}]
        developer_user.experience = [{"title": None, "company": None, "duration": None}]
        developer_user.save()

        dev2 = django_user_model.objects.create_user(
            username="dev_two",
            email="dev2@test.com",
            password="Password123!",
            role="developer",
            skills=["React", "Python"],
        )

        app1 = Application.objects.create(
            developer=developer_user,
            job=sample_job,
            cover_letter="Django dev",
        )
        app2 = Application.objects.create(
            developer=dev2,
            job=sample_job,
            cover_letter="Fullstack dev",
        )

        # 1. Candidate Summary
        summary_res = auth_company_client.post(
            "/api/copilot/candidate-summary/",
            {"application_id": app1.id},
            format="json",
        )
        assert summary_res.status_code == status.HTTP_200_OK
        assert "overall_fit_score" in summary_res.data
        assert isinstance(summary_res.data["strengths"], list)
        assert isinstance(summary_res.data["concerns"], list)
        assert isinstance(summary_res.data["standout_skills"], list)

        # 2. Compare
        compare_res = auth_company_client.post(
            "/api/copilot/compare/",
            {"application_ids": [app1.id, app2.id], "job_id": sample_job.id},
            format="json",
        )
        assert compare_res.status_code == status.HTTP_200_OK
        assert compare_res.data["recommended_candidate"]
        assert len(compare_res.data["candidates"]) == 2
        for cand in compare_res.data["candidates"]:
            assert "overall_score" in cand
            assert isinstance(cand["skills_matched"], list)
            assert isinstance(cand["skills_missing"], list)

        # 3. Interview Prep
        interview_res = auth_company_client.post(
            "/api/copilot/interview-questions/",
            {"application_id": app1.id},
            format="json",
        )
        assert interview_res.status_code == status.HTTP_200_OK
        assert interview_res.data["candidate_name"]
        assert len(interview_res.data["questions"]) >= 1
        assert isinstance(interview_res.data["interview_tips"], list)
        assert interview_res.data["questions"][0]["category"]

        # 4. Draft Message (including 'rejection' and 'offer')
        for msg_type in ("interview_invite", "rejection", "offer"):
            draft_res = auth_company_client.post(
                "/api/copilot/draft-message/",
                {"application_id": app1.id, "message_type": msg_type},
                format="json",
            )
            assert draft_res.status_code == status.HTTP_200_OK
            assert draft_res.data["subject"]
            assert draft_res.data["body"]
            assert draft_res.data["message_type"] == msg_type

