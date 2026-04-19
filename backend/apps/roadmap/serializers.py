from rest_framework import serializers
from .models import Roadmap


class RoadmapSerializer(serializers.ModelSerializer):
    class Meta:
        model = Roadmap
        fields = ('id', 'skill_name', 'steps', 'projects', 'resources', 'estimated_weeks', 'completed_steps', 'created_at')
        read_only_fields = ('id', 'created_at')


class GenerateRoadmapSerializer(serializers.Serializer):
    skill_name = serializers.CharField(max_length=255)
