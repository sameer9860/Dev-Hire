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
           serializer.save(developer=self.request.user)

       @action(detail=True, methods=['patch'], url_path='status')
       def update_status(self, request, pk=None):
           application = self.get_object()
           if application.job.company != request.user:
               return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
           serializer = ApplicationStatusSerializer(application, data=request.data, partial=True)
           serializer.is_valid(raise_exception=True)
           serializer.save()
           return Response(serializer.data)