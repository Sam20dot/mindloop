import logging
from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.skills.models import Skill
from apps.users.models import Badge
from .models import Opportunity, MatchedOpportunity, SavedOpportunity, OpportunityView
from .serializers import OpportunitySerializer, MatchedOpportunitySerializer, SavedOpportunitySerializer

logger = logging.getLogger(__name__)

CACHE_HOURS = 24


def _build_matches(request):
    """
    Calls Claude to match user skills against all DB opportunities.
    Returns (list[MatchedOpportunity], error_response | None).
    """
    user = request.user
    skills = list(Skill.objects.filter(user=user).values('name', 'level'))

    if not skills:
        return None, Response(
            {'error': 'Complete at least one learning session to get matched opportunities.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    opportunities_qs = Opportunity.objects.all()
    if not opportunities_qs.exists():
        return None, Response(
            {'error': 'No opportunities available yet. Please check back later.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    opportunities_for_ai = [
        {
            'id': str(o.id),
            'title': o.title,
            'type': o.type,
            'skill_tags': o.skill_tags,
            'description': o.description,
        }
        for o in opportunities_qs
    ]

    try:
        from ai.opportunity_matcher import match_opportunities as ai_match
        result = ai_match(
            user_skills=skills,
            user_level=user.level,
            user_points=user.points,
            opportunities=opportunities_for_ai,
        )
    except ValueError as e:
        logger.error('Opportunity matching ValueError for user %s: %s', user.email, e)
        return None, Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)
    except Exception as e:
        logger.error('Opportunity matching exception for user %s: %s', user.email, e)
        return None, Response({'error': 'AI service unavailable. Please try again.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    opp_lookup = {str(o.id): o for o in opportunities_qs}
    MatchedOpportunity.objects.filter(user=user).delete()

    saved = []
    for match in result.get('matches', []):
        opp_id = str(match.get('opportunity_id', ''))
        opp_obj = opp_lookup.get(opp_id)
        if not opp_obj:
            continue
        opp_type = opp_obj.type
        if opp_type not in ('freelance', 'internship', 'entry-level'):
            opp_type = 'entry-level'
        entry = MatchedOpportunity.objects.create(
            user=user,
            opportunity=opp_obj,
            title=opp_obj.title,
            type=opp_type,
            match_score=max(0, min(100, int(match.get('match_score', 0)))),
            match_reason=match.get('match_reason', ''),
            action_steps=match.get('action_steps', []) if isinstance(match.get('action_steps'), list) else [],
        )
        saved.append(entry)

    saved.sort(key=lambda x: x.match_score, reverse=True)
    return saved, None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_opportunities(request):
    opportunities = Opportunity.objects.all().order_by('-posted_at')
    return Response(OpportunitySerializer(opportunities, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def match_opportunities(request):
    user = request.user
    skills = list(Skill.objects.filter(user=user).values('name', 'level'))

    if not skills:
        return Response(
            {'error': 'Complete at least one learning session to get matched opportunities.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 24-hour cache
    latest = MatchedOpportunity.objects.filter(user=user).order_by('-generated_at').first()
    if latest and (timezone.now() - latest.generated_at) < timedelta(hours=CACHE_HOURS):
        cached = MatchedOpportunity.objects.filter(user=user).order_by('-match_score')
        return Response({
            'opportunities': MatchedOpportunitySerializer(cached, many=True, context={'request': request}).data,
            'cached': True,
        })

    matched, error = _build_matches(request)
    if error:
        return error

    return Response({
        'opportunities': MatchedOpportunitySerializer(matched, many=True, context={'request': request}).data,
        'cached': False,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refresh_matches(request):
    matched, error = _build_matches(request)
    if error:
        return error

    return Response({
        'opportunities': MatchedOpportunitySerializer(matched, many=True, context={'request': request}).data,
        'cached': False,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def opportunity_stats(request):
    user = request.user
    return Response({
        'matched_count': MatchedOpportunity.objects.filter(user=user).count(),
        'saved_count': SavedOpportunity.objects.filter(user=user).count(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def saved_opportunities(request):
    saved = SavedOpportunity.objects.filter(user=request.user).select_related('opportunity')
    return Response(SavedOpportunitySerializer(saved, many=True).data)


@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def save_opportunity(request, opportunity_id):
    try:
        opp = Opportunity.objects.get(id=opportunity_id)
    except Opportunity.DoesNotExist:
        return Response({'error': 'Opportunity not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'POST':
        _, created = SavedOpportunity.objects.get_or_create(user=request.user, opportunity=opp)
        return Response({'saved': True, 'created': created})

    SavedOpportunity.objects.filter(user=request.user, opportunity=opp).delete()
    return Response({'saved': False})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def skill_gap_analysis(request):
    user = request.user
    skills = list(Skill.objects.filter(user=user).values('name', 'level'))
    all_tags = list(Opportunity.objects.values_list('skill_tags', flat=True))

    try:
        from ai.skill_gap_analyzer import analyze_skill_gaps
        result = analyze_skill_gaps(user_skills=skills, all_skill_tags=all_tags)
    except ValueError as e:
        logger.error('Skill gap analysis ValueError for user %s: %s', user.email, e)
        return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)
    except Exception as e:
        logger.error('Skill gap analysis exception for user %s: %s', user.email, e)
        return Response({'error': 'AI service unavailable. Please try again.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    return Response(result)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_opportunity_view(request, opportunity_id):
    user = request.user
    _, created = OpportunityView.objects.get_or_create(
        user=user,
        opportunity_id=opportunity_id,
    )

    new_badge = None
    if created:
        view_count = OpportunityView.objects.filter(user=user).count()
        badge_name = 'Opportunity Seeker'
        if view_count >= 10 and not Badge.objects.filter(user=user, name=badge_name).exists():
            Badge.objects.create(user=user, name=badge_name)
            new_badge = badge_name

    return Response({'viewed': True, 'new_badge': new_badge})
