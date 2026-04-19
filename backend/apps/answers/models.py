import uuid
from django.db import models
from django.conf import settings


class Answer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey('questions.Question', on_delete=models.CASCADE, related_name='answers')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='answers')
    user_response = models.TextField()
    score = models.IntegerField(default=0)
    feedback = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Answer by {self.user.email} — score: {self.score}'
