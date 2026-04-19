import json
import os
import anthropic


def generate_roadmap(skill_name: str, user_level: str) -> dict:
    """
    Returns {
        steps: [{order, title, description, estimated_weeks, verification_type,
                 status, verified, verified_at, proof_url, proof_text}],
        projects: [{title, description, difficulty}],
        resources: [{title, type, url}],
        estimated_weeks: int
    }
    """
    client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY', ''))

    message = client.messages.create(
        model='claude-sonnet-4-20250514',
        max_tokens=3000,
        system=(
            'You are an expert career advisor. Generate a detailed and practical learning roadmap '
            'for a student who wants to master a skill. Include real steps, projects they can build, '
            'and free resources. '
            'Return ONLY a valid JSON object with this exact structure: '
            '{"steps": [{"order": 1, "title": "...", "description": "...", "estimated_weeks": 2, '
            '"verification_type": "quiz or github or reflection"}], '
            '"projects": [{"title": "...", "description": "...", "difficulty": "beginner or intermediate or advanced"}], '
            '"resources": [{"title": "...", "type": "video or article or course or book", "url": "..."}], '
            '"estimated_weeks": 12} '
            'For verification_type: use "quiz" for theory-heavy steps, "github" for coding/project steps, '
            '"reflection" for conceptual/soft-skill steps. '
            'Include 4-7 steps, 3-5 projects, and 4-6 resources. '
            'No extra text, no markdown, no explanation.'
        ),
        messages=[
            {
                'role': 'user',
                'content': (
                    f'Skill: {skill_name}\n'
                    f'Student current level: {user_level}\n\n'
                    'Generate a complete learning roadmap.'
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

    if 'steps' not in data:
        raise ValueError('Claude roadmap response missing steps field.')

    try:
        data['estimated_weeks'] = int(data.get('estimated_weeks', 0))
    except (TypeError, ValueError):
        data['estimated_weeks'] = 0

    # Enrich each step with default verification state
    for step in data.get('steps', []):
        step.setdefault('verification_type', 'reflection')
        step.setdefault('status', 'not_started')
        step.setdefault('verified', False)
        step.setdefault('verified_at', None)
        step.setdefault('proof_url', None)
        step.setdefault('proof_text', None)

    return data
