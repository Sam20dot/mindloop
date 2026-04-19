import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='WeeklyChallenge',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('target_sessions', models.IntegerField()),
                ('bonus_points', models.IntegerField()),
                ('week_start', models.DateField()),
                ('week_end', models.DateField()),
                ('is_active', models.BooleanField(default=True)),
            ],
        ),
        migrations.CreateModel(
            name='UserChallengeProgress',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('completed_sessions', models.IntegerField(default=0)),
                ('bonus_awarded', models.BooleanField(default=False)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('challenge', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_progress', to='challenges.weeklychallenge')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='challenge_progress', to=settings.AUTH_USER_MODEL)),
            ],
            options={'unique_together': {('user', 'challenge')}},
        ),
    ]
