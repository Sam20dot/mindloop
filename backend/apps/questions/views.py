from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.learning_sessions.models import LearningSession
from .models import Question
from .serializers import GenerateQuestionsSerializer, QuestionSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_questions(request):
    serializer = GenerateQuestionsSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    session_id = serializer.validated_data['session_id']
    difficulty = serializer.validated_data['difficulty']

    try:
        session = LearningSession.objects.get(id=session_id, user=request.user)
    except LearningSession.DoesNotExist:
        return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Delete existing questions for this session before regenerating
    Question.objects.filter(session=session).delete()

    try:
        from ai.question_generator import generate_questions as ai_generate
        raw_questions = ai_generate(
            topic=session.topic,
            material_text=session.material_text,
            difficulty=difficulty,
        )
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)
    except Exception as e:
        return Response({'error': 'AI service unavailable. Please try again.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    created = []
    for q in raw_questions:
        question = Question.objects.create(
            session=session,
            text=q.get('text', ''),
            difficulty=q.get('difficulty', 'medium'),
            question_type=q.get('type', 'open_ended'),
            correct_answer=q.get('correct_answer', ''),
        )
        created.append(question)

    return Response({
        'session_id': str(session.id),
        'questions': QuestionSerializer(created, many=True).data,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def questions_for_session(request, session_id):
    try:
        session = LearningSession.objects.get(id=session_id, user=request.user)
    except LearningSession.DoesNotExist:
        return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

    questions = Question.objects.filter(session=session)
    return Response(QuestionSerializer(questions, many=True).data)
