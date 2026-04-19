from rest_framework import serializers
from .models import JobListing, Application


class JobListingSerializer(serializers.ModelSerializer):
    posted_by_name = serializers.SerializerMethodField()
    application_count = serializers.SerializerMethodField()

    class Meta:
        model = JobListing
        fields = (
            'id', 'title', 'description', 'requirements', 'skill_tags',
            'type', 'location', 'is_remote', 'posted_by_name',
            'deadline', 'is_active', 'created_at', 'application_count',
        )
        read_only_fields = ('id', 'created_at', 'posted_by_name', 'application_count')

    def get_posted_by_name(self, obj):
        return obj.posted_by.name

    def get_application_count(self, obj):
        return obj.applications.count()


class ApplicationSerializer(serializers.ModelSerializer):
    job_title = serializers.SerializerMethodField()
    job_type  = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = (
            'id', 'job', 'job_title', 'job_type',
            'cover_note', 'cv_snapshot',
            'ai_match_score', 'ai_match_reason',
            'status', 'applied_at',
        )
        read_only_fields = ('id', 'cv_snapshot', 'ai_match_score', 'ai_match_reason', 'applied_at', 'job_title', 'job_type')

    def get_job_title(self, obj):
        return obj.job.title

    def get_job_type(self, obj):
        return obj.job.type


class ApplicationAdminSerializer(serializers.ModelSerializer):
    """Full serializer for admin view with applicant info."""
    applicant_name  = serializers.SerializerMethodField()
    applicant_email = serializers.SerializerMethodField()
    applicant_level = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = (
            'id', 'applicant_name', 'applicant_email', 'applicant_level',
            'cover_note', 'cv_snapshot',
            'ai_match_score', 'ai_match_reason',
            'status', 'applied_at',
        )

    def get_applicant_name(self, obj):
        return obj.user.name

    def get_applicant_email(self, obj):
        return obj.user.email

    def get_applicant_level(self, obj):
        return obj.user.level
