from datetime import date, timedelta
from django.core.management.base import BaseCommand
from apps.challenges.models import WeeklyChallenge


class Command(BaseCommand):
    help = 'Create or refresh the weekly challenge for the current week'

    def handle(self, *args, **options):
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)

        challenge, created = WeeklyChallenge.objects.get_or_create(
            week_start=week_start,
            defaults={
                'title': 'Complete 5 Sessions This Week',
                'description': (
                    'Finish 5 learning sessions by Sunday to earn 100 bonus points '
                    'and unlock the Consistent Student achievement!'
                ),
                'target_sessions': 5,
                'bonus_points': 100,
                'week_end': week_end,
                'is_active': True,
            },
        )

        verb = 'Created' if created else 'Already exists'
        self.stdout.write(self.style.SUCCESS(
            f'{verb}: "{challenge.title}" ({week_start} → {week_end})'
        ))
