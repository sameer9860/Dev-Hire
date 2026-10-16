import logging
# pyrefly: ignore [missing-import]
from rest_framework import viewsets, permissions, status
# pyrefly: ignore [missing-import]
from rest_framework.decorators import action
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
from .models import Application
from .serializers import ApplicationSerializer, ApplicationCreateSerializer, ApplicationStatusSerializer

logger = logging.getLogger(__name__)


class ApplicationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'developer':
            return Application.objects.filter(developer=user).select_related('job', 'developer')
        elif user.role == 'company':
            return Application.objects.filter(job__company=user).select_related('job', 'developer')
        return Application.objects.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return ApplicationCreateSerializer
        if self.action == 'update_status':
            return ApplicationStatusSerializer
        return ApplicationSerializer

    def perform_create(self, serializer):
        application = serializer.save(developer=self.request.user)
        from accounts.activity import log_activity
        # Log for developer
        log_activity(
            self.request.user,
            category='application',
            action='application_submitted',
            message=f"Applied to {application.job.title}",
            metadata={'job_id': application.job_id, 'application_id': application.id},
        )
        # Log notification for Company when candidate applies
        dev_name = self.request.user.username
        log_activity(
            application.job.company,
            category='application',
            action='candidate_applied',
            message=f"{dev_name} applied for {application.job.title}",
            metadata={
                'job_id': application.job_id,
                'job_title': application.job.title,
                'application_id': application.id,
                'developer_name': dev_name,
            },
        )

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        application = self.get_object()
        if application.job.company != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        old_status = application.status
        serializer = ApplicationStatusSerializer(application, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_app = serializer.save()

        if old_status != updated_app.status:
            from accounts.activity import log_activity
            status_label = updated_app.get_status_display()
            company_name = updated_app.job.company.company_name or updated_app.job.company.username
            developer_name = updated_app.developer.username
            log_activity(
                user=updated_app.developer,
                category='application',
                action=f'application_{updated_app.status}',
                message=f"Your application for {updated_app.job.title} at {company_name} was marked as {status_label}.",
                metadata={
                    'job_id': updated_app.job_id,
                    'job_title': updated_app.job.title,
                    'application_id': updated_app.id,
                    'status': updated_app.status,
                    'company_name': company_name,
                },
            )
            # Confirm pipeline change for the company inbox
            log_activity(
                user=updated_app.job.company,
                category='application',
                action='application_status_updated',
                message=f"You marked {developer_name} as {status_label} for {updated_app.job.title}.",
                metadata={
                    'job_id': updated_app.job_id,
                    'job_title': updated_app.job.title,
                    'application_id': updated_app.id,
                    'status': updated_app.status,
                    'developer_name': developer_name,
                },
            )

        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='resume-url')
    def resume_url(self, request, pk=None):
        """
        Returns a short-lived signed URL (1 hour) for the candidate's resume.
        Only accessible by the developer who applied or the hiring company.
        """
        application = self.get_object()
        user = request.user

        is_applicant = application.developer_id == user.id
        is_company = application.job.company_id == user.id
        is_admin = getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)

        if not (is_applicant or is_company or is_admin):
            return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        raw_url = application.resume_url or getattr(application.developer, 'resume_url', '') or ''

        if not raw_url:
            return Response({'resume_url': None, 'message': 'No resume on file.'})

        from accounts.storage import generate_supabase_signed_url
        signed_url = generate_supabase_signed_url(raw_url, expires_in=3600)

        return Response({
            'resume_url': signed_url,
            'expires_in': 3600,
            'source': 'application' if application.resume_url else 'profile',
        })

    @action(detail=False, methods=['post'], url_path='generate-pitch', permission_classes=[permissions.IsAuthenticated])
    def generate_pitch(self, request):
        """
        POST /api/applications/generate-pitch/
        Generates a tailored, 2-paragraph cover note connecting the developer's
        skills & projects to the target job requirements.
        Only accessible by developers.
        """
        user = request.user
        if getattr(user, 'role', '') != 'developer':
            return Response(
                {'detail': 'Only developer accounts can generate application pitches.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        job_id = request.data.get('job_id')
        job_data = {}
        if job_id:
            from jobs.models import Job
            try:
                job = Job.objects.select_related('company').get(id=job_id)
                job_data = {
                    'title': job.title,
                    'company_name': getattr(job.company, 'company_name', '') or job.company.username,
                    'description': job.description or '',
                    'requirements': job.requirements or '',
                    'tech_stack': job.tech_stack or [],
                }
            except Job.DoesNotExist:
                return Response(
                    {'detail': 'Job not found.'},
                    status=status.HTTP_404_NOT_FOUND,
                )

        # Allow explicit overrides from request payload if passed
        for key in ['title', 'job_title', 'company_name', 'description', 'job_description', 'requirements', 'tech_stack']:
            val = request.data.get(key)
            if val is not None:
                norm_key = 'title' if key == 'job_title' else ('description' if key == 'job_description' else key)
                job_data[norm_key] = val

        if not job_data.get('title'):
            return Response(
                {'detail': 'Job information (job_id or job_title) is required to generate a tailored pitch.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Assemble developer profile
        user_profile = request.data.get('user_profile') or {}
        if not isinstance(user_profile, dict):
            user_profile = {}

        # Default to authenticated developer's model attributes if not overridden
        user_profile.setdefault('name', user.get_full_name() or user.username)
        user_profile.setdefault('first_name', user.first_name)
        user_profile.setdefault('headline', getattr(user, 'headline', ''))
        user_profile.setdefault('skills', getattr(user, 'skills', []))
        user_profile.setdefault('projects', getattr(user, 'projects', []))
        user_profile.setdefault('experience', getattr(user, 'experience', []))
        user_profile.setdefault('bio', getattr(user, 'bio', ''))

        from django.conf import settings
        gemini_api_key = getattr(settings, 'GEMINI_API_KEY', '')

        from .pitch_generator import generate_application_pitch
        try:
            result = generate_application_pitch(
                user_profile=user_profile,
                job_data=job_data,
                api_key=gemini_api_key,
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error("Pitch generation failed: %s", e, exc_info=True)
            return Response(
                {'detail': f'Pitch generation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
