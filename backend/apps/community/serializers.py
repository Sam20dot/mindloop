from rest_framework import serializers
from .models import Post


class PostSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_level = serializers.CharField(source='user.level', read_only=True)
    user_initials = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'user_name', 'user_level', 'user_initials',
            'type', 'content', 'like_count', 'is_liked', 'created_at',
        ]

    def get_user_initials(self, obj):
        return obj.user.initials

    def get_like_count(self, obj):
        return obj.likes.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        if not hasattr(request, '_liked_post_ids'):
            request._liked_post_ids = set(
                request.user.post_likes.values_list('post_id', flat=True)
            )
        return obj.id in request._liked_post_ids
