"""
Tests for Feature #5: AI Career Coach & Personalized Learning Roadmap
"""
import json
from unittest.mock import patch, MagicMock
import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from accounts.models import User
from career.models import Roadmap, RoadmapTask
from career.career_coach import generate_career_roadmap, _build_fallback_roadmap


# ── fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def developer(db):
    return User.objects.create_user(
        username='devcoach',
        email='devcoach@test.com',
        password='DevPass123!',
        role='developer',
        headline='Python Backend Developer',
        skills=['Python', 'Django', 'PostgreSQL'],
        projects=[{'title': 'MyAPI', 'description': 'A REST API built with Django'}],
        experience=[{'title': 'Junior Dev', 'company': 'TechCorp'}],
        bio='Passionate backend developer building clean APIs.',
    )


@pytest.fixture
def company_user(db):
    return User.objects.create_user(
        username='coachcompany',
        email='company@coachtest.com',
        password='CompPass123!',
        role='company',
        company_name='Test Co',
    )


@pytest.fixture
def dev_client(developer):
    client = APIClient()
    client.force_authenticate(user=developer)
    return client


@pytest.fixture
def company_client(company_user):
    client = APIClient()
    client.force_authenticate(user=company_user)
    return client


@pytest.fixture
def sample_roadmap(developer):
    roadmap = Roadmap.objects.create(
        developer=developer,
        target_role='Full-Stack Developer',
        duration_days='30',
        skill_gaps=['React', 'TypeScript'],
        summary='You are on the right track.',
        ai_enhanced=False,
    )
    RoadmapTask.objects.create(
        roadmap=roadmap, title='Learn React', description='Start with hooks.',
        category='learn', week=1, order=0,
    )
    RoadmapTask.objects.create(
        roadmap=roadmap, title='Build a project', description='Apply your skills.',
        category='build', week=2, order=1,
    )
    return roadmap


# ── Unit tests: career_coach engine ──────────────────────────────────────────

class TestCareerCoachUnit:

    def test_fallback_for_known_role(self):
        result = _build_fallback_roadmap(
            user_profile={'skills': ['Python'], 'headline': 'Backend Dev'},
            target_role='junior django developer',
            duration_days=30,
        )
        assert 'summary' in result
        assert 'skill_gaps' in result
        assert 'tasks' in result
        assert len(result['tasks']) > 0
        # Should exclude Python since developer already has it
        assert 'Python' not in result['skill_gaps']

    def test_fallback_for_unknown_role(self):
        result = _build_fallback_roadmap(
            user_profile={'skills': [], 'headline': 'Dev'},
            target_role='Quantum Computing Engineer',
            duration_days=30,
        )
        assert len(result['tasks']) > 0
        assert isinstance(result['skill_gaps'], list)

    def test_generate_without_api_key_uses_fallback(self):
        result = generate_career_roadmap(
            user_profile={'skills': ['JavaScript'], 'headline': 'Frontend Dev'},
            target_role='Frontend Developer',
            duration_days=30,
            api_key='',
        )
        assert result['ai_enhanced'] is False
        assert len(result['tasks']) > 0
        assert 'summary' in result

    def test_generate_60_day_roadmap_has_more_tasks(self):
        result_30 = generate_career_roadmap(
            user_profile={'skills': []}, target_role='Full-Stack Developer',
            duration_days=30, api_key='',
        )
        result_60 = generate_career_roadmap(
            user_profile={'skills': []}, target_role='Full-Stack Developer',
            duration_days=60, api_key='',
        )
        assert len(result_60['tasks']) >= len(result_30['tasks'])

    def test_weeks_are_unique_and_not_repeating(self):
        result = _build_fallback_roadmap(
            user_profile={'skills': []},
            target_role='junior django developer',
            duration_days=30,  # 4 weeks
        )
        tasks = result['tasks']
        week1_titles = [t['title'] for t in tasks if t['week'] == 1]
        week4_titles = [t['title'] for t in tasks if t['week'] == 4]
        assert len(week1_titles) > 0
        assert len(week4_titles) > 0
        intersection = set(week1_titles).intersection(set(week4_titles))
        assert len(intersection) == 0, f"Week 1 and Week 4 have duplicate tasks: {intersection}"

    def test_generate_with_gemini_mock(self):
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            "summary": "You are a strong candidate for this role.",
            "skill_gaps": ["React", "Docker"],
            "tasks": [
                {
                    "title": "Learn React basics",
                    "description": "Complete the official React tutorial.",
                    "category": "learn",
                    "resource_url": "https://react.dev/learn",
                    "week": 1,
                }
            ]
        })

        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_response

        with patch('google.genai.Client', return_value=mock_client):
            result = generate_career_roadmap(
                user_profile={'skills': ['Python']},
                target_role='Full-Stack Developer',
                duration_days=30,
                api_key='fake-key-123',
            )

        assert result['ai_enhanced'] is True
        assert len(result['tasks']) == 1
        assert result['skill_gaps'] == ["React", "Docker"]


# ── Endpoint tests ────────────────────────────────────────────────────────────

class TestCareerEndpoints:

    def test_analyze_creates_roadmap(self, dev_client, developer, db):
        response = dev_client.post('/api/career/analyze/', {
            'target_role': 'Junior Django Developer',
            'duration_days': 30,
        })
        assert response.status_code == 201
        data = response.json()
        assert data['target_role'] == 'Junior Django Developer'
        assert 'tasks' in data
        assert len(data['tasks']) > 0
        assert 'skill_gaps' in data
        assert 'completion_percent' in data
        assert data['completion_percent'] == 0

        from accounts.models import ActivityLog
        log = ActivityLog.objects.filter(user=developer, category='career', action='roadmap_started').first()
        assert log is not None
        assert 'Junior Django Developer' in log.message

    def test_company_cannot_analyze(self, company_client, db):
        response = company_client.post('/api/career/analyze/', {
            'target_role': 'Django Developer',
            'duration_days': 30,
        })
        assert response.status_code == 403

    def test_unauthenticated_cannot_analyze(self, db):
        client = APIClient()
        response = client.post('/api/career/analyze/', {
            'target_role': 'Django Developer',
        })
        assert response.status_code == 401

    def test_analyze_requires_target_role(self, dev_client, db):
        response = dev_client.post('/api/career/analyze/', {'duration_days': 30})
        assert response.status_code == 400

    def test_list_roadmaps(self, dev_client, sample_roadmap):
        response = dev_client.get('/api/career/roadmaps/')
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]['target_role'] == 'Full-Stack Developer'

    def test_roadmap_detail(self, dev_client, sample_roadmap):
        response = dev_client.get(f'/api/career/roadmaps/{sample_roadmap.pk}/detail/')
        assert response.status_code == 200
        data = response.json()
        assert len(data['tasks']) == 2
        assert data['completion_percent'] == 0

    def test_complete_task(self, dev_client, sample_roadmap, developer):
        task = sample_roadmap.tasks.first()
        response = dev_client.post(f'/api/career/tasks/{task.pk}/complete/')
        assert response.status_code == 200
        assert response.json()['is_completed'] is True

        # Check completion_percent updates
        detail = dev_client.get(f'/api/career/roadmaps/{sample_roadmap.pk}/detail/')
        assert detail.json()['completion_percent'] == 50  # 1 of 2 done

        from accounts.models import ActivityLog
        log = ActivityLog.objects.filter(user=developer, category='career').first()
        assert log is not None

    def test_uncomplete_task(self, dev_client, sample_roadmap):
        task = sample_roadmap.tasks.first()
        # Complete first
        dev_client.post(f'/api/career/tasks/{task.pk}/complete/')
        # Then uncomplete
        response = dev_client.post(f'/api/career/tasks/{task.pk}/uncomplete/')
        assert response.status_code == 200
        assert response.json()['is_completed'] is False

    def test_delete_roadmap(self, dev_client, sample_roadmap):
        pk = sample_roadmap.pk
        response = dev_client.delete(f'/api/career/roadmaps/{pk}/delete/')
        assert response.status_code == 204
        assert not Roadmap.objects.filter(pk=pk).exists()

    def test_roadmap_not_found_for_other_developer(self, dev_client, db):
        other_dev = User.objects.create_user(
            username='otherdev99', email='other99@test.com',
            password='OtherPass123!', role='developer',
        )
        roadmap = Roadmap.objects.create(
            developer=other_dev, target_role='Senior Dev',
            duration_days='30', skill_gaps=[], summary='',
        )
        response = dev_client.get(f'/api/career/roadmaps/{roadmap.pk}/detail/')
        assert response.status_code == 404
