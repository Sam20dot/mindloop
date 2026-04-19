from rest_framework import serializers
from .models import Material


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ('id', 'title', 'type', 'content_text', 'source_url', 'created_at')
        read_only_fields = ('id', 'created_at')


class MaterialListSerializer(serializers.ModelSerializer):
    """Lightweight list view — no content_text."""
    class Meta:
        model = Material
        fields = ('id', 'title', 'type', 'source_url', 'created_at')
        read_only_fields = ('id', 'created_at')
