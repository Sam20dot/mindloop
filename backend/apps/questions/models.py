import uuid
from django.db import models


class Question(models.Model):
    DIFFICULTY_CHOICES = [('easy', 'Easy'), ('medium', 'Medium'), ('critical', 'Critical')]
    TYPE_CHOICES = [('multiple_choice', 'Multiple Choice'), ('open_ended', 'Open Ended')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey('learning_sessions.LearningSession', on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    question_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    correct_answer = models.TextField()

    def __str__(self):
        return self.text[:80]
