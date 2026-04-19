import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

LEVEL_THRESHOLDS = [
    (2000, 'master'),
    (1000, 'expert'),
    (600,  'achiever'),
    (300,  'learner'),
    (100,  'explorer'),
    (0,    'beginner'),
]


def compute_level(points: int) -> str:
    for threshold, level in LEVEL_THRESHOLDS:
        if points >= threshold:
            return level
    return 'beginner'


class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None):
        if not email:
            raise ValueError('Email is required')
        user = self.model(email=self.normalize_email(email), name=name)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password):
        user = self.create_user(email, name, password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    points = models.IntegerField(default=0)
    level = models.CharField(max_length=50, default='beginner')

    # Streak tracking
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_session_date = models.DateField(null=True, blank=True)
    streak_freeze_used = models.BooleanField(default=False)
    streak_freeze_available = models.BooleanField(default=True)

    ROLE_CHOICES = [('student', 'Student'), ('admin', 'Admin')]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def __str__(self):
        return self.email

    def update_level(self):
        new_level = compute_level(self.points)
        if self.level != new_level:
            self.level = new_level
            self.save(update_fields=['level'])

    @property
    def initials(self):
        words = self.name.split()
        return ''.join(w[0].upper() for w in words[:2])


class Badge(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='badges')
    name = models.CharField(max_length=100)
    earned_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.name} — {self.user.email}'
