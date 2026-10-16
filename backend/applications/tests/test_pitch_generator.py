"""
Tests for AI Application Pitch / Cover Note Generator feature.
Covers:
  - Unit tests for generate_application_pitch & fallback generation
  - API tests for POST /api/applications/generate-pitch/
"""

import pytest
from unittest.mock import patch
from rest_framework import status
from applications.pitch_generator import (
    generate_application_pitch,
    _generate_fallback_pitch,
)


class TestPitchGeneratorUnit:
    def test_fallback_with_matching_skills_and_project(self):
        user_profile = {
            "first_name": "Samir",
            "headline": "Full-Stack Engineer",
            "skills": ["React", "Django", "PostgreSQL", "Docker"],
            "projects": [
                {
                    "title": "DevHire Platform",
                    "description": "Built job matching platform using React and Django REST framework.",
                }
            ],
        }
        job_data = {
            "title": "Senior Python Developer",
            "company_name": "TechCorp",
            "tech_stack": ["Django", "PostgreSQL", "AWS"],
        }
        result = _generate_fallback_pitch(user_profile, job_data)
        assert "Senior Python Developer" in result
        assert "TechCorp" in result
        assert "Django" in result
        assert "DevHire Platform" in result
        # Check it has 2 paragraphs
        paragraphs = [p for p in result.split("\n\n") if p.strip()]
        assert len(paragraphs) == 2

    def test_fallback_without_projects(self):
        user_profile = {
            "first_name": "Alex",
            "headline": "Frontend Developer",
            "skills": ["TypeScript", "Next.js"],
            "projects": [],
        }
        job_data = {
            "title": "Frontend Engineer",
            "company_name": "Acme Inc",
            "tech_stack": ["Next.js", "TailwindCSS"],
        }
        result = _generate_fallback_pitch(user_profile, job_data)
        assert "Frontend Engineer" in result
        assert "Acme Inc" in result
        assert "TypeScript" in result or "Next.js" in result
        paragraphs = [p for p in result.split("\n\n") if p.strip()]
        assert len(paragraphs) == 2

    def test_generate_without_api_key_returns_fallback(self):
        user_profile = {
            "name": "Jordan",
            "headline": "DevOps Engineer",
            "skills": ["Kubernetes", "Terraform"],
        }
        job_data = {
            "title": "Cloud Engineer",
            "company_name": "CloudWorks",
        }
        result = generate_application_pitch(user_profile, job_data, api_key="")
        assert "cover_letter" in result
        assert result["ai_enhanced"] is False
        assert len(result["cover_letter"]) > 100

    @patch("google.genai.Client")
    def test_generate_with_gemini_success(self, mock_client_cls):
        mock_client = mock_client_cls.return_value
        mock_response = mock_client.models.generate_content.return_value
        mock_response.text = (
            '{"cover_letter": "I am thrilled to apply for the Backend Engineer position at Acme.\\n\\n'
            'My experience in building resilient APIs matches your requirements directly."}'
        )

        user_profile = {
            "name": "Taylor",
            "headline": "Backend Engineer",
            "skills": ["Python", "FastAPI"],
            "projects": [{"title": "API Gateway", "description": "High-throughput proxy"}],
        }
        job_data = {
            "title": "Backend Engineer",
            "company_name": "Acme",
            "tech_stack": ["Python", "FastAPI"],
        }

        result = generate_application_pitch(user_profile, job_data, api_key="test-api-key")
        assert result["ai_enhanced"] is True
        assert "thrilled to apply" in result["cover_letter"]


@pytest.mark.django_db
class TestGeneratePitchEndpoint:
    def test_developer_can_generate_pitch_with_job_id(self, auth_dev_client, sample_job):
        response = auth_dev_client.post(
            "/api/applications/generate-pitch/",
            {"job_id": sample_job.id},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "cover_letter" in data
        assert sample_job.title in data["cover_letter"]
        assert len(data["cover_letter"]) > 50

    def test_developer_can_generate_pitch_with_custom_job(self, auth_dev_client):
        response = auth_dev_client.post(
            "/api/applications/generate-pitch/",
            {
                "job_title": "React Native Developer",
                "company_name": "MobileFirst",
                "tech_stack": ["React Native", "TypeScript"],
            },
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "cover_letter" in data
        assert "React Native Developer" in data["cover_letter"]
        assert "MobileFirst" in data["cover_letter"]

    def test_company_cannot_generate_pitch(self, auth_company_client, sample_job):
        response = auth_company_client.post(
            "/api/applications/generate-pitch/",
            {"job_id": sample_job.id},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_cannot_generate_pitch(self, client, sample_job):
        response = client.post(
            "/api/applications/generate-pitch/",
            {"job_id": sample_job.id},
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_missing_job_info_rejected(self, auth_dev_client):
        response = auth_dev_client.post(
            "/api/applications/generate-pitch/",
            {},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_nonexistent_job_id_returns_404(self, auth_dev_client):
        response = auth_dev_client.post(
            "/api/applications/generate-pitch/",
            {"job_id": 999999},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
