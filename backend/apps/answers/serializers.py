from rest_framework import serializers
from .models import Answer


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ('id', 'question_id', 'user_response', 'score', 'feedback', 'submitted_at')
        read_only_fields = ('id', 'score', 'feedback', 'submitted_at')


class SubmitAnswerSerializer(serializers.Serializer):
    question_id = serializers.UUIDField()
    user_response = serializers.CharField()
