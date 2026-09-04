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

    def test_direct_messaging(self, auth_dev_client, developer_user, company_user):
        admin = User.objects.create_user(
            username='siteadmin',
            email='admin@devhire.com',
            password='Password123!',
            role='admin',
            is_staff=True,
        )

        # Developer sends message to admin
        response = auth_dev_client.post('/api/auth/messages/', {
            'recipient_id': admin.id,
            'subject': 'Question about my application',
            'body': 'Hello admin, I have a query about a job posting.',
        })
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['body'] == 'Hello admin, I have a query about a job posting.'
        assert DirectMessage.objects.filter(sender=developer_user, recipient=admin).exists()

    def test_messageable_users(self, auth_dev_client, auth_company_client, developer_user, company_user):
        admin = User.objects.create_user(
            username='siteadmin2',
            email='admin2@devhire.com',
            password='Password123!',
            role='admin',
            is_staff=True,
        )

        # Developer gets messageable users (should contain company & admin)
        res_dev = auth_dev_client.get('/api/auth/messages/users/')
        assert res_dev.status_code == status.HTTP_200_OK
        returned_ids = [u['id'] for u in res_dev.data['results']]
        assert company_user.id in returned_ids
        assert admin.id in returned_ids

        # Company gets messageable users (should contain developer & admin)
        res_comp = auth_company_client.get('/api/auth/messages/users/')
        assert res_comp.status_code == status.HTTP_200_OK
        comp_returned_ids = [u['id'] for u in res_comp.data['results']]
        assert developer_user.id in comp_returned_ids
        assert admin.id in comp_returned_ids


