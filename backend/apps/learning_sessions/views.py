from datetime import timedelta, date

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import LearningSession
from .serializers import LearningSessionSerializer, StartSessionSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_session(request):
    serializer = StartSessionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    session = LearningSession.objects.create(
        user=request.user,
        topic=serializer.validated_data['topic'],
        material_text=serializer.validated_data['material_text'],
        status='active',
    )
    return Response(LearningSessionSerializer(session).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_detail(request, session_id):
    try:
        session = LearningSession.objects.get(id=session_id, user=request.user)
    except LearningSession.DoesNotExist:
        return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(LearningSessionSerializer(session).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def complete_session(request, session_id):
    try:
        session = LearningSession.objects.get(id=session_id, user=request.user)
    except LearningSession.DoesNotExist:
        return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

    if session.status == 'completed':
        return Response({'error': 'Session already completed.'}, status=status.HTTP_400_BAD_REQUEST)

    session.status = 'completed'
    session.completed_at = timezone.now()
    session.save()

    user = request.user
    user.points += 20
    user.save(update_fields=['points'])

    # Update level based on new points
    user.update_level()

    # Update streak
    _update_streak(user)

    # Badge checks
    _check_focus_master_badge(user)
    _check_consistent_student_badge(user)

    # Extract skills + check Skill Builder badge (errors non-fatal)
    extracted_skills = []
    new_badges = []
    try:
        extracted_skills, new_badges = _extract_and_save_skills(user, session)
    except Exception:
        pass

    # Update weekly challenge progress (errors non-fatal)
    try:
        _update_challenge_progress(user, new_badges)
    except Exception:
        pass

    # Auto-post new badges to community (errors non-fatal)
    try:
        for badge_name in new_badges:
            _auto_community_post(user, 'achievement', f'I just earned the {badge_name} badge on MindLoop!')
        # Post a 7-day streak update
        if user.current_streak == 7:
            _auto_community_post(user, 'learning_update', f'I\'ve completed a 7-day learning streak on MindLoop! Consistency is key!')
    except Exception:
        pass

    # Auto-generate CV (errors non-fatal)
    try:
        _auto_generate_cv(user)
    except Exception:
        pass

    return Response({
        **LearningSessionSerializer(session).data,
        'points_awarded': 20,
        'new_total_points': user.points,
        'current_streak': user.current_streak,
        'extracted_skills': extracted_skills,
        'new_badges': new_badges,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_history(request):
    sessions = LearningSession.objects.filter(user=request.user).order_by('-started_at')
    return Response(LearningSessionSerializer(sessions, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def extract_text(request):
    file = request.FILES.get('file')
    if not file:
        return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

    filename = file.name.lower()

    if filename.endswith('.txt'):
        try:
            text = file.read().decode('utf-8')
        except UnicodeDecodeError:
            text = file.read().decode('latin-1')
        return Response({'text': text.strip()})

    if filename.endswith('.pdf'):
        try:
            import pdfplumber
            import io
            with pdfplumber.open(io.BytesIO(file.read())) as pdf:
                pages = [page.extract_text() or '' for page in pdf.pages]
            text = '\n\n'.join(p.strip() for p in pages if p.strip())
            if not text:
                return Response({'error': 'Could not extract text from PDF. The PDF may contain only images.'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
            return Response({'text': text})
        except Exception as e:
            return Response({'error': f'Failed to read PDF: {str(e)}'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    return Response(
        {'error': 'Unsupported file type. Please upload a .pdf or .txt file.'},
        status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
    )


# ── Helpers ───────────────────────────────────────────────────

def _update_streak(user):
    today = date.today()
    last = user.last_session_date

    if last is None:
        user.current_streak = 1
    elif last == today:
        pass  # Already had a session today
    elif last == today - timedelta(days=1):
        user.current_streak += 1
    elif last == today - timedelta(days=2) and user.streak_freeze_available and not user.streak_freeze_used:
        user.streak_freeze_used = True
        user.current_streak += 1
    else:
        user.current_streak = 1
        user.streak_freeze_used = False

    user.last_session_date = today
    if user.current_streak > user.longest_streak:
        user.longest_streak = user.current_streak

    user.save(update_fields=['current_streak', 'longest_streak', 'last_session_date', 'streak_freeze_used'])


def _update_challenge_progress(user, new_badges):
    from apps.challenges.models import WeeklyChallenge, UserChallengeProgress

    today = timezone.now().date()
    challenge = WeeklyChallenge.objects.filter(
        is_active=True, week_start__lte=today, week_end__gte=today,
    ).first()
    if not challenge:
        return

    prog, _ = UserChallengeProgress.objects.get_or_create(user=user, challenge=challenge)
    prog.completed_sessions += 1
    prog.save(update_fields=['completed_sessions'])

    if not prog.bonus_awarded and prog.completed_sessions >= challenge.target_sessions:
        user.points += challenge.bonus_points
        user.save(update_fields=['points'])
        user.update_level()
        prog.bonus_awarded = True
        prog.completed_at = timezone.now()
        prog.save(update_fields=['bonus_awarded', 'completed_at'])
        _auto_community_post(
            user, 'achievement',
            f'I completed the weekly challenge and earned {challenge.bonus_points} bonus points!',
        )


def _auto_community_post(user, post_type, content):
    from apps.community.models import Post
    Post.objects.create(user=user, type=post_type, content=content)


def _extract_and_save_skills(user, session) -> tuple[list, list]:
    from apps.answers.models import Answer
    from apps.skills.models import Skill
    from apps.users.models import Badge
    from ai.skill_extractor import extract_skills

    answers = Answer.objects.filter(
        user=user, question__session=session
    ).select_related('question')

    if not answers.exists():
        return [], []

    questions_data = [
        {'text': a.question.text, 'score': a.score}
        for a in answers
    ]
    scores = [a.score for a in answers]
    avg_score = sum(scores) / len(scores)

    raw_skills = extract_skills(
        topic=session.topic,
        questions=questions_data,
        average_score=avg_score,
    )

    saved = []
    new_badges = []
    is_first_ever = not Skill.objects.filter(user=user).exists()

    for s in raw_skills:
        name = s.get('name', '').strip()
        level = s.get('level', 'beginner')
        if not name:
            continue
        skill, created = Skill.objects.get_or_create(
            user=user,
            name__iexact=name,
            defaults={'name': name, 'level': level, 'source': 'learning'},
        )
        if not created and _level_rank(level) > _level_rank(skill.level):
            skill.level = level
            skill.save(update_fields=['level'])
        saved.append({'name': skill.name, 'level': skill.level})

    if saved and is_first_ever:
        user.points += 50
        user.save(update_fields=['points'])
        user.update_level()

    if not Badge.objects.filter(user=user, name='Skill Builder').exists():
        if Skill.objects.filter(user=user).count() >= 5:
            Badge.objects.create(user=user, name='Skill Builder')
            new_badges.append('Skill Builder')

    return saved, new_badges


def _level_rank(level: str) -> int:
    return {'beginner': 0, 'intermediate': 1, 'advanced': 2}.get(level, 0)


def _auto_generate_cv(user):
    import logging
    from apps.skills.models import Skill
    from apps.users.models import Badge
    from apps.cv.models import CVEntry
    from ai.cv_generator import generate_cv as ai_generate

    log = logging.getLogger(__name__)
    skills = list(Skill.objects.filter(user=user).values('name', 'level'))
    sessions = list(
        LearningSession.objects.filter(user=user)
        .values('topic', 'status')
        .order_by('-started_at')[:20]
    )
    badges = list(Badge.objects.filter(user=user).values('name'))

    if not skills and not any(s['status'] == 'completed' for s in sessions):
        return

    try:
        cv_data = ai_generate(
            user_name=user.name,
            skills=skills,
            session_history=sessions,
            badges=badges,
        )
    except Exception as e:
        log.warning('Auto CV generation failed for %s: %s', user.email, e)
        return

    CVEntry.objects.create(user=user, summary=cv_data.get('summary', ''), content=cv_data)


def _check_focus_master_badge(user):
    from apps.users.models import Badge
    if Badge.objects.filter(user=user, name='Focus Master').exists():
        return
    recent = LearningSession.objects.filter(user=user, status='completed').order_by('-completed_at')[:3]
    if recent.count() == 3:
        Badge.objects.create(user=user, name='Focus Master')


def _check_consistent_student_badge(user):
    from apps.users.models import Badge
    if Badge.objects.filter(user=user, name='Consistent Student').exists():
        return
    today = timezone.now().date()
    streak = 0
    for i in range(7):
        day = today - timedelta(days=i)
        if LearningSession.objects.filter(user=user, status='completed', completed_at__date=day).exists():
            streak += 1
        else:
            break
    if streak >= 7:
        Badge.objects.create(user=user, name='Consistent Student')
