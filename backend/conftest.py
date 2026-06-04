"""
Global test fixtures for DevHire backend.
Provides reusable users, authenticated API clients, and sample data objects.
"""
import pytest
# pyrefly: ignore [missing-import]
from rest_framework.test import APIClient
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model
from jobs.models import Job
from applications.models import Application

User = get_user_model()


# ── Users ──────────────────────────────────────────────────────────────────────

@pytest.fixture
def api_client():
    """Unauthenticated DRF test client."""
    return APIClient()


@pytest.fixture
def developer_user(db):
    """A developer account with basic profile info."""
    return User.objects.create_user(
        username="dev_john",
        email="john@dev.com",
        password="securepass123",
        role="developer",
        bio="Full-Stack Dev",
        skills=["Python", "React"],
    )


@pytest.fixture
def company_user(db):
    """A company account with org details."""
    return User.objects.create_user(
        username="google_recruiter",
        email="recruiter@google.com",
        password="securepass123",
        role="company",
        company_name="Google",
        company_website="https://google.com",
    )


# ── Authenticated Clients ─────────────────────────────────────────────────────

@pytest.fixture
def auth_dev_client(developer_user):
    """API client authenticated as a developer."""
    client = APIClient()
    client.force_authenticate(user=developer_user)
    return client


@pytest.fixture
def auth_company_client(company_user):
    """API client authenticated as a company."""
    client = APIClient()
    client.force_authenticate(user=company_user)
    return client


# ── Sample Data ────────────────────────────────────────────────────────────────

@pytest.fixture
def sample_job(db, company_user):
    """A fully-populated active job listing owned by company_user."""
    return Job.objects.create(
        company=company_user,
        title="Software Engineer (Python)",
        description="Write Django APIs for production systems.",
        requirements="2+ years experience in Python and Django.",
        location="Remote",
        is_remote=True,
        job_type="full-time",
        experience_level="mid",
        tech_stack=["Python", "Django", "PostgreSQL"],
        salary_min=100000,
        salary_max=130000,
    )


@pytest.fixture
def second_job(db, company_user):
    """A second job listing for multi-job tests."""
    return Job.objects.create(
        company=company_user,
        title="Frontend Engineer (React)",
        description="Build premium React UIs.",
        requirements="Experience with React and TypeScript.",
        location="Kathmandu",
        is_remote=False,
        job_type="full-time",
        experience_level="junior",
        tech_stack=["React", "TypeScript", "CSS"],
        salary_min=70000,
        salary_max=90000,
    )


@pytest.fixture
def sample_application(db, developer_user, sample_job):
    """A pending application from developer_user to sample_job."""
    return Application.objects.create(
        developer=developer_user,
        job=sample_job,
        cover_letter="I love Django, let me join!",
        resume_url="https://resume.com/john.pdf",
        status="pending",
    )
