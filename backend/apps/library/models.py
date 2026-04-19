import uuid
from django.db import models
from django.conf import settings


class Material(models.Model):
    TYPE_CHOICES = [
        ('pdf',      'PDF'),
        ('docx',     'DOCX'),
        ('text',     'Text'),
        ('url',      'URL'),
        ('youtube',  'YouTube'),
    ]

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user         = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='materials')
    title        = models.CharField(max_length=255)
    type         = models.CharField(max_length=20, choices=TYPE_CHOICES)
    content_text = models.TextField(blank=True)
    file_path    = models.CharField(max_length=500, blank=True)
    source_url   = models.CharField(max_length=1000, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.type}) — {self.user.email}'
