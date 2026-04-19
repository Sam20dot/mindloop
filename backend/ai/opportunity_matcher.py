import json
import os
import anthropic


def match_opportunities(user_skills: list[dict], user_level: str, user_points: int, opportunities: list[dict]) -> dict:
    """
    opportunities: list of dicts with keys: id, title, type, skill_tags, description
    Returns { matches: [{opportunity_id, match_score, match_reason, action_steps}] }
    Raises ValueError on unparseable response.
    """
    client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY', ''))

    skills_text = '\n'.join(f'- {s["name"]} ({s["level"]})' for s in user_skills) or 'No skills yet'

    opps_lines = []
    for o in opportunities:
        tags = ', '.join(o['skill_tags']) if o['skill_tags'] else 'none'
        opps_lines.append(
            f'ID: {o["id"]}\nTitle: {o["title"]}\nType: {o["type"]}\n'
            f'Skills needed: {tags}\nDescription: {o["description"]}'
        )
    opps_text = '\n\n'.join(opps_lines)

    message = client.messages.create(
        model='claude-sonnet-4-20250514',
        max_tokens=4096,
        system=(
            'You are a career coach helping a student in Africa find real work opportunities '
            'matching their skills. Given the student\'s skills and level, rank and explain '
            'why each opportunity fits them. '
            'Return ONLY a valid JSON object with this exact structure:\n'
            '{"matches": [{"opportunity_id": "the exact UUID from input", '
            '"match_score": 0-100, '
            '"match_reason": "1-2 sentences explaining why this fits the student", '
            '"action_steps": ["specific step 1", "specific step 2", "specific step 3"]}]}\n'
            'Include ALL provided opportunities in the response, ordered from highest to '
            'lowest match_score. The match_score reflects how well the student\'s current '
            'skills match what the opportunity requires. '
            'No extra text, no markdown, no explanation outside the JSON.'
        ),
        messages=[
            {
                'role': 'user',
                'content': (
                    f'Student level: {user_level}\n'
                    f'Student points: {user_points}\n\n'
                    f'Student skills:\n{skills_text}\n\n'
                    f'Available opportunities:\n{opps_text}'
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

    if 'matches' not in data or not isinstance(data['matches'], list):
        raise ValueError('Claude match response missing matches field.')

    return data
