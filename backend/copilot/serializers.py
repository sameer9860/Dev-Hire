from rest_framework import serializers


class CopilotSearchSerializer(serializers.Serializer):
    query = serializers.CharField(max_length=500, required=True)
    job_id = serializers.IntegerField(required=False, allow_null=True)


class CopilotSummarySerializer(serializers.Serializer):
    application_id = serializers.IntegerField(required=True)


class CopilotCompareSerializer(serializers.Serializer):
    application_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=2,
        max_length=4,
        required=True,
    )
    job_id = serializers.IntegerField(required=False, allow_null=True)


class CopilotInterviewQuestionsSerializer(serializers.Serializer):
    application_id = serializers.IntegerField(required=True)


class CopilotDraftMessageSerializer(serializers.Serializer):
    application_id = serializers.IntegerField(required=True)
    message_type = serializers.ChoiceField(
        choices=['interview_invite', 'technical_screen', 'follow_up', 'rejection_polite'],
        default='interview_invite',
    )
    extra_details = serializers.CharField(max_length=1000, required=False, allow_blank=True)
