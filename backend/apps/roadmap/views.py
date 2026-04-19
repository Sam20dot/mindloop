from datetime import timezone as dt_timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Roadmap
from .serializers import GenerateRoadmapSerializer, RoadmapSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_roadmap(request):
    serializer = GenerateRoadmapSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    skill_name = serializer.validated_data['skill_name']
    user_level = request.user.level

    try:
        from ai.roadmap_generator import generate_roadmap as ai_generate
        roadmap_data = ai_generate(skill_name=skill_name, user_level=user_level)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)
    except Exception:
        return Response({'error': 'AI service unavailable. Please try again.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    roadmap = Roadmap.objects.create(
        user=request.user,
        skill_name=skill_name,
        steps=roadmap_data.get('steps', []),
        projects=roadmap_data.get('projects', []),
        resources=roadmap_data.get('resources', []),
        estimated_weeks=roadmap_data.get('estimated_weeks', 0),
    )

    return Response(RoadmapSerializer(roadmap).data, status=status.HTTP_201_CREATED)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_roadmap_step(request, roadmap_id):
    try:
        roadmap = Roadmap.objects.get(id=roadmap_id, user=request.user)
    except Roadmap.DoesNotExist:
        return Response({'error': 'Roadmap not found.'}, status=status.HTTP_404_NOT_FOUND)

    step_order = request.data.get('step_order')
    completed = request.data.get('completed')

    if step_order is None or completed is None:
        return Response({'error': 'step_order and completed are required.'}, status=status.HTTP_400_BAD_REQUEST)

    completed_steps = list(roadmap.completed_steps or [])
    if completed:
        if step_order not in completed_steps:
            completed_steps.append(step_order)
    else:
        completed_steps = [s for s in completed_steps if s != step_order]

    roadmap.completed_steps = completed_steps
    roadmap.save(update_fields=['completed_steps'])

    return Response({'completed_steps': roadmap.completed_steps})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_roadmaps(request, user_id):
    if str(request.user.id) != str(user_id):
        return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

    roadmaps = Roadmap.objects.filter(user=request.user).order_by('-created_at')
    return Response(RoadmapSerializer(roadmaps, many=True).data)


# ── Step status update ─────────────────────────────────────────

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_step_status(request):
    roadmap_id = request.data.get('roadmap_id')
    step_order = request.data.get('step_order')
    new_status = request.data.get('status')

    if not roadmap_id or step_order is None or not new_status:
        return Response({'error': 'roadmap_id, step_order, and status are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if new_status not in ('not_started', 'in_progress', 'completed'):
        return Response({'error': 'Invalid status value.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        roadmap = Roadmap.objects.get(id=roadmap_id, user=request.user)
    except Roadmap.DoesNotExist:
        return Response({'error': 'Roadmap not found.'}, status=status.HTTP_404_NOT_FOUND)

    steps = list(roadmap.steps)
    for step in steps:
        if step.get('order') == step_order:
            step['status'] = new_status
            break
    else:
        return Response({'error': 'Step not found.'}, status=status.HTTP_404_NOT_FOUND)

    roadmap.steps = steps
    roadmap.save(update_fields=['steps'])
    return Response(RoadmapSerializer(roadmap).data)


# ── Quiz question generation ───────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_step_quiz(request):
    roadmap_id = request.data.get('roadmap_id')
    step_order = request.data.get('step_order')

    if not roadmap_id or step_order is None:
        return Response({'error': 'roadmap_id and step_order are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        roadmap = Roadmap.objects.get(id=roadmap_id, user=request.user)
    except Roadmap.DoesNotExist:
        return Response({'error': 'Roadmap not found.'}, status=status.HTTP_404_NOT_FOUND)

    step = next((s for s in roadmap.steps if s.get('order') == step_order), None)
    if not step:
        return Response({'error': 'Step not found.'}, status=status.HTTP_404_NOT_FOUND)

    try:
        from ai.roadmap_verifier import generate_quiz_questions
        questions = generate_quiz_questions(
            step_title=step.get('title', ''),
            step_description=step.get('description', ''),
            skill_name=roadmap.skill_name,
        )
    except Exception:
        return Response({'error': 'AI service unavailable.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    return Response({'questions': questions})


# ── Step verification ──────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_step(request):
    roadmap_id = request.data.get('roadmap_id')
    step_order = request.data.get('step_order')
    verification_type = request.data.get('verification_type')
    proof = request.data.get('proof', '')
    quiz_answers = request.data.get('quiz_answers', [])

    if not roadmap_id or step_order is None or not verification_type:
        return Response({'error': 'roadmap_id, step_order, and verification_type are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        roadmap = Roadmap.objects.get(id=roadmap_id, user=request.user)
    except Roadmap.DoesNotExist:
        return Response({'error': 'Roadmap not found.'}, status=status.HTTP_404_NOT_FOUND)

    step = next((s for s in roadmap.steps if s.get('order') == step_order), None)
    if not step:
        return Response({'error': 'Step not found.'}, status=status.HTTP_404_NOT_FOUND)

    # ── Run AI verification ──────────────────────────────────
    try:
        result = _run_verification(verification_type, step, roadmap.skill_name, proof, quiz_answers)
    except Exception as e:
        return Response({'error': f'Verification failed: {str(e)}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    passed = result.get('passed', False)
    feedback = result.get('feedback', '')

    # Update step in JSONB
    from django.utils import timezone
    steps = list(roadmap.steps)
    for s in steps:
        if s.get('order') == step_order:
            s['verified'] = passed
            s['status'] = 'completed' if passed else s.get('status', 'in_progress')
            s['verified_at'] = timezone.now().isoformat() if passed else None
            s['proof_text'] = proof if verification_type in ('reflection', 'github') else None
            s['proof_url'] = proof if verification_type == 'github' else None
            break

    roadmap.steps = steps

    # Update completed_steps list for backward compat
    completed_steps = list(roadmap.completed_steps or [])
    if passed and step_order not in completed_steps:
        completed_steps.append(step_order)
        roadmap.completed_steps = completed_steps

    roadmap.save(update_fields=['steps', 'completed_steps'])

    points_awarded = 0
    new_badges = []

    if passed:
        user = request.user
        user.points += 30
        user.save(update_fields=['points'])
        user.update_level()
        points_awarded = 30

        # Auto-create skill
        _create_step_skill(user, roadmap.skill_name, step.get('title', ''), step_order)

        # Auto-regenerate CV
        try:
            _auto_cv(user)
        except Exception:
            pass

        # Badge checks
        new_badges = _check_badges(user)

    return Response({
        'passed': passed,
        'feedback': feedback,
        'roadmap': RoadmapSerializer(roadmap).data,
        'points_awarded': points_awarded,
        'new_badges': new_badges,
    })


# ── Helpers ────────────────────────────────────────────────────

def _run_verification(verification_type, step, skill_name, proof, quiz_answers):
    from ai.roadmap_verifier import evaluate_quiz, evaluate_github_proof, evaluate_reflection

    if verification_type == 'quiz':
        if not quiz_answers:
            raise ValueError('quiz_answers required for quiz verification')
        return evaluate_quiz(
            step_title=step.get('title', ''),
            questions_and_answers=quiz_answers,
        )
    elif verification_type == 'github':
        parts = proof.split('|||')
        repo_url = parts[0].strip()
        description = parts[1].strip() if len(parts) > 1 else ''
        return evaluate_github_proof(
            step_title=step.get('title', ''),
            step_description=step.get('description', ''),
            skill_name=skill_name,
            repo_url=repo_url,
            user_description=description,
        )
    elif verification_type == 'reflection':
        return evaluate_reflection(
            step_title=step.get('title', ''),
            step_description=step.get('description', ''),
            skill_name=skill_name,
            reflection_text=proof,
        )
    else:
        raise ValueError(f'Unknown verification_type: {verification_type}')


def _create_step_skill(user, skill_name, step_title, step_order):
    from apps.skills.models import Skill
    if step_order <= 3:
        level = 'beginner'
    elif step_order <= 7:
        level = 'intermediate'
    else:
        level = 'advanced'

    full_name = f'{skill_name} — {step_title}'
    Skill.objects.get_or_create(
        user=user,
        name__iexact=full_name,
        defaults={'name': full_name, 'level': level, 'source': 'roadmap'},
    )


def _auto_cv(user):
    from apps.skills.models import Skill
    from apps.users.models import Badge
    from apps.cv.models import CVEntry
    from apps.learning_sessions.models import LearningSession
    from ai.cv_generator import generate_cv

    skills = list(Skill.objects.filter(user=user).values('name', 'level'))
    sessions = list(LearningSession.objects.filter(user=user).values('topic', 'status').order_by('-started_at')[:20])
    badges = list(Badge.objects.filter(user=user).values('name'))

    cv_data = generate_cv(user_name=user.name, skills=skills, session_history=sessions, badges=badges)
    CVEntry.objects.create(user=user, summary=cv_data.get('summary', ''), content=cv_data)


def _check_badges(user):
    from apps.users.models import Badge
    from apps.skills.models import Skill
    new_badges = []
    if not Badge.objects.filter(user=user, name='Skill Builder').exists():
        if Skill.objects.filter(user=user).count() >= 5:
            Badge.objects.create(user=user, name='Skill Builder')
            new_badges.append('Skill Builder')
    return new_badges
