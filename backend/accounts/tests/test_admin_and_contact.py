import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from accounts.models import ContactMessage, DirectMessage

User = get_user_model()


@pytest.mark.django_db
class TestContactAndAdminAPI:
    def test_submit_contact_message(self, client):
        response = client.post('/api/auth/contact/', {
            'name': 'Jane Visitor',
            'email': 'jane@example.com',
            'subject': 'Help with login',
            'category': 'query',
            'description': 'I need assistance resetting my password.',
        })
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['subject'] == 'Help with login'
        assert ContactMessage.objects.filter(email='jane@example.com').exists()

    def test_admin_stats_access_control(self, auth_dev_client, developer_user):
        # Developer user should be denied access to admin stats
        response = auth_dev_client.get('/api/auth/admin/stats/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

        # Make user admin
        developer_user.role = 'admin'
        developer_user.is_staff = True
        developer_user.save()

        response = auth_dev_client.get('/api/auth/admin/stats/')
        assert response.status_code == status.HTTP_200_OK
        assert 'total_users' in response.data
        assert 'total_jobs' in response.data

    def test_direct_messaging(self, auth_dev_client, auth_company_client, developer_user, company_user):
        admin = User.objects.create_user(
            username='siteadmin',
            email='admin@devhire.com',
            password='Password123!',
            role='admin',
            is_staff=True,
        )

        # Developer attempting to send message is rejected (403 FORBIDDEN)
        res_dev_send = auth_dev_client.post('/api/auth/messages/', {
            'recipient_id': admin.id,
            'subject': 'Question about my application',
            'body': 'Hello admin, I have a query about a job posting.',
        })
        assert res_dev_send.status_code == status.HTTP_403_FORBIDDEN

        # Company sends message to developer
        from jobs.models import Job
        from applications.models import Application
        job = Job.objects.create(
            company=company_user,
            title='Backend Engineer',
            description='Django role',
            requirements='Python',
            location='Remote'
        )
        Application.objects.create(developer=developer_user, job=job)

        res_comp_send = auth_company_client.post('/api/auth/messages/', {
            'recipient_id': developer_user.id,
            'subject': 'Interview Invitation',
            'body': 'We would like to schedule an interview with you.',
        })
        assert res_comp_send.status_code == status.HTTP_201_CREATED
        assert DirectMessage.objects.filter(sender=company_user, recipient=developer_user).exists()

    def test_messageable_users(self, auth_dev_client, auth_company_client, developer_user, company_user):
        from jobs.models import Job
        from applications.models import Application

        admin = User.objects.create_user(
            username='siteadmin2',
            email='admin2@devhire.com',
            password='Password123!',
            role='admin',
            is_staff=True,
        )

        # Developers get empty list of messageable users (cannot initiate messages)
        res_dev = auth_dev_client.get('/api/auth/messages/users/')
        assert res_dev.status_code == status.HTTP_200_OK
        assert len(res_dev.data['results']) == 0

        # Company gets messageable users (contains developer who applied & admin)
        job = Job.objects.create(
            company=company_user,
            title='Fullstack Dev',
            description='React/Python',
            requirements='JS',
            location='Remote'
        )
        Application.objects.create(developer=developer_user, job=job)

        res_comp = auth_company_client.get('/api/auth/messages/users/')
        assert res_comp.status_code == status.HTTP_200_OK
        comp_returned_ids = [u['id'] for u in res_comp.data['results']]
        assert developer_user.id in comp_returned_ids
        assert admin.id in comp_returned_ids

    def test_admin_user_management_last_login_and_inactivity_rules(self, api_client):
        from datetime import timedelta
        from django.utils import timezone
        now = timezone.now()
        thirty_five_days_ago = now - timedelta(days=35)

        # Create active admin, inactive developer (>30d), inactive company (>30d), and inactive-dated admin (>30d)
        admin = User.objects.create_user(
            username='super_admin',
            email='admin@test.com',
            password='Password1!',
            role='admin',
            is_staff=True,
        )
        old_admin = User.objects.create_user(
            username='old_admin',
            email='oldadmin@test.com',
            password='Password1!',
            role='admin',
            is_staff=True,
        )
        old_admin.last_login = thirty_five_days_ago
        old_admin.save()

        old_dev = User.objects.create_user(
            username='old_dev',
            email='olddev@test.com',
            password='Password1!',
            role='developer',
        )
        old_dev.last_login = thirty_five_days_ago
        old_dev.save()

        old_comp = User.objects.create_user(
            username='old_comp',
            email='oldcomp@test.com',
            password='Password1!',
            role='company',
        )
        old_comp.last_login = thirty_five_days_ago
        old_comp.save()

        # Login as admin
        api_client.force_authenticate(user=admin)

        # GET /api/auth/admin/users/ triggers sync_inactive_users()
        res = api_client.get('/api/auth/admin/users/')
        assert res.status_code == status.HTTP_200_OK
        users_by_name = {u['username']: u for u in res.data['results']}

        # Admin accounts must ALWAYS remain active
        assert users_by_name['super_admin']['is_active'] is True
        assert users_by_name['old_admin']['is_active'] is True

        # Developer and company accounts inactive for >30d are marked inactive
        assert users_by_name['old_dev']['is_active'] is False
        assert users_by_name['old_comp']['is_active'] is False

        # last_login field is present
        assert 'last_login' in users_by_name['old_dev']
        assert users_by_name['old_dev']['last_login'] is not None

        # Admin accounts cannot be deactivated
        deact_res = api_client.patch(f'/api/auth/admin/users/{old_admin.id}/', {'is_active': False})
        assert deact_res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Admin accounts must always remain active' in deact_res.data['detail']

        # Reactivate developer account via admin dashboard
        react_res = api_client.patch(f'/api/auth/admin/users/{old_dev.id}/', {'is_active': True})
        assert react_res.status_code == status.HTTP_200_OK
        assert react_res.data['is_active'] is True
        old_dev.refresh_from_db()
        assert old_dev.is_active is True
        assert old_dev.last_login is not None
        assert old_dev.last_login > thirty_five_days_ago

        # Login directly with old_admin (still active!)
        api_client.force_authenticate(user=None)
        login_admin_res = api_client.post('/api/auth/login/', {'username': 'old_admin', 'password': 'Password1!'})
        assert login_admin_res.status_code == status.HTTP_200_OK
        assert 'access' in login_admin_res.data

        # Login directly with old_comp (>30d inactive) -> requires reactivation
        login_comp_res = api_client.post('/api/auth/login/', {'username': 'old_comp', 'password': 'Password1!'})
        assert login_comp_res.status_code == status.HTTP_400_BAD_REQUEST
        assert bool(login_comp_res.data.get('inactive_verification_required')) is True




