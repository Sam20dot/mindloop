from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import JobListing, Application
from .serializers import JobListingSerializer, ApplicationSerializer, ApplicationAdminSerializer


def _require_admin(request):
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
    return None


# ── Public job listing endpoints ───────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_jobs(request):
    jobs = JobListing.objects.filter(is_active=True)
    return Response(JobListingSerializer(jobs, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def match_jobs(request):
    from apps.skills.models import Skill
    from ai.job_matcher import rank_jobs_for_user

    user_skills = list(Skill.objects.filter(user=request.user).values('name', 'level'))
    jobs_qs = JobListing.objects.filter(is_active=True)
    jobs_data = list(jobs_qs.values('id', 'title', 'type', 'requirements', 'skill_tags', 'location', 'is_remote', 'deadline'))

    if not user_skills:
        return Response({'results': [], 'message': 'Complete learning sessions to earn skills first.'})

    try:
        ranked = rank_jobs_for_user(user_skills, request.user.level, jobs_data)
    except Exception:
        return Response({'error': 'AI matching unavailable.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    return Response({'results': ranked})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_to_job(request, job_id):
    try:
        job = JobListing.objects.get(id=job_id, is_active=True)
    except JobListing.DoesNotExist:
        return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

    if Application.objects.filter(job=job, user=request.user).exists():
        return Response({'error': 'You have already applied to this job.'}, status=status.HTTP_400_BAD_REQUEST)

    cover_note = request.data.get('cover_note', '')

    # Snapshot CV
    from apps.cv.models import CVEntry
    cv_entry = CVEntry.objects.filter(user=request.user).order_by('-generated_at').first()
    cv_snapshot = cv_entry.content if cv_entry else {}

    # AI match score
    from apps.skills.models import Skill
    from ai.job_matcher import match_job
    user_skills = list(Skill.objects.filter(user=request.user).values('name', 'level'))
    try:
        match_result = match_job(
            user_skills=user_skills,
            user_level=request.user.level,
            job_title=job.title,
            job_requirements=job.requirements,
            job_skill_tags=job.skill_tags,
        )
    except Exception:
        match_result = {'match_score': 0, 'match_reason': 'Match score unavailable.'}

    app = Application.objects.create(
        job=job,
        user=request.user,
        cover_note=cover_note,
        cv_snapshot=cv_snapshot,
        ai_match_score=match_result.get('match_score', 0),
        ai_match_reason=match_result.get('match_reason', ''),
    )

    # +5 points for applying
    request.user.points += 5
    request.user.save(update_fields=['points'])
    request.user.update_level()

    return Response(ApplicationSerializer(app).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_applications(request):
    apps = Application.objects.filter(user=request.user).select_related('job')
    return Response(ApplicationSerializer(apps, many=True).data)


# ── Admin endpoints ────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_job(request):
    err = _require_admin(request)
    if err:
        return err

    serializer = JobListingSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    job = JobListing.objects.create(
        posted_by=request.user,
        title=request.data.get('title'),
        description=request.data.get('description', ''),
        requirements=request.data.get('requirements', ''),
        skill_tags=request.data.get('skill_tags', []),
        type=request.data.get('type', 'internship'),
        location=request.data.get('location', ''),
        is_remote=request.data.get('is_remote', False),
        deadline=request.data.get('deadline') or None,
    )
    return Response(JobListingSerializer(job).data, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_job(request, job_id):
    err = _require_admin(request)
    if err:
        return err

    try:
        job = JobListing.objects.get(id=job_id)
    except JobListing.DoesNotExist:
        return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        job.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # PATCH
    updatable = ('title', 'description', 'requirements', 'skill_tags', 'type', 'location', 'is_remote', 'deadline', 'is_active')
    for field in updatable:
        if field in request.data:
            setattr(job, field, request.data[field])
    job.save()
    return Response(JobListingSerializer(job).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def job_applications(request, job_id):
    err = _require_admin(request)
    if err:
        return err

    try:
        job = JobListing.objects.get(id=job_id)
    except JobListing.DoesNotExist:
        return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

    apps = job.applications.select_related('user').all()
    return Response(ApplicationAdminSerializer(apps, many=True).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_application_status(request, application_id):
    err = _require_admin(request)
    if err:
        return err

    try:
        app = Application.objects.get(id=application_id)
    except Application.DoesNotExist:
        return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    if new_status not in ('pending', 'reviewed', 'accepted', 'rejected'):
        return Response({'error': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)

    app.status = new_status
    app.save(update_fields=['status'])
    return Response(ApplicationAdminSerializer(app).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    err = _require_admin(request)
    if err:
        return err

    from django.db.models import Count
    total_jobs = JobListing.objects.count()
    active_jobs = JobListing.objects.filter(is_active=True).count()
    total_apps = Application.objects.count()
    pending_apps = Application.objects.filter(status='pending').count()

    return Response({
        'total_jobs': total_jobs,
        'active_jobs': active_jobs,
        'total_applications': total_apps,
        'pending_applications': pending_apps,
    })
