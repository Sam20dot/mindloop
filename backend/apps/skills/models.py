import uuid
from django.db import models
from django.conf import settings


class Skill(models.Model):
    LEVEL_CHOICES = [('beginner', 'Beginner'), ('intermediate', 'Intermediate'), ('advanced', 'Advanced')]
    SOURCE_CHOICES = [('learning', 'Learning'), ('manual', 'Manual')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='skills')
    name = models.CharField(max_length=255)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='beginner')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='learning')
    earned_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.name} ({self.level}) — {self.user.email}'
