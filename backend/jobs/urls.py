# pyrefly: ignore [missing-import]
from rest_framework.routers import DefaultRouter
# pyrefly: ignore [missing-import]
from django.urls import path
from django.http import JsonResponse
from .views import JobViewSet
from .models import Job

def jobs_diagnostic(request):
    """Diagnostic endpoint to debug jobs endpoint issues."""
    try:
        count = Job.objects.count()
        first_job = Job.objects.first()
        return JsonResponse({
            "status": "success",
            "total_jobs": count,
            "first_job_id": first_job.id if first_job else None,
            "first_job_title": first_job.title if first_job else None,
        })
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "error": str(e),
        }, status=500)

router = DefaultRouter()
router.register(r'jobs', JobViewSet, basename='job')

urlpatterns = [
    path('jobs-diagnostic/', jobs_diagnostic),
] + router.urls
