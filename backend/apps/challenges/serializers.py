from rest_framework import serializers
from .models import WeeklyChallenge, UserChallengeProgress


class WeeklyChallengeSerializer(serializers.ModelSerializer):
    completed_sessions = serializers.SerializerMethodField()
    bonus_awarded = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyChallenge
        fields = [
            'id', 'title', 'description', 'target_sessions',
            'bonus_points', 'week_start', 'week_end',
            'completed_sessions', 'bonus_awarded',
        ]

    def get_completed_sessions(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        prog = UserChallengeProgress.objects.filter(user=request.user, challenge=obj).first()
        return prog.completed_sessions if prog else 0

    def get_bonus_awarded(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        prog = UserChallengeProgress.objects.filter(user=request.user, challenge=obj).first()
        return prog.bonus_awarded if prog else False
