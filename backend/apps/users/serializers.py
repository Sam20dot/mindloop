from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Badge

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'password')

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password'],
        )


class UserSerializer(serializers.ModelSerializer):
    badges = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'name', 'email', 'points', 'level', 'role',
            'current_streak', 'longest_streak',
            'created_at', 'badges',
        )
        read_only_fields = ('id', 'points', 'level', 'current_streak', 'longest_streak', 'created_at')

    def get_badges(self, obj):
        return BadgeSerializer(obj.badges.all(), many=True).data


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ('id', 'name', 'earned_at')


class LeaderboardEntrySerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    user_id = serializers.CharField()
    name = serializers.CharField()
    initials = serializers.CharField()
    level = serializers.CharField()
    score = serializers.IntegerField()
    is_current_user = serializers.BooleanField()
