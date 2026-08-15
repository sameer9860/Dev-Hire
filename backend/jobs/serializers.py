# pyrefly: ignore [missing-import]
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from .models import Job, SavedJob
from accounts.serializers import UserSerializer


class JobSerializer(serializers.ModelSerializer):
    company = UserSerializer(read_only=True)
    application_count = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = '__all__'
        read_only_fields = ['company', 'created_at', 'updated_at']

    def get_application_count(self, obj):
        if hasattr(obj, 'applications'):
            return obj.applications.count()
        return 0

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if getattr(request.user, 'role', None) != 'developer':
            return False
        return SavedJob.objects.filter(developer=request.user, job=obj).exists()


class JobCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        exclude = ['company', 'created_at', 'updated_at']


class SavedJobSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)
    job_id = serializers.PrimaryKeyRelatedField(
        queryset=Job.objects.all(),
        source='job',
        write_only=True,
    )

    class Meta:
        model = SavedJob
        fields = ['id', 'job', 'job_id', 'created_at']
        read_only_fields = ['id', 'created_at']
