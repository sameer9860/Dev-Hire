from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CopilotViewSet

router = DefaultRouter()
router.register(r'copilot', CopilotViewSet, basename='copilot')

urlpatterns = [
    path('', include(router.urls)),
]
