# pyrefly: ignore [missing-import]
from django.urls import path
from .views import CareerViewSet

career_view = CareerViewSet.as_view({
    'get': 'list_roadmaps',
})

urlpatterns = [
    # Generate a new roadmap
    path('career/analyze/', CareerViewSet.as_view({'post': 'analyze'}), name='career-analyze'),
    # List all roadmaps
    path('career/roadmaps/', CareerViewSet.as_view({'get': 'list_roadmaps'}), name='career-roadmaps-list'),
    # Single roadmap detail
    path('career/roadmaps/<int:pk>/detail/', CareerViewSet.as_view({'get': 'roadmap_detail'}), name='career-roadmap-detail'),
    # Delete a roadmap
    path('career/roadmaps/<int:pk>/delete/', CareerViewSet.as_view({'delete': 'roadmap_delete'}), name='career-roadmap-delete'),
    # Task completion
    path('career/tasks/<int:pk>/complete/', CareerViewSet.as_view({'post': 'task_complete'}), name='career-task-complete'),
    path('career/tasks/<int:pk>/uncomplete/', CareerViewSet.as_view({'post': 'task_uncomplete'}), name='career-task-uncomplete'),
]
