from rest_framework import serializers
from .models import Skill


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ('id', 'name', 'level', 'source', 'earned_at')
        read_only_fields = ('id', 'source', 'earned_at')


class AddSkillSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    level = serializers.ChoiceField(choices=['beginner', 'intermediate', 'advanced'])
