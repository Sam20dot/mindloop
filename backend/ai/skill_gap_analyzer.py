import json
import os
import anthropic


def analyze_skill_gaps(user_skills: list[dict], all_skill_tags: list[list]) -> dict:
    """
    Returns { recommended_skills: [{name, reason, opportunities_unlocked}] }
    Raises ValueError on unparseable response.
    """
    client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY', ''))

    user_skill_names = [s['name'] if isinstance(s, dict) else s for s in user_skills]
    all_tags = list({tag for tags in all_skill_tags for tag in (tags or [])})

    message = client.messages.create(
        model='claude-sonnet-4-20250514',
        max_tokens=1024,
        system=(
            'You are a career advisor. Based on the student\'s current skills and the full '
            'list of skills needed across all available opportunities, identify the top 3 '
            'skills they should learn next to unlock the most opportunities. '
            'Return ONLY a valid JSON object:\n'
            '{"recommended_skills": ['
            '{"name": "skill name", "reason": "why this skill matters for their career", '
            '"opportunities_unlocked": estimated_number}]}\n'
            'No extra text, no markdown, no explanation outside the JSON.'
        ),
        messages=[
            {
                'role': 'user',
                'content': (
                    f'Student current skills: {", ".join(user_skill_names) or "none yet"}\n\n'
                    f'Skills needed across all available opportunities: {", ".join(all_tags)}'
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

    if 'recommended_skills' not in data or not isinstance(data['recommended_skills'], list):
        raise ValueError('Claude skill gap response missing recommended_skills field.')

    return data
