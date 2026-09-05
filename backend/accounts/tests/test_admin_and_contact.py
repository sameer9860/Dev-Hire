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



