import uuid
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('opportunities', '0003_opportunityview'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Add match_score to MatchedOpportunity
        migrations.AddField(
            model_name='matchedopportunity',
            name='match_score',
            field=models.IntegerField(default=0),
        ),
        # Add opportunity FK to MatchedOpportunity
        migrations.AddField(
            model_name='matchedopportunity',
            name='opportunity',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='matches',
                to='opportunities.opportunity',
            ),
        ),
        # Update MatchedOpportunity ordering
        migrations.AlterModelOptions(
            name='matchedopportunity',
            options={'ordering': ['-match_score', '-generated_at']},
        ),
        # Create SavedOpportunity
        migrations.CreateModel(
            name='SavedOpportunity',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('saved_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('opportunity', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='saves', to='opportunities.opportunity')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='saved_opportunities', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-saved_at'],
                'unique_together': {('user', 'opportunity')},
            },
        ),
    ]
