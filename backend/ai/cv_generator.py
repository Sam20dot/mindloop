import json
import os
import anthropic


def generate_cv(user_name: str, skills: list[dict], session_history: list[dict], badges: list[dict]) -> dict:
    """
    Returns { summary, skills_section: [{name, level, description}], achievements_section: [{title, description}] }
    Raises ValueError on unparseable response.
    """
    client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY', ''))

    skills_text = '\n'.join(f'- {s["name"]} ({s["level"]})' for s in skills) or 'No skills yet'
    sessions_text = '\n'.join(
        f'- {s["topic"]} (completed)' for s in session_history if s.get('status') == 'completed'
    ) or 'No completed sessions'
    badges_text = '\n'.join(f'- {b["name"]}' for b in badges) or 'No badges yet'

    message = client.messages.create(
        model='claude-sonnet-4-20250514',
        max_tokens=2048,
        system=(
            'You are a professional CV writer. Generate a concise and impressive career profile '
            'for a student based on their learning history and skills. '
            'Return ONLY a valid JSON object with this exact structure: '
            '{"summary": "...", '
            '"skills_section": [{"name": "...", "level": "...", "description": "..."}], '
            '"achievements_section": [{"title": "...", "description": "..."}]} '
            'No extra text, no markdown, no explanation.'
        ),
        messages=[
            {
                'role': 'user',
                'content': (
                    f'Student name: {user_name}\n\n'
                    f'Skills:\n{skills_text}\n\n'
                    f'Learning sessions completed:\n{sessions_text}\n\n'
                    f'Badges earned:\n{badges_text}'
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

    if 'summary' not in data:
        raise ValueError('Claude CV response missing summary field.')

    return data
