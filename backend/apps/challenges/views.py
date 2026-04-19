from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import WeeklyChallenge
from .serializers import WeeklyChallengeSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_challenge(request):
    today = timezone.now().date()
    challenge = WeeklyChallenge.objects.filter(
        is_active=True,
        week_start__lte=today,
        week_end__gte=today,
    ).first()

    if not challenge:
        return Response({'challenge': None})

    return Response({
        'challenge': WeeklyChallengeSerializer(challenge, context={'request': request}).data
    })
