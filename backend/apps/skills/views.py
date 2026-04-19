from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Skill
from .serializers import AddSkillSerializer, SkillSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_skills(request):
    skills = Skill.objects.filter(user=request.user).order_by('-earned_at')
    return Response(SkillSerializer(skills, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_skill(request):
    serializer = AddSkillSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    name = serializer.validated_data['name']
    level = serializer.validated_data['level']

    # Avoid exact duplicates
    skill, created = Skill.objects.get_or_create(
        user=request.user,
        name__iexact=name,
        defaults={'name': name, 'level': level, 'source': 'manual'},
    )
    if not created:
        skill.level = level
        skill.save(update_fields=['level'])

    points_awarded = 0
    is_first = not Skill.objects.filter(user=request.user).exclude(id=skill.id).exists()
    if is_first and created:
        request.user.points += 50
        request.user.save(update_fields=['points'])
        points_awarded = 50
        _check_skill_builder_badge(request.user)

    return Response({
        'skill': SkillSerializer(skill).data,
        'points_awarded': points_awarded,
        'new_total_points': request.user.points,
    }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


def _check_skill_builder_badge(user):
    from apps.users.models import Badge
    if Badge.objects.filter(user=user, name='Skill Builder').exists():
        return
    if Skill.objects.filter(user=user).count() >= 5:
        Badge.objects.create(user=user, name='Skill Builder')
