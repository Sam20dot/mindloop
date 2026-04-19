import uuid
from django.db import models
from django.conf import settings


class CVEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cv_entries')
    summary = models.TextField()
    content = models.JSONField(default=dict)  # full AI output: {summary, skills_section, achievements_section}
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'CV for {self.user.email} at {self.generated_at}'
