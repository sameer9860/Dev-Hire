# pyrefly: ignore [missing-import]
from rest_framework import serializers
from .models import Application
from jobs.serializers import JobSerializer
from accounts.serializers import UserSerializer

class ApplicationSerializer(serializers.ModelSerializer):
   developer = UserSerializer(read_only=True)
   job = JobSerializer(read_only=True)

   class Meta:
        model = Application
        fields = '__all__'
        read_only_fields = ['developer', 'applied_at', 'updated_at']

class ApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ['job', 'cover_letter', 'resume_url']

class ApplicationStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ['status', 'notes']