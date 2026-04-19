import uuid
from django.db import models
from django.conf import settings


class JobListing(models.Model):
    TYPE_CHOICES = [
        ('internship',   'Internship'),
        ('freelance',    'Freelance'),
        ('entry-level',  'Entry Level'),
        ('full-time',    'Full Time'),
    ]

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title        = models.CharField(max_length=255)
    description  = models.TextField()
    requirements = models.TextField(blank=True)
    skill_tags   = models.JSONField(default=list)
    type         = models.CharField(max_length=30, choices=TYPE_CHOICES)
    location     = models.CharField(max_length=255, blank=True)
    is_remote    = models.BooleanField(default=False)
    posted_by    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='job_listings')
    deadline     = models.DateField(null=True, blank=True)
    is_active    = models.BooleanField(default=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Application(models.Model):
    STATUS_CHOICES = [
        ('pending',  'Pending'),
        ('reviewed', 'Reviewed'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job             = models.ForeignKey(JobListing, on_delete=models.CASCADE, related_name='applications')
    user            = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applications')
    cover_note      = models.TextField(blank=True)
    cv_snapshot     = models.JSONField(default=dict)
    ai_match_score  = models.IntegerField(default=0)
    ai_match_reason = models.TextField(blank=True)
    status          = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    applied_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-applied_at']
        unique_together = [('job', 'user')]

    def __str__(self):
        return f'{self.user.name} → {self.job.title}'
