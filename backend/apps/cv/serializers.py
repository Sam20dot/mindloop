from rest_framework import serializers
from .models import CVEntry


class CVEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = CVEntry
        fields = ('id', 'summary', 'content', 'generated_at')
        read_only_fields = ('id', 'generated_at')
