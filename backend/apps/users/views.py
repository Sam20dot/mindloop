from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, UserSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    from django.contrib.auth import authenticate
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(request, username=email, password=password)
    if user is None:
        return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user)
    return Response({
        'user': UserSerializer(user).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()
    except Exception:
        pass
    return Response({'message': 'Logged out successfully.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_points(request):
    return Response({'points': request.user.points, 'level': request.user.level})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_badges(request):
    from .serializers import BadgeSerializer
    badges = request.user.badges.all().order_by('-earned_at')
    return Response(BadgeSerializer(badges, many=True).data)


# ── Leaderboard ───────────────────────────────────────────────

def _entry(rank, user, score, current_user_id):
    return {
        'rank': rank,
        'user_id': str(user.id),
        'name': user.name,
        'initials': user.initials,
        'level': user.level,
        'value': score,
        'is_current_user': str(user.id) == str(current_user_id),
    }


def _week_start():
    today = timezone.now().date()
    return today - timedelta(days=today.weekday())


def _weekly_points(user, week_start):
    from apps.learning_sessions.models import LearningSession
    from apps.answers.models import Answer
    session_pts = LearningSession.objects.filter(
        user=user, status='completed', completed_at__date__gte=week_start
    ).count() * 20
    answer_pts = Answer.objects.filter(
        user=user, submitted_at__date__gte=week_start, score__gte=70
    ).count() * 10
    return session_pts + answer_pts


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leaderboard_points(request):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    top = User.objects.order_by('-points')[:20]
    return Response([_entry(i + 1, u, u.points, request.user.id) for i, u in enumerate(top)])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leaderboard_skills(request):
    from django.contrib.auth import get_user_model
    from django.db.models import Count
    User = get_user_model()
    top = User.objects.annotate(skill_count=Count('skills')).order_by('-skill_count')[:20]
    return Response([_entry(i + 1, u, u.skill_count, request.user.id) for i, u in enumerate(top)])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leaderboard_weekly(request):
    from django.contrib.auth import get_user_model
    from apps.learning_sessions.models import LearningSession
    User = get_user_model()

    ws = _week_start()
    active_ids = set(
        LearningSession.objects.filter(
            status='completed', completed_at__date__gte=ws
        ).values_list('user_id', flat=True)
    )
    if not active_ids:
        return Response([])

    ranked = sorted(
        [{'user': u, 'score': _weekly_points(u, ws)} for u in User.objects.filter(id__in=active_ids)],
        key=lambda x: x['score'],
        reverse=True,
    )[:20]
    return Response([_entry(i + 1, r['user'], r['score'], request.user.id) for i, r in enumerate(ranked)])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leaderboard_me(request):
    from django.contrib.auth import get_user_model
    from django.db.models import Count
    from apps.skills.models import Skill
    from apps.learning_sessions.models import LearningSession
    User = get_user_model()

    user = request.user
    ws = _week_start()

    points_rank = User.objects.filter(points__gt=user.points).count() + 1

    my_skills = Skill.objects.filter(user=user).count()
    skills_rank = User.objects.annotate(sc=Count('skills')).filter(sc__gt=my_skills).count() + 1

    my_weekly = _weekly_points(user, ws)
    active_ids = set(
        LearningSession.objects.filter(
            status='completed', completed_at__date__gte=ws
        ).values_list('user_id', flat=True)
    )
    weekly_rank = sum(
        1 for u in User.objects.filter(id__in=active_ids).exclude(id=user.id)
        if _weekly_points(u, ws) > my_weekly
    ) + 1

    total_users = User.objects.count()
    return Response({
        'points_rank': points_rank,
        'points': user.points,
        'skills_rank': skills_rank,
        'skills_count': my_skills,
        'weekly_rank': weekly_rank,
        'weekly_points': my_weekly,
        'total_users': total_users,
    })
