# pyrefly: ignore [missing-import]
from rest_framework import viewsets, permissions, status, mixins
# pyrefly: ignore [missing-import]
from rest_framework.decorators import action
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from .models import Job, SavedJob
from .serializers import JobSerializer, JobCreateSerializer, SavedJobSerializer
from .filters import JobFilter
from .match_score import compute_match
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class IsCompanyOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == 'company'

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.company == request.user


class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.filter(is_active=True).select_related('company')
    permission_classes = [IsCompanyOrReadOnly]
    filterset_class = JobFilter
    search_fields = ['title', 'description', 'tech_stack']
    ordering_fields = ['created_at', 'salary_min', 'deadline']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return JobCreateSerializer
        return JobSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save(company=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_jobs(self, request):
        if request.user.role != 'company':
            return Response(
                {"detail": "Only company accounts can access company jobs."},
                status=status.HTTP_403_FORBIDDEN
            )
        jobs = Job.objects.filter(company=request.user).select_related('company')
        page = self.paginate_queryset(jobs)
        if page is not None:
            serializer = JobSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = JobSerializer(jobs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated], url_path='generate-post')
    def generate_post(self, request):
        """
        POST /api/jobs/jobs/generate-post/
        Generates job description, requirements, and tech stack from title.
        """
        if request.user.role not in ('company', 'admin'):
            return Response(
                {'detail': 'Only company accounts can use the AI Job Post Assistant.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        title = (request.data.get('title') or '').strip()
        if not title:
            return Response(
                {'detail': 'Job title is required to generate a job post.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        experience_level = request.data.get('experience_level', '')
        job_type = request.data.get('job_type', '')
        location = request.data.get('location', '')
        company_name = getattr(request.user, 'company_name', '') or request.user.username
        gemini_api_key = getattr(settings, 'GEMINI_API_KEY', '')

        from .job_generator import generate_job_post
        try:
            result = generate_job_post(
                title=title,
                experience_level=experience_level,
                job_type=job_type,
                location=location,
                company_name=company_name,
                api_key=gemini_api_key,
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error("Job post generation failed: %s", e, exc_info=True)
            return Response(
                {'detail': f'Job generation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def match(self, request, pk=None):
        """
        GET /api/jobs/jobs/{id}/match/
        Returns the AI match score between the logged-in developer and this job.
        Only accessible by developers.
        """
        if request.user.role != 'developer':
            return Response(
                {'detail': 'Only developer accounts can get match scores.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        job = self.get_object()
        try:
            result = compute_match(request.user, job, use_ai=True)
            return Response(result.to_dict(), status=status.HTTP_200_OK)
        except Exception as e:
            logger.error('Match score error: %s', e, exc_info=True)
            return Response(
                {'detail': 'Could not compute match score.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='applicants-ranked')
    def applicants_ranked(self, request, pk=None):
        """
        GET /api/jobs/jobs/{id}/applicants-ranked/
        Returns applicants for the job sorted by AI match score (highest first).
        Only accessible by the company that owns the job.
        """
        job = self.get_object()
        if request.user.role not in ('company', 'admin'):
            return Response(
                {'detail': 'Only company accounts can view ranked applicants.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if request.user.role == 'company' and job.company != request.user:
            return Response(
                {'detail': 'You do not own this job posting.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        applications = (
            job.applications
            .select_related('developer')
            .prefetch_related()
        )

        results = []
        for app in applications:
            try:
                match = compute_match(app.developer, job, use_ai=True)
                score_data = match.to_dict()
            except Exception as e:
                logger.warning('Match failed for applicant %s: %s', app.developer_id, e)
                score_data = {
                    'score': 0, 'label': 'N/A',
                    'matching_skills': [], 'missing_skills': [],
                    'bonus_skills': [], 'ai_enhanced': False,
                }

            results.append({
                'application_id': app.id,
                'status': app.status,
                'applied_at': app.applied_at,
                'developer': {
                    'id': app.developer.id,
                    'username': app.developer.username,
                    'first_name': app.developer.first_name,
                    'last_name': app.developer.last_name,
                    'email': app.developer.email,
                    'headline': getattr(app.developer, 'headline', ''),
                    'avatar_url': getattr(app.developer, 'avatar_url', ''),
                    'skills': list(app.developer.skills or []),
                    'github_url': getattr(app.developer, 'github_url', ''),
                    'portfolio_url': getattr(app.developer, 'portfolio_url', ''),
                },
                'match': score_data,
            })

        # Sort by score descending
        results.sort(key=lambda x: x['match']['score'], reverse=True)
        return Response({'job_id': job.id, 'job_title': job.title, 'applicants': results})

    @action(detail=True, methods=['post', 'delete'], permission_classes=[permissions.IsAuthenticated])
    def save(self, request, pk=None):
        if request.user.role != 'developer':
            return Response(
                {"detail": "Only developers can save jobs."},
                status=status.HTTP_403_FORBIDDEN,
            )
        job = self.get_object()
        if request.method == 'POST':
            saved, created = SavedJob.objects.get_or_create(developer=request.user, job=job)
            if created:
                from accounts.activity import log_activity
                log_activity(
                    request.user,
                    category='bookmark',
                    action='bookmark_added',
                    message=f"Added {job.title} to bookmarks",
                    metadata={'job_id': job.id, 'bookmark_id': saved.id},
                )
            serializer = SavedJobSerializer(saved, context={'request': request})
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
            )
        deleted_qs = SavedJob.objects.filter(developer=request.user, job=job)
        if not deleted_qs.exists():
            return Response({"detail": "Job was not saved."}, status=status.HTTP_404_NOT_FOUND)
        from accounts.activity import log_activity
        log_activity(
            request.user,
            category='bookmark',
            action='bookmark_removed',
            message=f"Removed {job.title} from bookmarks",
            metadata={'job_id': job.id},
        )
        deleted_qs.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SavedJobViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SavedJobSerializer

    def get_queryset(self):
        if self.request.user.role != 'developer':
            return SavedJob.objects.none()
        return (
            SavedJob.objects.filter(developer=self.request.user)
            .select_related('job', 'job__company')
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        if request.user.role != 'developer':
            return Response(
                {"detail": "Only developers can save jobs."},
                status=status.HTTP_403_FORBIDDEN,
            )
        job = request.data.get('job_id') or request.data.get('job')
        if not job:
            return Response(
                {"job_id": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        existing = SavedJob.objects.filter(developer=request.user, job_id=job).first()
        if existing:
            serializer = self.get_serializer(existing)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        saved = serializer.save(developer=self.request.user)
        from accounts.activity import log_activity
        log_activity(
            self.request.user,
            category='bookmark',
            action='bookmark_added',
            message=f"Added {saved.job.title} to bookmarks",
            metadata={'job_id': saved.job_id, 'bookmark_id': saved.id},
        )

    def perform_destroy(self, instance):
        from accounts.activity import log_activity
        log_activity(
            self.request.user,
            category='bookmark',
            action='bookmark_removed',
            message=f"Removed {instance.job.title} from bookmarks",
            metadata={'job_id': instance.job_id},
        )
        instance.delete()
