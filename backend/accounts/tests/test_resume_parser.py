import io
import json
from unittest.mock import MagicMock, patch
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from accounts.resume_parser import (
    extract_text_from_pdf,
    normalize_parsed_resume,
    parse_resume_with_gemini,
)
from pypdf import PdfWriter


def create_sample_pdf(text="John Doe\nSoftware Engineer\nSkills: Python, Django, React\nEducation: MIT"):
    writer = PdfWriter()
    # Add a page with blank text or use pypdf / bytes
    # Instead of raw canvas which requires reportlab, we can create a valid minimal PDF
    # or write a stream
    writer.add_blank_page(width=72, height=72)
    # To embed text without reportlab, we can write a minimal PDF object or mock PdfReader text extraction
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


@pytest.mark.django_db
class TestResumeParserUnit:
    def test_normalize_parsed_resume(self):
        raw = {
            "first_name": "Samir",
            "last_name": "Khatiwada",
            "headline": "Full-Stack Dev",
            "bio": "Passionate developer",
            "location": "Kathmandu, Nepal",
            "address": "Baneshwor, Kathmandu",
            "linkedin_url": "https://linkedin.com/in/samirkhatiwada",
            "github_url": "https://github.com/sameer9860",
            "skills": ["Python", "python", "React", "Docker", ""],
            "education": [
                {
                    "institution": "Tribhuvan University",
                    "degree": "BSc CSIT",
                    "field": "Computer Science",
                    "start_year": "2019",
                    "end_year": "2023",
                }
            ],
            "experience": [
                {
                    "company": "Tech Corp",
                    "role": "Backend Engineer",
                    "start_date": "2023-01",
                    "end_date": "",
                    "description": "Built APIs",
                    "current": True,
                }
            ],
            "projects": [
                {
                    "title": "DevHire",
                    "description": "Tech recruitment portal",
                    "technologies": ["Next.js", "Django"],
                    "url": "https://github.com/example/devhire",
                }
            ],
            "languages": ["English", "Nepali"],
        }
        res = normalize_parsed_resume(raw)
        assert res["first_name"] == "Samir"
        assert res["last_name"] == "Khatiwada"
        assert res["headline"] == "Full-Stack Dev"
        assert res["bio"] == "Passionate developer"
        assert res["address"] == "Baneshwor, Kathmandu"
        assert res["linkedin_url"] == "https://linkedin.com/in/samirkhatiwada"
        assert any(
            link["platform"] == "linkedin" and link["url"] == "https://linkedin.com/in/samirkhatiwada"
            for link in res["social_links"]
        )
        # Skills deduplicated case-insensitively
        assert res["skills"] == ["Python", "React", "Docker"]
        assert len(res["education"]) == 1
        assert res["education"][0]["degree"] == "BSc CSIT"
        assert len(res["experience"]) == 1
        assert res["experience"][0]["current"] is True
        assert len(res["projects"]) == 1
        assert res["projects"][0]["technologies"] == ["Next.js", "Django"]
        assert res["languages"] == ["English", "Nepali"]

    def test_extract_text_empty_pdf(self):
        pdf_bytes = create_sample_pdf()
        text = extract_text_from_pdf(pdf_bytes)
        # Blank page produces empty string or minimal
        assert isinstance(text, str)

    def test_parse_resume_missing_api_key(self, settings):
        settings.GEMINI_API_KEY = ""
        with pytest.raises(ValueError, match="GEMINI_API_KEY is not configured"):
            parse_resume_with_gemini("Some resume text with enough characters to pass length check")

    def test_parse_resume_insufficient_text(self, settings):
        settings.GEMINI_API_KEY = "dummy-key"
        with pytest.raises(ValueError, match="Resume contains insufficient readable text"):
            parse_resume_with_gemini("Too short")


@pytest.mark.django_db
class TestResumeParserAPI:
    def test_unauthenticated_request(self, client):
        dummy_pdf = SimpleUploadedFile("resume.pdf", b"%PDF-1.4 sample", content_type="application/pdf")
        res = client.post("/api/auth/resume/parse/", {"file": dummy_pdf}, format="multipart")
        assert res.status_code == 401

    def test_company_user_forbidden(self, auth_company_client):
        dummy_pdf = SimpleUploadedFile("resume.pdf", b"%PDF-1.4 sample", content_type="application/pdf")
        res = auth_company_client.post("/api/auth/resume/parse/", {"file": dummy_pdf}, format="multipart")
        assert res.status_code == 403
        assert "Only developer accounts" in res.data["detail"]

    def test_missing_file(self, auth_dev_client):
        res = auth_dev_client.post("/api/auth/resume/parse/", {}, format="multipart")
        assert res.status_code == 400
        assert "No file uploaded" in res.data["detail"]

    def test_non_pdf_file_rejected(self, auth_dev_client):
        dummy_txt = SimpleUploadedFile("resume.txt", b"plain text", content_type="text/plain")
        res = auth_dev_client.post("/api/auth/resume/parse/", {"file": dummy_txt}, format="multipart")
        assert res.status_code == 400
        assert "Only PDF files are currently supported" in res.data["detail"]

    def test_missing_gemini_api_key_returns_503(self, auth_dev_client, settings):
        settings.GEMINI_API_KEY = ""
        dummy_pdf = SimpleUploadedFile("resume.pdf", b"%PDF-1.4 sample content", content_type="application/pdf")
        res = auth_dev_client.post("/api/auth/resume/parse/", {"file": dummy_pdf}, format="multipart")
        assert res.status_code == 503
        assert "AI API key is not configured" in res.data["detail"]

    @patch("accounts.storage.save_file_to_supabase_or_local")
    @patch("accounts.resume_parser.extract_text_from_pdf")
    @patch("accounts.resume_parser.parse_resume_with_gemini")
    def test_successful_resume_parse(
        self,
        mock_parse,
        mock_extract,
        mock_save,
        auth_dev_client,
        settings,
    ):
        settings.GEMINI_API_KEY = "test-gemini-key"
        mock_save.return_value = "https://example.com/uploads/resumes/resume.pdf"
        mock_extract.return_value = "Samir Khatiwada\nFull Stack Developer\nSkills: Python, React, PostgreSQL"
        mock_parse.return_value = {
            "first_name": "Samir",
            "last_name": "Khatiwada",
            "headline": "Full-Stack Developer | Python & React",
            "bio": "Experienced builder with strong Django and Next.js skills.",
            "phone_number": "+977 9800000000",
            "location": "Kathmandu, Nepal",
            "address": "Baneshwor, Kathmandu",
            "github_url": "https://github.com/sameer9860",
            "portfolio_url": "",
            "linkedin_url": "https://linkedin.com/in/samirkhatiwada",
            "social_links": [
                {"platform": "github", "url": "https://github.com/sameer9860"},
                {"platform": "linkedin", "url": "https://linkedin.com/in/samirkhatiwada"},
            ],
            "skills": ["Python", "Django", "React", "PostgreSQL"],
            "education": [
                {
                    "institution": "Tribhuvan University",
                    "degree": "BSc CSIT",
                    "field": "Computer Science",
                    "start_year": "2020",
                    "end_year": "2024",
                }
            ],
            "experience": [
                {
                    "company": "DevHire Inc",
                    "role": "Software Engineer",
                    "start_date": "2024-01",
                    "end_date": "",
                    "description": "Architected recruitment platform",
                    "current": True,
                }
            ],
            "projects": [],
            "achievements": [],
            "training": [],
            "languages": ["English", "Nepali"],
        }

        dummy_pdf = SimpleUploadedFile("resume.pdf", b"%PDF-1.4 dummy valid pdf", content_type="application/pdf")
        res = auth_dev_client.post("/api/auth/resume/parse/", {"file": dummy_pdf}, format="multipart")

        assert res.status_code == 200
        assert res.data["resume_url"] == "https://example.com/uploads/resumes/resume.pdf"
        assert res.data["parsed_data"]["first_name"] == "Samir"
        assert res.data["parsed_data"]["last_name"] == "Khatiwada"
        assert res.data["parsed_data"]["address"] == "Baneshwor, Kathmandu"
        assert res.data["parsed_data"]["linkedin_url"] == "https://linkedin.com/in/samirkhatiwada"
        assert res.data["parsed_data"]["headline"] == "Full-Stack Developer | Python & React"
        assert "PostgreSQL" in res.data["parsed_data"]["skills"]
        assert len(res.data["parsed_data"]["education"]) == 1
        assert len(res.data["parsed_data"]["experience"]) == 1
