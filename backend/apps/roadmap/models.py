import uuid
from django.db import models
from django.conf import settings


class Roadmap(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='roadmaps')
    skill_name = models.CharField(max_length=255)
    steps = models.JSONField(default=list)
    projects = models.JSONField(default=list)
    resources = models.JSONField(default=list)
    estimated_weeks = models.IntegerField(default=0)
    completed_steps = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.skill_name} roadmap for {self.user.email}'
