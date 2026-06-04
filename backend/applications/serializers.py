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
        fields = ['id', 'job', 'cover_letter', 'resume_url', 'status', 'applied_at']
        read_only_fields = ['id', 'status', 'applied_at']

    def validate(self, attrs):
        request = self.context.get('request')
        if request and request.user:
            user = request.user
            job = attrs.get('job')
            if Application.objects.filter(developer=user, job=job).exists():
                raise serializers.ValidationError("You have already applied for this job.")
        return attrs

class ApplicationStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ['status', 'notes']