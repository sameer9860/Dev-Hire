"""
Tests for Developer Bio Enhancer feature.
Covers:
  - Unit tests for enhance_developer_bio & fallback generation
  - API tests for POST /api/auth/enhance-bio/
"""

import pytest
from unittest.mock import patch
from rest_framework import status
from accounts.bio_enhancer import enhance_developer_bio, _generate_fallback_bio


class TestBioEnhancerUnit:
    def test_fallback_with_skills_and_headline(self):
        result = _generate_fallback_bio(
            bio="",
            headline="Full-Stack Developer",
            skills=["Python", "React", "PostgreSQL"],
        )
        assert "Full-Stack Developer" in result
        assert "Python" in result
        assert "React" in result

    def test_fallback_with_rough_notes(self):
        result = _generate_fallback_bio(
            bio="built apis and worked on frontend stuff",
            headline="Backend Engineer",
            skills=["Go", "Docker"],
        )
        assert "built apis" in result
        assert "Backend Engineer" in result

    def test_enhance_without_api_key_returns_fallback(self):
        result = enhance_developer_bio(
            bio="did some freelance web development",
            headline="Web Developer",
            skills=["HTML", "CSS", "JavaScript"],
            api_key="",
        )
        assert "enhanced_bio" in result
        assert result["ai_enhanced"] is False
        assert len(result["enhanced_bio"]) > 20

    @patch("google.genai.Client")
    def test_enhance_with_gemini_success(self, mock_client_cls):
        mock_client = mock_client_cls.return_value
        mock_response = mock_client.models.generate_content.return_value
        mock_response.text = '{"enhanced_bio": "Results-driven engineer specializing in modern web platforms."}'

        result = enhance_developer_bio(
            bio="good with react and fast learner",
            headline="React Engineer",
            skills=["React", "TypeScript"],
            api_key="mock-api-key",
        )
        assert result["ai_enhanced"] is True
        assert "Results-driven engineer" in result["enhanced_bio"]


@pytest.mark.django_db
class TestEnhanceBioEndpoint:
    def test_developer_can_enhance_bio(self, auth_dev_client, developer_user):
        developer_user.headline = "Frontend Developer"
        developer_user.skills = ["React", "JavaScript"]
        developer_user.save()

        res = auth_dev_client.post("/api/auth/enhance-bio/", {
            "bio": "i build nice uis and responsive apps",
        })
        assert res.status_code == status.HTTP_200_OK
        assert "enhanced_bio" in res.data
        assert "ai_enhanced" in res.data
        assert len(res.data["enhanced_bio"]) > 20

    def test_company_cannot_enhance_bio(self, auth_company_client):
        res = auth_company_client.post("/api/auth/enhance-bio/", {
            "bio": "some bio",
        })
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_cannot_enhance_bio(self, api_client):
        res = api_client.post("/api/auth/enhance-bio/", {
            "bio": "some bio",
        })
        assert res.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    def test_empty_request_rejected(self, auth_dev_client, developer_user):
        developer_user.headline = ""
        developer_user.skills = []
        developer_user.save()

        res = auth_dev_client.post("/api/auth/enhance-bio/", {
            "bio": "",
            "headline": "",
            "skills": [],
        })
        assert res.status_code == status.HTTP_400_BAD_REQUEST
