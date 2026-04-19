import logging

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.skills.models import Skill
from apps.learning_sessions.models import LearningSession
from apps.users.models import Badge
from .models import CVEntry
from .serializers import CVEntrySerializer

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_cv(request):
    user = request.user

    skills = list(Skill.objects.filter(user=user).values('name', 'level'))
    sessions = list(
        LearningSession.objects.filter(user=user)
        .values('topic', 'status')
        .order_by('-started_at')[:20]
    )
    badges = list(Badge.objects.filter(user=user).values('name'))

    if not skills and not any(s['status'] == 'completed' for s in sessions):
        return Response(
            {'error': 'Complete at least one learning session first to generate your CV.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        from ai.cv_generator import generate_cv as ai_generate
        cv_data = ai_generate(
            user_name=user.name,
            skills=skills,
            session_history=sessions,
            badges=badges,
        )
    except ValueError as e:
        logger.error('CV generation ValueError for user %s: %s', user.email, e)
        return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)
    except Exception as e:
        logger.error('CV generation exception for user %s: %s', user.email, e)
        return Response({'error': 'AI service unavailable. Please try again.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    entry = CVEntry.objects.create(
        user=user,
        summary=cv_data.get('summary', ''),
        content=cv_data,
    )

    points_awarded = 0
    if CVEntry.objects.filter(user=user).count() == 1:
        user.points += 30
        user.save(update_fields=['points'])
        points_awarded = 30

    return Response({
        **CVEntrySerializer(entry).data,
        'points_awarded': points_awarded,
        'new_total_points': user.points,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_cv(request):
    """Always returns HTTP 200. Use exists flag to check whether a CV is available."""
    entry = CVEntry.objects.filter(user=request.user).order_by('-generated_at').first()
    if not entry:
        logger.debug('No CV found for user %s', request.user.email)
        return Response({'exists': False, 'cv': None})

    return Response({'exists': True, 'cv': CVEntrySerializer(entry).data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cv(request, user_id):
    """Legacy endpoint kept for compatibility."""
    if str(request.user.id) != str(user_id):
        return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

    entry = CVEntry.objects.filter(user=request.user).order_by('-generated_at').first()
    if not entry:
        return Response({'exists': False, 'cv': None})

    return Response({'exists': True, 'cv': CVEntrySerializer(entry).data})
