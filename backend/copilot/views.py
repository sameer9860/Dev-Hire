import logging
from django.conf import settings
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from applications.models import Application
from jobs.models import Job
from .serializers import (
    CopilotSearchSerializer,
    CopilotSummarySerializer,
    CopilotCompareSerializer,
    CopilotInterviewQuestionsSerializer,
    CopilotDraftMessageSerializer,
)
from .recruiter_copilot import (
    search_candidates,
    summarize_candidate,
    compare_candidates,
    generate_interview_questions,
    draft_recruiter_message,
)

logger = logging.getLogger(__name__)


def _extract_candidate_data(app: Application) -> dict:
    """Format an Application record into a candidate dict for the copilot."""
    dev = app.developer
    return {
        "id": app.id,
        "developer_id": dev.id,
        "username": dev.username,
        "name": f"{dev.first_name} {dev.last_name}".strip() or dev.username,
        "first_name": dev.first_name,
        "last_name": dev.last_name,
        "headline": dev.headline or "",
        "bio": dev.bio or "",
        "skills": dev.skills or [],
        "projects": dev.projects or [],
        "experience": dev.experience or [],
        "cover_letter": app.cover_letter or "",
        "resume_url": app.resume_url or "",
        "application_status": app.status,
        "applied_at": app.applied_at.isoformat() if app.applied_at else "",
        "job_id": app.job.id,
        "job_title": app.job.title,
        "avatar_url": getattr(dev, "avatar_url", ""),
    }


def _extract_job_data(job: Job) -> dict:
    """Format a Job record into a dict for the copilot."""
    return {
        "id": job.id,
        "title": job.title,
        "company_name": getattr(job.company, "company_name", "") or job.company.username,
        "tech_stack": job.tech_stack or [],
        "requirements": job.requirements or "",
        "description": job.description or "",
        "experience_level": getattr(job, "experience_level", ""),
        "job_type": getattr(job, "job_type", ""),
    }


class CopilotViewSet(viewsets.ViewSet):
    """
    AI Recruiter Copilot for Company Dashboards.
    Restricted strictly to company users.
    Only queries applicants who have applied to the company's posted jobs.
    """
    permission_classes = [permissions.IsAuthenticated]

    def _company_only(self, request):
        if getattr(request.user, "role", None) != "company":
            return Response(
                {"detail": "Only company accounts can access AI Recruiter Copilot."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    def _get_api_key(self) -> str:
        return getattr(settings, "GEMINI_API_KEY", "")

    # ── POST /api/copilot/search/ ────────────────────────────────────────────

    @action(detail=False, methods=["post"], url_path="search")
    def search(self, request):
        """
        Natural-language search across company's applicants.
        """
        err = self._company_only(request)
        if err:
            return err

        serializer = CopilotSearchSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        query = serializer.validated_data["query"]
        job_id = serializer.validated_data.get("job_id")

        # Fetch candidate applications belonging to this company
        qs = Application.objects.filter(
            job__company=request.user
        ).select_related("developer", "job").order_by("-applied_at")

        job_info = None
        if job_id:
            try:
                job = Job.objects.get(pk=job_id, company=request.user)
                qs = qs.filter(job=job)
                job_info = _extract_job_data(job)
            except Job.DoesNotExist:
                return Response({"detail": "Job not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        applications = list(qs[:50])
        candidates = [_extract_candidate_data(a) for a in applications]

        result = search_candidates(
            query=query,
            candidates=candidates,
            job_info=job_info,
            api_key=self._get_api_key(),
        )

        return Response(result, status=status.HTTP_200_OK)

    # ── POST /api/copilot/candidate-summary/ ─────────────────────────────────

    @action(detail=False, methods=["post"], url_path="candidate-summary")
    def candidate_summary(self, request):
        """
        Generate executive candidate briefing for a job.
        """
        err = self._company_only(request)
        if err:
            return err

        serializer = CopilotSummarySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        app_id = serializer.validated_data["application_id"]
        try:
            app = Application.objects.select_related("developer", "job", "job__company").get(
                pk=app_id, job__company=request.user
            )
        except Application.DoesNotExist:
            return Response({"detail": "Application not found."}, status=status.HTTP_404_NOT_FOUND)

        candidate = _extract_candidate_data(app)
        job_info = _extract_job_data(app.job)

        summary = summarize_candidate(
            candidate=candidate,
            job_info=job_info,
            api_key=self._get_api_key(),
        )

        return Response(summary, status=status.HTTP_200_OK)

    # ── POST /api/copilot/compare/ ───────────────────────────────────────────

    @action(detail=False, methods=["post"], url_path="compare")
    def compare(self, request):
        """
        Compare 2-4 candidates side-by-side for a specific job.
        """
        err = self._company_only(request)
        if err:
            return err

        serializer = CopilotCompareSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        app_ids = serializer.validated_data["application_ids"]
        job_id = serializer.validated_data.get("job_id")

        apps = list(Application.objects.filter(
            pk__in=app_ids, job__company=request.user
        ).select_related("developer", "job"))

        if len(apps) < 2:
            return Response(
                {"detail": "At least 2 authorized candidate applications are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Context job
        if job_id:
            try:
                job = Job.objects.get(pk=job_id, company=request.user)
            except Job.DoesNotExist:
                job = apps[0].job
        else:
            job = apps[0].job

        candidates = [_extract_candidate_data(a) for a in apps]
        job_info = _extract_job_data(job)

        comparison = compare_candidates(
            candidates=candidates,
            job_info=job_info,
            api_key=self._get_api_key(),
        )

        return Response(comparison, status=status.HTTP_200_OK)

    # ── POST /api/copilot/interview-questions/ ───────────────────────────────

    @action(detail=False, methods=["post"], url_path="interview-questions")
    def interview_questions(self, request):
        """
        Generate tailored technical & behavioral interview questions for an applicant.
        """
        err = self._company_only(request)
        if err:
            return err

        serializer = CopilotInterviewQuestionsSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        app_id = serializer.validated_data["application_id"]
        try:
            app = Application.objects.select_related("developer", "job").get(
                pk=app_id, job__company=request.user
            )
        except Application.DoesNotExist:
            return Response({"detail": "Application not found."}, status=status.HTTP_404_NOT_FOUND)

        candidate = _extract_candidate_data(app)
        job_info = _extract_job_data(app.job)

        questions = generate_interview_questions(
            candidate=candidate,
            job_info=job_info,
            api_key=self._get_api_key(),
        )

        return Response(questions, status=status.HTTP_200_OK)

    # ── POST /api/copilot/draft-message/ ─────────────────────────────────────

    @action(detail=False, methods=["post"], url_path="draft-message")
    def draft_message(self, request):
        """
        Draft personalized recruiter outreach, invitation, or follow-up note.
        """
        err = self._company_only(request)
        if err:
            return err

        serializer = CopilotDraftMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        app_id = serializer.validated_data["application_id"]
        msg_type = serializer.validated_data.get("message_type", "interview_invite")
        extra_details = serializer.validated_data.get("extra_details", "")

        try:
            app = Application.objects.select_related("developer", "job").get(
                pk=app_id, job__company=request.user
            )
        except Application.DoesNotExist:
            return Response({"detail": "Application not found."}, status=status.HTTP_404_NOT_FOUND)

        candidate = _extract_candidate_data(app)
        job_info = _extract_job_data(app.job)

        draft = draft_recruiter_message(
            candidate=candidate,
            job_info=job_info,
            message_type=msg_type,
            extra_details=extra_details,
            api_key=self._get_api_key(),
        )

        return Response(draft, status=status.HTTP_200_OK)
