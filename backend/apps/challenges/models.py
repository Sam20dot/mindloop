import uuid
from django.db import models
from django.conf import settings


class WeeklyChallenge(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    target_sessions = models.IntegerField()
    bonus_points = models.IntegerField()
    week_start = models.DateField()
    week_end = models.DateField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.title} ({self.week_start})'


class UserChallengeProgress(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='challenge_progress')
    challenge = models.ForeignKey(WeeklyChallenge, on_delete=models.CASCADE, related_name='user_progress')
    completed_sessions = models.IntegerField(default=0)
    bonus_awarded = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [('user', 'challenge')]

    def __str__(self):
        return f'{self.user.name} — {self.challenge.title} ({self.completed_sessions}/{self.challenge.target_sessions})'
