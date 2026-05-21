   # pyrefly: ignore [missing-import]
from rest_framework import serializers
   # pyrefly: ignore [missing-import]
from .models import Job
from accounts.serializers import UserSerializer

class JobSerializer(serializers.ModelSerializer):
       company = UserSerializer(read_only=True)
       application_count = serializers.SerializerMethodField()

       class Meta:
           model = Job
           fields = '__all__'
           read_only_fields = ['company', 'created_at', 'updated_at']

       def get_application_count(self, obj):
           return obj.applications.count()

class JobCreateSerializer(serializers.ModelSerializer):
       class Meta:
           model = Job
           exclude = ['company', 'created_at', 'updated_at']