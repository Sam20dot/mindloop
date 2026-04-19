import json
import os
import anthropic


def generate_quiz_questions(step_title: str, step_description: str, skill_name: str) -> list:
    """
    Generates 3 quiz questions to verify understanding of a roadmap step.
    Returns [{question, correct_answer}]
    """
    client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY', ''))

    message = client.messages.create(
        model='claude-sonnet-4-20250514',
        max_tokens=1000,
        system=(
            'You are a learning coach. Generate exactly 3 open-ended questions to verify that a student '
            'has completed and understood a learning step. Questions should be practical and specific. '
            'Return ONLY valid JSON: '
            '{"questions": [{"question": "...", "correct_answer": "..."}]}'
        ),
        messages=[{
            'role': 'user',
            'content': (
                f'Skill being learned: {skill_name}\n'
                f'Step title: {step_title}\n'
                f'Step description: {step_description}\n\n'
                'Generate 3 verification questions.'
            ),
        }],
    )

    raw = message.content[0].text.strip()
    if raw.startswith('```'):
        raw = raw.split('```')[1].lstrip('json').strip()

    data = json.loads(raw)
    return data.get('questions', [])


def evaluate_quiz(step_title: str, questions_and_answers: list) -> dict:
    """
    Evaluates user answers to quiz questions.
    questions_and_answers: [{question, correct_answer, user_answer}]
    Returns {passed: bool, score: int, feedback: str}
    """
    client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY', ''))

    qa_text = '\n'.join(
        f'Q{i+1}: {qa["question"]}\nExpected: {qa["correct_answer"]}\nStudent answered: {qa["user_answer"]}'
        for i, qa in enumerate(questions_and_answers)
    )

    message = client.messages.create(
        model='claude-sonnet-4-20250514',
        max_tokens=600,
        system=(
            'You are a supportive evaluator. Grade the student answers. '
            'Give an overall score 0-100 and brief feedback. '
            'Return ONLY valid JSON: {"score": 75, "feedback": "...", "passed": true}'
        ),
        messages=[{
            'role': 'user',
            'content': f'Evaluate these quiz answers:\n\n{qa_text}',
        }],
    )

    raw = message.content[0].text.strip()
    if raw.startswith('```'):
        raw = raw.split('```')[1].lstrip('json').strip()

    data = json.loads(raw)
    score = int(data.get('score', 0))
    return {
        'score': score,
        'feedback': data.get('feedback', ''),
        'passed': score >= 70,
    }


def evaluate_github_proof(step_title: str, step_description: str, skill_name: str,
                           repo_url: str, user_description: str) -> dict:
    """
    Evaluates a GitHub submission.
    Returns {passed: bool, feedback: str}
    """
    client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY', ''))

    message = client.messages.create(
        model='claude-sonnet-4-20250514',
        max_tokens=500,
        system=(
            'You are a code reviewer evaluating whether a student completed a learning step. '
            'Based on the GitHub URL they provided and their description of what they built, '
            'determine if the work demonstrates completion of the step. Be encouraging but honest. '
            'Return ONLY valid JSON: {"passed": true, "feedback": "..."}'
        ),
        messages=[{
            'role': 'user',
            'content': (
                f'Skill: {skill_name}\n'
                f'Step: {step_title} — {step_description}\n\n'
                f'Student GitHub URL: {repo_url}\n'
                f'Student description: {user_description}\n\n'
                'Did they complete this step?'
            ),
        }],
    )

    raw = message.content[0].text.strip()
    if raw.startswith('```'):
        raw = raw.split('```')[1].lstrip('json').strip()

    data = json.loads(raw)
    return {'passed': bool(data.get('passed', False)), 'feedback': data.get('feedback', '')}


def evaluate_reflection(step_title: str, step_description: str, skill_name: str,
                         reflection_text: str) -> dict:
    """
    Evaluates a written reflection.
    Returns {passed: bool, feedback: str}
    """
    client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY', ''))

    message = client.messages.create(
        model='claude-sonnet-4-20250514',
        max_tokens=500,
        system=(
            'You are a learning coach evaluating a student reflection. '
            'Determine if the reflection shows genuine understanding and completion of the step. '
            'A good reflection should mention key concepts and personal insights. '
            'Be encouraging. Return ONLY valid JSON: {"passed": true, "feedback": "..."}'
        ),
        messages=[{
            'role': 'user',
            'content': (
                f'Skill: {skill_name}\n'
                f'Step: {step_title} — {step_description}\n\n'
                f'Student reflection:\n{reflection_text}\n\n'
                'Did they genuinely complete and understand this step?'
            ),
        }],
    )

    raw = message.content[0].text.strip()
    if raw.startswith('```'):
        raw = raw.split('```')[1].lstrip('json').strip()

    data = json.loads(raw)
    return {'passed': bool(data.get('passed', False)), 'feedback': data.get('feedback', '')}
