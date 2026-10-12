"""
Tests for the AI Match Score feature.
Covers:
  - Local scoring engine (match_score.py unit tests)
  - GET /api/jobs/jobs/{id}/match/ endpoint
  - GET /api/jobs/jobs/{id}/applicants-ranked/ endpoint
"""

import pytest
from unittest.mock import patch, MagicMock
# pyrefly: ignore [missing-import]
from rest_framework import status
from jobs.models import Job
from jobs.match_score import (
    _normalize,
    _local_match,
    compute_match,
    MatchResult,
    _cache_key,
)
from django.core.cache import cache


# ──────────────────────────────────────────────────────────────────────────────
# Unit Tests: _normalize & _local_match
# ──────────────────────────────────────────────────────────────────────────────

class TestNormalize:
    def test_lowercases(self):
        assert _normalize("React") == "react"

    def test_strips_dots(self):
        assert _normalize("Node.js") == "nodejs"

    def test_strips_hyphens(self):
        assert _normalize("TypeScript") == "typescript"

    def test_strips_spaces(self):
        assert _normalize("Mongo DB") == "mongodb"


class TestLocalMatch:
    def test_perfect_match(self):
        result = _local_match(["Python", "React", "Django"], ["Python", "React", "Django"])
        assert result["score"] == 100
        assert set(result["matching"]) == {"Python", "React", "Django"}
        assert result["missing"] == []

    def test_partial_match(self):
        result = _local_match(["Python", "React"], ["Python", "React", "Django"])
        assert result["score"] == pytest.approx(67, abs=1)
        assert "Django" in result["missing"]

    def test_no_match(self):
        result = _local_match(["Java", "Spring"], ["Python", "React", "Django"])
        assert result["score"] == 0
        assert len(result["missing"]) == 3

    def test_empty_job_skills_returns_100(self):
        result = _local_match(["Python"], [])
        assert result["score"] == 100

    def test_empty_dev_skills(self):
        result = _local_match([], ["Python", "React"])
        assert result["score"] == 0
        assert set(result["missing"]) == {"Python", "React"}

    def test_bonus_skills(self):
        result = _local_match(["Python", "React", "Docker"], ["Python"])
        assert "React" in result["bonus"] or "Docker" in result["bonus"]


# ──────────────────────────────────────────────────────────────────────────────
# Unit Tests: compute_match (no AI)
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestComputeMatch:
    def test_local_match_no_ai(self, developer_user, sample_job):
        """compute_match falls back gracefully when AI is disabled."""
        # sample_job has tech_stack=["Python","Django","PostgreSQL","Docker","Redis"]
        developer_user.skills = ["Python", "Django"]
        developer_user.save()

        result = compute_match(developer_user, sample_job, use_ai=False)

        assert isinstance(result, MatchResult)
        assert 0 <= result.score <= 100
        assert "Python" in result.matching_skills
        assert "Django" in result.matching_skills
        assert result.ai_enhanced is False

    def test_result_is_cached(self, developer_user, sample_job):
        """Second call returns cached result, not recomputed."""
        cache.clear()
        developer_user.skills = ["Python"]
        developer_user.save()

        result1 = compute_match(developer_user, sample_job, use_ai=False)
        result2 = compute_match(developer_user, sample_job, use_ai=False)

        assert result1.score == result2.score

    def test_label_excellent(self, developer_user, sample_job):
        sample_job.tech_stack = ["Python"]
        sample_job.save()
        developer_user.skills = ["Python"]
        developer_user.save()
        cache.clear()

        result = compute_match(developer_user, sample_job, use_ai=False)
        assert result.label == "Excellent"
        assert result.score == 100

    def test_label_low(self, developer_user, sample_job):
        sample_job.tech_stack = ["Java", "Kotlin", "Spring", "Android"]
        sample_job.save()
        developer_user.skills = ["Python"]
        developer_user.save()
        cache.clear()

        result = compute_match(developer_user, sample_job, use_ai=False)
        assert result.label == "Low"
        assert result.score == 0

    @patch("jobs.match_score._ai_match")
    def test_ai_result_used_when_available(self, mock_ai, developer_user, sample_job):
        """When AI returns a result, it overrides local scoring."""
        cache.clear()
        mock_ai.return_value = {
            "score": 88,
            "matching": ["Python", "Django"],
            "missing": ["Redis"],
            "bonus": ["Docker"],
        }
        developer_user.skills = ["Python", "Django", "Docker"]
        developer_user.save()

        with patch("jobs.match_score.getattr", return_value="fake-api-key", create=True):
            with patch("django.conf.settings") as mock_settings:
                mock_settings.GEMINI_API_KEY = "fake-key"
                result = compute_match(developer_user, sample_job, use_ai=True)

        assert result.ai_enhanced is True
        assert result.score == 88

    def test_to_dict_keys(self, developer_user, sample_job):
        cache.clear()
        developer_user.skills = ["Python"]
        developer_user.save()

        result = compute_match(developer_user, sample_job, use_ai=False)
        d = result.to_dict()

        assert set(d.keys()) == {
            "score", "label", "matching_skills",
            "missing_skills", "bonus_skills", "ai_enhanced"
        }


# ──────────────────────────────────────────────────────────────────────────────
# API Tests: GET /api/jobs/jobs/{id}/match/
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestMatchEndpoint:
    def test_developer_gets_match_score(self, auth_dev_client, developer_user, sample_job):
        cache.clear()
        developer_user.skills = ["Python", "Django"]
        developer_user.save()

        res = auth_dev_client.get(f"/api/jobs/{sample_job.id}/match/")
        assert res.status_code == status.HTTP_200_OK
        assert "score" in res.data
        assert "matching_skills" in res.data
        assert "missing_skills" in res.data
        assert "bonus_skills" in res.data
        assert "label" in res.data
        assert "ai_enhanced" in res.data
        assert 0 <= res.data["score"] <= 100

    def test_company_cannot_get_match(self, auth_company_client, sample_job):
        res = auth_company_client.get(f"/api/jobs/{sample_job.id}/match/")
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_denied(self, api_client, sample_job):
        res = api_client.get(f"/api/jobs/{sample_job.id}/match/")
        assert res.status_code in (
            status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN
        )

    def test_match_score_range(self, auth_dev_client, developer_user, sample_job):
        """Score must always be 0–100."""
        cache.clear()
        developer_user.skills = []
        developer_user.save()

        res = auth_dev_client.get(f"/api/jobs/{sample_job.id}/match/")
        assert res.status_code == status.HTTP_200_OK
        assert 0 <= res.data["score"] <= 100


# ──────────────────────────────────────────────────────────────────────────────
# API Tests: GET /api/jobs/jobs/{id}/applicants-ranked/
# ──────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestApplicantsRankedEndpoint:
    @pytest.fixture
    def job_with_applicants(self, company_user, developer_user, db):
        from django.contrib.auth import get_user_model
        from applications.models import Application

        User = get_user_model()
        job = Job.objects.create(
            company=company_user,
            title="Python Dev",
            description="Backend role",
            requirements="Python, Django",
            location="Remote",
            tech_stack=["Python", "Django", "Docker"],
        )
        # Dev 1: good match
        developer_user.skills = ["Python", "Django", "Docker"]
        developer_user.save()
        Application.objects.create(developer=developer_user, job=job)

        # Dev 2: poor match
        dev2 = User.objects.create_user(
            username="dev2", email="dev2@test.com",
            password="pass", role="developer",
            skills=["Java", "Spring"],
        )
        Application.objects.create(developer=dev2, job=job)

        return job

    def test_company_gets_ranked_applicants(self, auth_company_client, job_with_applicants):
        cache.clear()
        res = auth_company_client.get(
            f"/api/jobs/{job_with_applicants.id}/applicants-ranked/"
        )
        assert res.status_code == status.HTTP_200_OK
        applicants = res.data["applicants"]
        assert len(applicants) == 2
        # First applicant should have higher or equal score
        assert applicants[0]["match"]["score"] >= applicants[1]["match"]["score"]

    def test_response_has_required_fields(self, auth_company_client, job_with_applicants):
        cache.clear()
        res = auth_company_client.get(
            f"/api/jobs/{job_with_applicants.id}/applicants-ranked/"
        )
        assert res.status_code == status.HTTP_200_OK
        assert "job_id" in res.data
        assert "job_title" in res.data
        assert "applicants" in res.data

        first = res.data["applicants"][0]
        assert "application_id" in first
        assert "status" in first
        assert "developer" in first
        assert "match" in first

    def test_developer_cannot_view_ranked_applicants(self, auth_dev_client, job_with_applicants):
        res = auth_dev_client.get(
            f"/api/jobs/{job_with_applicants.id}/applicants-ranked/"
        )
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_other_company_cannot_view(self, job_with_applicants, db):
        from django.contrib.auth import get_user_model
        from rest_framework.test import APIClient

        User = get_user_model()
        other_company = User.objects.create_user(
            username="other_co", email="other@co.com",
            password="pass", role="company", company_name="Other Corp",
        )
        client = APIClient()
        client.force_authenticate(user=other_company)

        res = client.get(
            f"/api/jobs/{job_with_applicants.id}/applicants-ranked/"
        )
        assert res.status_code == status.HTTP_403_FORBIDDEN
