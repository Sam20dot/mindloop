import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class Opportunity(models.Model):
    TYPE_CHOICES = [
        ('freelance', 'Freelance'),
        ('internship', 'Internship'),
        ('entry-level', 'Entry Level'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    skill_tags = models.JSONField(default=list)
    description = models.TextField()
    source_url = models.URLField(blank=True)
    posted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class MatchedOpportunity(models.Model):
    TYPE_CHOICES = [
        ('freelance', 'Freelance'),
        ('internship', 'Internship'),
        ('entry-level', 'Entry Level'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='matched_opportunities')
    opportunity = models.ForeignKey(Opportunity, null=True, blank=True, on_delete=models.SET_NULL, related_name='matches')
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    match_score = models.IntegerField(default=0)
    match_reason = models.TextField()
    action_steps = models.JSONField(default=list)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-match_score', '-generated_at']

    def __str__(self):
        return f'{self.title} ({self.user}) — {self.match_score}%'


class SavedOpportunity(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_opportunities')
    opportunity = models.ForeignKey(Opportunity, on_delete=models.CASCADE, related_name='saves')
    saved_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = [('user', 'opportunity')]
        ordering = ['-saved_at']

    def __str__(self):
        return f'{self.user} saved {self.opportunity.title}'


class OpportunityView(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='opportunity_views')
    opportunity_id = models.UUIDField()
    viewed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = [('user', 'opportunity_id')]

    def __str__(self):
        return f'{self.user} viewed {self.opportunity_id}'
