# pyrefly: ignore [missing-import]
from rest_framework import viewsets, permissions, status
# pyrefly: ignore [missing-import]
from rest_framework.decorators import action
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
   # pyrefly: ignore [missing-import]
from .models import Job
from .serializers import JobSerializer, JobCreateSerializer
from .filters import JobFilter

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
       ordering_fields = ['created_at', 'salary_min']

       def get_serializer_class(self):
           if self.action in ['create', 'update', 'partial_update']:
               return JobCreateSerializer
           return JobSerializer

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
               serializer = JobSerializer(page, many=True)
               return self.get_paginated_response(serializer.data)
           serializer = JobSerializer(jobs, many=True)
           return Response(serializer.data)