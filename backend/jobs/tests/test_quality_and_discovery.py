import pytest
from rest_framework import status
from jobs.models import Job
from jobs.quality_checker import (
    audit_job_quality_and_safety,
    detect_safety_warning_flags,
    evaluate_job_quality_heuristic,
    check_duplicate_listing,
)
from jobs.recommendations import get_personalized_recommendations, notify_matching_developers_of_new_job
from accounts.models import ActivityLog


@pytest.mark.django_db
class TestJobQualityChecker:
    def test_detects_suspicious_payment(self):
        text = "To proceed with this role, please transfer an equipment fee of $250 via wire money."
        flags = detect_safety_warning_flags(text)
        assert len(flags) > 0
        assert any(f['type'] == 'suspicious_payment' for f in flags)
        assert any(f['severity'] == 'danger' for f in flags)

    def test_detects_questionable_contact_link(self):
        text = "Send your resume and contact me on telegram at t.me/hiring_fast for instant interview."
        flags = detect_safety_warning_flags(text)
        assert len(flags) > 0
        assert any(f['type'] == 'questionable_link' for f in flags)

    def test_clean_text_has_no_safety_flags(self):
        text = "We are seeking a Full-Stack Engineer with 3+ years of Python and React experience. Apply through DevHire."
        flags = detect_safety_warning_flags(text)
        assert len(flags) == 0

    def test_quality_heuristic_rewards_complete_job(self):
        res = evaluate_job_quality_heuristic(
            title="Senior React Developer",
            description="Our team is looking for a Senior React Developer to lead frontend architecture and scale our developer portal. You will build responsive UIs, collaborate with product managers, and optimize web vitals.",
            requirements="Must have 4+ years of React, TypeScript, and modern CSS. Strong familiarity with Next.js, Redux or Zustand, and unit testing with Jest.",
            tech_stack=["React", "TypeScript", "Next.js", "TailwindCSS"],
            salary_min=120000,
            salary_max=150000,
            location="San Francisco, CA",
        )
        assert res['quality_score'] >= 80
        assert len(res['missing_elements']) == 0

    def test_quality_heuristic_penalizes_incomplete_job(self):
        res = evaluate_job_quality_heuristic(
            title="dev",
            description="need someone quick",
            requirements="skills needed",
            tech_stack=[],
        )
        assert res['quality_score'] < 50
        assert len(res['missing_elements']) > 0


@pytest.mark.django_db
class TestDuplicateDetection:
    def test_duplicate_detected(self, company_user):
        Job.objects.create(
            company=company_user,
            title="Senior Python Django Engineer",
            description="Build scalable REST APIs with Django and PostgreSQL for high volume data processing.",
            requirements="3+ years with Django, Python, Docker, Celery.",
            location="Remote",
            tech_stack=["Python", "Django", "PostgreSQL"],
        )

        dup = check_duplicate_listing(
            title="Senior Python Django Engineer",
            description="Build scalable REST APIs with Django and PostgreSQL for high volume data processing.",
            requirements="3+ years with Django, Python, Docker, Celery.",
            company_id=company_user.id,
        )
        assert dup is not None
        assert dup['type'] == 'potential_duplicate'


@pytest.mark.django_db
class TestJobEndpoints:
    def test_audit_draft_endpoint(self, auth_company_client):
        payload = {
            "title": "Backend Go Developer",
            "description": "Looking for Go engineer to build microservices.",
            "requirements": "2 years experience with Go and Kubernetes.",
            "tech_stack": ["Go", "Docker", "Kubernetes"],
            "location": "Remote",
        }
        res = auth_company_client.post('/api/jobs/audit-draft/', payload, format='json')
        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        assert 'quality_score' in data
        assert 'suggestions' in data
        assert 'moderation_status' in data

    def test_personalized_recommendations_endpoint(self, auth_dev_client, developer_user, company_user):
        developer_user.skills = ["React", "TypeScript", "TailwindCSS"]
        developer_user.headline = "Frontend Engineer"
        developer_user.location = "Remote"
        developer_user.save()

        j1 = Job.objects.create(
            company=company_user,
            title="Frontend React Specialist",
            description="Build modern user interfaces with React and TypeScript.",
            requirements="Expert in React, TypeScript, and modern component systems.",
            tech_stack=["React", "TypeScript", "TailwindCSS"],
            location="Remote",
            is_remote=True,
            experience_level="mid",
        )

        res = auth_dev_client.get('/api/jobs/recommendations/')
        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        assert data['count'] >= 1
        top_rec = data['results'][0]
        assert top_rec['id'] == j1.id
        assert 'recommendation' in top_rec
        assert top_rec['recommendation']['score'] > 60
        assert len(top_rec['recommendation']['reasons']) > 0

    def test_new_job_matching_notification(self, developer_user, company_user):
        developer_user.skills = ["Python", "Django", "PostgreSQL"]
        developer_user.save()

        job = Job.objects.create(
            company=company_user,
            title="Python Backend Lead",
            description="Lead backend architecture with Python and Django.",
            requirements="Deep expertise with Django, PostgreSQL, and scalable systems.",
            tech_stack=["Python", "Django", "PostgreSQL", "Docker"],
            location="Remote",
            is_remote=True,
        )

        notified = notify_matching_developers_of_new_job(job, min_match_threshold=40)
        assert notified >= 1
        alert = ActivityLog.objects.filter(user=developer_user, category='job').first()
        assert alert is not None
        assert "New job matching your skills" in alert.message
