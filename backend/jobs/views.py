# pyrefly: ignore [missing-import]
from rest_framework import viewsets, permissions
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