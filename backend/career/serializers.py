# pyrefly: ignore [missing-import]
from rest_framework import serializers
from .models import Roadmap, RoadmapTask


class RoadmapTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoadmapTask
        fields = [
            'id', 'title', 'description', 'category',
            'resource_url', 'week', 'order',
            'is_completed', 'completed_at',
        ]
        read_only_fields = ['id', 'completed_at']


class RoadmapSerializer(serializers.ModelSerializer):
    tasks = RoadmapTaskSerializer(many=True, read_only=True)
    completion_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = Roadmap
        fields = [
            'id', 'target_role', 'duration_days', 'skill_gaps',
            'summary', 'ai_enhanced', 'is_active',
            'completion_percent', 'tasks',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'ai_enhanced', 'skill_gaps', 'summary', 'created_at', 'updated_at']


class RoadmapListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing roadmaps (no tasks)."""
    completion_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = Roadmap
        fields = [
            'id', 'target_role', 'duration_days', 'skill_gaps',
            'summary', 'ai_enhanced', 'is_active',
            'completion_percent', 'created_at', 'updated_at',
        ]
