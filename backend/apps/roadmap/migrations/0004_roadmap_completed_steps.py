from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('roadmap', '0003_roadmap_estimated_weeks'),
    ]

    operations = [
        migrations.AddField(
            model_name='roadmap',
            name='completed_steps',
            field=models.JSONField(default=list),
        ),
    ]
