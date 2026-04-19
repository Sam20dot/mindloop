from rest_framework import serializers
from .models import LearningSession


class LearningSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningSession
        fields = ('id', 'topic', 'material_text', 'status', 'started_at', 'completed_at')
        read_only_fields = ('id', 'status', 'started_at', 'completed_at')


class StartSessionSerializer(serializers.Serializer):
    topic = serializers.CharField(max_length=255)
    material_text = serializers.CharField()
