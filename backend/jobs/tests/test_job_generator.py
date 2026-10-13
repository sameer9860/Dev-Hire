"""
Tests for AI Job Post Assistant feature.
Covers:
  - Unit tests for generate_job_post & fallback generation
  - API tests for POST /api/jobs/jobs/generate-post/
"""

import pytest
from unittest.mock import patch
from rest_framework import status
from jobs.job_generator import generate_job_post, _generate_fallback_job


class TestJobGeneratorUnit:
    def test_fallback_generates_required_fields(self):
        result = _generate_fallback_job(
            title="Senior React Developer",
            experience_level="senior",
            job_type="full-time",
            location="Remote",
            company_name="DevHire Tech",
        )
        assert "description" in result
        assert "requirements" in result
        assert "tech_stack" in result
        assert len(result["tech_stack"]) >= 4
        assert "React" in result["tech_stack"]
        assert result["ai_enhanced"] is False

    def test_missing_title_raises_value_error(self):
        with pytest.raises(ValueError):
            generate_job_post(title="")

    @patch("google.genai.Client")
    def test_generate_with_gemini_success(self, mock_client_cls):
        mock_client = mock_client_cls.return_value
        mock_response = mock_client.models.generate_content.return_value
        mock_response.text = (
            '{"description": "We are seeking a senior engineer to drive our next phase of growth.", '
            '"requirements": "- 5+ years experience\\n- Strong React skills", '
            '"tech_stack": ["React", "TypeScript", "Next.js", "Redux"]}'
        )

        result = generate_job_post(
            title="Senior Frontend Engineer",
            api_key="mock-key",
        )
        assert result["ai_enhanced"] is True
        assert "senior engineer" in result["description"]
        assert "React" in result["tech_stack"]


@pytest.mark.django_db
class TestGenerateJobPostEndpoint:
    def test_company_can_generate_job_post(self, auth_company_client):
        res = auth_company_client.post("/api/jobs/generate-post/", {
            "title": "Senior Python Backend Engineer",
            "experience_level": "senior",
            "job_type": "full-time",
            "location": "Remote",
        })
        assert res.status_code == status.HTTP_200_OK
        assert "description" in res.data
        assert "requirements" in res.data
        assert "tech_stack" in res.data
        assert isinstance(res.data["tech_stack"], list)
        assert len(res.data["tech_stack"]) > 0

    def test_developer_cannot_generate_job_post(self, auth_dev_client):
        res = auth_dev_client.post("/api/jobs/generate-post/", {
            "title": "Senior Python Engineer",
        })
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_cannot_generate(self, api_client):
        res = api_client.post("/api/jobs/generate-post/", {
            "title": "Senior Python Engineer",
        })
        assert res.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    def test_missing_title_rejected(self, auth_company_client):
        res = auth_company_client.post("/api/jobs/generate-post/", {
            "title": "   ",
        })
        assert res.status_code == status.HTTP_400_BAD_REQUEST
