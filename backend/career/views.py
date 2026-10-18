import logging
from django.utils import timezone
# pyrefly: ignore [missing-import]
from django.conf import settings
# pyrefly: ignore [missing-import]
from rest_framework import viewsets, permissions, status
# pyrefly: ignore [missing-import]
from rest_framework.decorators import action
# pyrefly: ignore [missing-import]
from rest_framework.response import Response

from .models import Roadmap, RoadmapTask
from .serializers import RoadmapSerializer, RoadmapListSerializer, RoadmapTaskSerializer
from .career_coach import generate_career_roadmap

logger = logging.getLogger(__name__)


class CareerViewSet(viewsets.ViewSet):
    """
    ViewSet for AI Career Coach & Personalized Learning Roadmap.

    Endpoints:
        POST /api/career/analyze/           – Generate a new roadmap (creates DB records)
        GET  /api/career/roadmaps/          – List developer's saved roadmaps
        GET  /api/career/roadmaps/<id>/     – Retrieve a single roadmap with tasks
        POST /api/career/tasks/<id>/complete/   – Mark a task as completed
        POST /api/career/tasks/<id>/uncomplete/ – Unmark a completed task
        DELETE /api/career/roadmaps/<id>/delete/ – Delete a roadmap
    """
    permission_classes = [permissions.IsAuthenticated]

    def _developer_only(self, request):
        if request.user.role != 'developer':
            return Response(
                {"detail": "Only developers can use the Career Coach."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    # ── POST /api/career/analyze/ ────────────────────────────────────────────

    @action(detail=False, methods=['post'], url_path='analyze')
    def analyze(self, request):
        """
        Generate a personalized career roadmap using AI.
        Body: { target_role: str, duration_days: 30|60|90 }
        """
        err = self._developer_only(request)
        if err:
            return err

        target_role = (request.data.get('target_role') or '').strip()
        duration_days = int(request.data.get('duration_days') or 30)

        if not target_role:
            return Response(
                {"detail": "target_role is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if duration_days not in (30, 60, 90):
            duration_days = 30

        user = request.user

        # Build user profile from the User model
        user_profile = {
            "name": f"{user.first_name} {user.last_name}".strip() or user.username,
            "first_name": user.first_name,
            "headline": user.headline,
            "skills": user.skills or [],
            "projects": user.projects or [],
            "experience": user.experience or [],
            "bio": user.bio,
        }

        # Fetch a sample of relevant active job listings for market context
        try:
            from jobs.models import Job  # avoid circular import
            job_qs = Job.objects.filter(is_active=True).order_by('-created_at')[:20]
            job_samples = list(job_qs.values('title', 'tech_stack', 'requirements', 'experience_level'))
        except Exception:
            job_samples = []

        api_key = getattr(settings, 'GEMINI_API_KEY', '')

        roadmap_data = generate_career_roadmap(
            user_profile=user_profile,
            target_role=target_role,
            duration_days=duration_days,
            job_samples=job_samples,
            api_key=api_key,
        )

        # Persist the roadmap
        roadmap = Roadmap.objects.create(
            developer=user,
            target_role=target_role,
            duration_days=str(duration_days),
            skill_gaps=roadmap_data.get('skill_gaps', []),
            summary=roadmap_data.get('summary', ''),
            ai_enhanced=roadmap_data.get('ai_enhanced', False),
        )

        # Persist the tasks
        tasks_data = roadmap_data.get('tasks', [])
        task_objs = [
            RoadmapTask(
                roadmap=roadmap,
                title=t['title'],
                description=t.get('description', ''),
                category=t.get('category', 'learn'),
                resource_url=t.get('resource_url', ''),
                week=t.get('week', 1),
                order=t.get('order', 0),
            )
            for t in tasks_data
        ]
        RoadmapTask.objects.bulk_create(task_objs)

        try:
            from accounts.activity import log_activity
            log_activity(
                user=user,
                category='career',
                action='roadmap_started',
                message=f'Started {roadmap.duration_days}-day career roadmap for {roadmap.target_role}',
                metadata={
                    'roadmap_id': roadmap.id,
                    'target_role': roadmap.target_role,
                    'duration_days': roadmap.duration_days,
                },
            )
        except Exception as exc:
            logger.warning("Failed to log activity for roadmap start: %s", exc)

        serializer = RoadmapSerializer(roadmap)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # ── GET /api/career/roadmaps/ ────────────────────────────────────────────

    @action(detail=False, methods=['get'], url_path='roadmaps')
    def list_roadmaps(self, request):
        """List all roadmaps for the authenticated developer."""
        err = self._developer_only(request)
        if err:
            return err

        roadmaps = Roadmap.objects.filter(developer=request.user).prefetch_related('tasks')
        serializer = RoadmapListSerializer(roadmaps, many=True)
        return Response(serializer.data)

    # ── GET /api/career/roadmaps/<id>/ ───────────────────────────────────────

    @action(detail=True, methods=['get'], url_path='detail')
    def roadmap_detail(self, request, pk=None):
        """Retrieve a single roadmap with all tasks."""
        err = self._developer_only(request)
        if err:
            return err

        try:
            roadmap = Roadmap.objects.prefetch_related('tasks').get(
                pk=pk, developer=request.user
            )
        except Roadmap.DoesNotExist:
            return Response({"detail": "Roadmap not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = RoadmapSerializer(roadmap)
        return Response(serializer.data)

    # ── DELETE /api/career/roadmaps/<id>/delete/ ─────────────────────────────

    @action(detail=True, methods=['delete'], url_path='delete')
    def roadmap_delete(self, request, pk=None):
        """Delete a roadmap owned by the developer."""
        err = self._developer_only(request)
        if err:
            return err

        try:
            roadmap = Roadmap.objects.get(pk=pk, developer=request.user)
        except Roadmap.DoesNotExist:
            return Response({"detail": "Roadmap not found."}, status=status.HTTP_404_NOT_FOUND)

        roadmap.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── POST /api/career/tasks/<id>/complete/ ────────────────────────────────

    @action(detail=True, methods=['post'], url_path='complete')
    def task_complete(self, request, pk=None):
        """Mark a task as completed."""
        err = self._developer_only(request)
        if err:
            return err

        try:
            task = RoadmapTask.objects.select_related('roadmap').get(
                pk=pk, roadmap__developer=request.user
            )
        except RoadmapTask.DoesNotExist:
            return Response({"detail": "Task not found."}, status=status.HTTP_404_NOT_FOUND)

        task.is_completed = True
        task.completed_at = timezone.now()
        task.save(update_fields=['is_completed', 'completed_at'])

        try:
            from accounts.activity import log_activity
            roadmap = task.roadmap
            week_tasks = roadmap.tasks.filter(week=task.week)
            week_completed = not week_tasks.filter(is_completed=False).exists()
            total_count = roadmap.tasks.count()
            completed_count = roadmap.tasks.filter(is_completed=True).count()
            all_completed = (total_count > 0 and completed_count == total_count)

            if all_completed:
                log_activity(
                    user=request.user,
                    category='career',
                    action='roadmap_completed',
                    message=f'🎉 Completed entire career roadmap for {roadmap.target_role}!',
                    metadata={
                        'roadmap_id': roadmap.id,
                        'target_role': roadmap.target_role,
                        'completion_percent': 100,
                    },
                )
            elif week_completed:
                log_activity(
                    user=request.user,
                    category='career',
                    action='week_completed',
                    message=f'Completed all Week {task.week} milestones for {roadmap.target_role}!',
                    metadata={
                        'roadmap_id': roadmap.id,
                        'target_role': roadmap.target_role,
                        'week': task.week,
                        'completion_percent': roadmap.completion_percent,
                    },
                )
            else:
                log_activity(
                    user=request.user,
                    category='career',
                    action='task_completed',
                    message=f'Completed milestone: {task.title}',
                    metadata={
                        'roadmap_id': roadmap.id,
                        'target_role': roadmap.target_role,
                        'task_id': task.id,
                        'week': task.week,
                        'completion_percent': roadmap.completion_percent,
                    },
                )
        except Exception as exc:
            logger.warning("Failed to log activity for task complete: %s", exc)

        serializer = RoadmapTaskSerializer(task)
        return Response(serializer.data)

    # ── POST /api/career/tasks/<id>/uncomplete/ ──────────────────────────────

    @action(detail=True, methods=['post'], url_path='uncomplete')
    def task_uncomplete(self, request, pk=None):
        """Unmark a completed task."""
        err = self._developer_only(request)
        if err:
            return err

        try:
            task = RoadmapTask.objects.select_related('roadmap').get(
                pk=pk, roadmap__developer=request.user
            )
        except RoadmapTask.DoesNotExist:
            return Response({"detail": "Task not found."}, status=status.HTTP_404_NOT_FOUND)

        task.is_completed = False
        task.completed_at = None
        task.save(update_fields=['is_completed', 'completed_at'])

        try:
            from accounts.activity import log_activity
            roadmap = task.roadmap
            log_activity(
                user=request.user,
                category='career',
                action='task_uncompleted',
                message=f'Reopened milestone: {task.title}',
                metadata={
                    'roadmap_id': roadmap.id,
                    'target_role': roadmap.target_role,
                    'task_id': task.id,
                    'week': task.week,
                    'completion_percent': roadmap.completion_percent,
                },
            )
        except Exception as exc:
            logger.warning("Failed to log activity for task uncomplete: %s", exc)

        serializer = RoadmapTaskSerializer(task)
        return Response(serializer.data)
