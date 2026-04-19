from rest_framework import serializers
from .models import Opportunity, MatchedOpportunity, SavedOpportunity


class OpportunitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Opportunity
        fields = ['id', 'title', 'type', 'skill_tags', 'description', 'source_url', 'posted_at']


class MatchedOpportunitySerializer(serializers.ModelSerializer):
    opportunity_id = serializers.SerializerMethodField()
    source_url = serializers.SerializerMethodField()
    skill_tags = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = MatchedOpportunity
        fields = [
            'id', 'opportunity_id', 'title', 'type', 'match_score',
            'match_reason', 'action_steps', 'source_url', 'skill_tags',
            'description', 'is_saved', 'generated_at',
        ]

    def get_opportunity_id(self, obj):
        return str(obj.opportunity.id) if obj.opportunity else None

    def get_source_url(self, obj):
        return obj.opportunity.source_url if obj.opportunity else ''

    def get_skill_tags(self, obj):
        return obj.opportunity.skill_tags if obj.opportunity else []

    def get_description(self, obj):
        return obj.opportunity.description if obj.opportunity else ''

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if not request or not obj.opportunity_id:
            return False
        saved_ids = self._get_saved_ids(request)
        return obj.opportunity_id in saved_ids

    @staticmethod
    def _get_saved_ids(request):
        if not hasattr(request, '_saved_opp_ids'):
            request._saved_opp_ids = set(
                SavedOpportunity.objects.filter(user=request.user).values_list('opportunity_id', flat=True)
            )
        return request._saved_opp_ids


class SavedOpportunitySerializer(serializers.ModelSerializer):
    opportunity_id = serializers.UUIDField(source='opportunity.id')
    title = serializers.CharField(source='opportunity.title')
    type = serializers.CharField(source='opportunity.type')
    skill_tags = serializers.JSONField(source='opportunity.skill_tags')
    description = serializers.CharField(source='opportunity.description')
    source_url = serializers.URLField(source='opportunity.source_url')

    class Meta:
        model = SavedOpportunity
        fields = ['id', 'opportunity_id', 'title', 'type', 'skill_tags', 'description', 'source_url', 'saved_at']
