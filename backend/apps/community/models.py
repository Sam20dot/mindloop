import uuid
from django.db import models
from django.conf import settings


class Post(models.Model):
    TYPE_CHOICES = [
        ('achievement',       'Achievement'),
        ('cv_share',          'CV Share'),
        ('opportunity_share', 'Opportunity Share'),
        ('learning_update',   'Learning Update'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='learning_update')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.name}: {self.content[:60]}'


class PostLike(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='post_likes')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('user', 'post')]

    def __str__(self):
        return f'{self.user.name} liked post {self.post.id}'
