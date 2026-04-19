from rest_framework import serializers
from .models import Question


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ('id', 'text', 'difficulty', 'question_type', 'correct_answer')
        read_only_fields = ('id',)


class GenerateQuestionsSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    difficulty = serializers.ChoiceField(
        choices=['easy', 'medium', 'critical', 'mixed'],
        default='mixed',
    )
