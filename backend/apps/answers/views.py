from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.questions.models import Question
from .models import Answer
from .serializers import AnswerSerializer, SubmitAnswerSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_answer(request):
    serializer = SubmitAnswerSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    question_id = serializer.validated_data['question_id']
    user_response = serializer.validated_data['user_response']

    try:
        question = Question.objects.select_related('session').get(
            id=question_id,
            session__user=request.user,
        )
    except Question.DoesNotExist:
        return Response({'error': 'Question not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Prevent duplicate answer for the same question
    existing = Answer.objects.filter(question=question, user=request.user).first()
    if existing:
        return Response({'error': 'Already answered this question.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        from ai.answer_evaluator import evaluate_answer
        evaluation = evaluate_answer(
            question_text=question.text,
            correct_answer=question.correct_answer,
            user_response=user_response,
        )
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)
    except Exception:
        return Response({'error': 'AI service unavailable. Please try again.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    answer = Answer.objects.create(
        question=question,
        user=request.user,
        user_response=user_response,
        score=evaluation['score'],
        feedback=evaluation['feedback'],
    )

    points_awarded = 0
    new_badges = []

    # Award +10 points for score >= 70
    if evaluation['score'] >= 70:
        request.user.points += 10
        request.user.save(update_fields=['points'])
        request.user.update_level()
        points_awarded = 10

    # Check Quick Learner badge (first attempt, score >= 90)
    if evaluation['score'] >= 90:
        new_badges.extend(_check_quick_learner_badge(request.user, question))

    return Response({
        'answer_id': str(answer.id),
        'score': evaluation['score'],
        'feedback': evaluation['feedback'],
        'encouragement': evaluation['encouragement'],
        'points_awarded': points_awarded,
        'new_total_points': request.user.points,
        'new_badges': new_badges,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def answers_for_session(request, session_id):
    answers = Answer.objects.filter(
        user=request.user,
        question__session_id=session_id,
    ).select_related('question')
    return Response(AnswerSerializer(answers, many=True).data)


def _check_quick_learner_badge(user, question) -> list[str]:
    from apps.users.models import Badge
    if Badge.objects.filter(user=user, name='Quick Learner').exists():
        return []
    # Verify this was first attempt on this question
    attempt_count = Answer.objects.filter(user=user, question=question).count()
    if attempt_count == 1:
        Badge.objects.create(user=user, name='Quick Learner')
        return ['Quick Learner']
    return []
