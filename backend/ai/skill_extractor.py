import json
import os
import anthropic


def extract_skills(topic: str, questions: list[dict], average_score: float) -> list[dict]:
    """
    Returns list of { name: str, level: 'beginner'|'intermediate'|'advanced' }
    Raises ValueError on unparseable response.
    """
    client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY', ''))

    question_summaries = '\n'.join(
        f'- {q["text"]} (score: {q.get("score", "unanswered")})' for q in questions
    )

    message = client.messages.create(
        model='claude-sonnet-4-20250514',
        max_tokens=1024,
        system=(
            'You are a career advisor. Based on the topic and questions the student answered, '
            'identify what skills they have demonstrated. '
            'Return ONLY a valid JSON object with this exact structure: '
            '{"skills": [{"name": "...", "level": "beginner or intermediate or advanced"}]} '
            'Level must be one of: beginner, intermediate, advanced. '
            'Return between 1 and 5 skills. No extra text, no markdown.'
        ),
        messages=[
            {
                'role': 'user',
                'content': (
                    f'Topic: {topic}\n\n'
                    f'Questions answered:\n{question_summaries}\n\n'
                    f'Average score: {average_score:.0f}/100\n\n'
                    'What skills has the student demonstrated?'
                ),
            }
        ],
    )

    raw = message.content[0].text.strip()
    if raw.startswith('```'):
        raw = raw.split('```')[1]
        if raw.startswith('json'):
            raw = raw[4:]
        raw = raw.strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f'Claude returned invalid JSON: {e}')

    skills = data.get('skills', [])
    if not isinstance(skills, list):
        raise ValueError('Claude returned no skills list.')

    valid_levels = {'beginner', 'intermediate', 'advanced'}
    for s in skills:
        if s.get('level') not in valid_levels:
            s['level'] = 'beginner'

    return skills
