# pyrefly: ignore [missing-import]
from rest_framework import viewsets, permissions, status
# pyrefly: ignore [missing-import]
from rest_framework.decorators import action
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
from .models import Application
from .serializers import ApplicationSerializer, ApplicationCreateSerializer, ApplicationStatusSerializer

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
           log_activity(
               self.request.user,
               category='application',
               action='application_submitted',
               message=f"Applied to {application.job.title}",
               metadata={'job_id': application.job_id, 'application_id': application.id},
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

           return Response(serializer.data)