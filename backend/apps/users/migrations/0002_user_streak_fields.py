from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='current_streak',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='user',
            name='longest_streak',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='user',
            name='last_session_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='streak_freeze_used',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='user',
            name='streak_freeze_available',
            field=models.BooleanField(default=True),
        ),
    ]
