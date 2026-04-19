import json
import os
import anthropic


def generate_questions(topic: str, material_text: str, difficulty: str = 'mixed') -> list[dict]:
    """
    Returns a list of question dicts: { text, type, correct_answer, difficulty }
    Raises ValueError if Claude returns unparseable JSON.
    """
    client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY', ''))

    difficulty_instruction = (
        'Generate a mix of easy, medium, and critical questions.'
        if difficulty == 'mixed'
        else f'Generate {difficulty} difficulty questions.'
    )

    message = client.messages.create(
        model='claude-sonnet-4-20250514',
        max_tokens=2048,
        system=(
            'You are an expert learning coach. Generate questions to test understanding '
            'of the material. Return ONLY a valid JSON object with this exact structure: '
            '{"questions": [{"text": "...", "type": "multiple_choice or open_ended", '
            '"correct_answer": "...", "difficulty": "easy or medium or critical"}]} '
            'No extra text, no markdown, no explanation.'
        ),
        messages=[
            {
                'role': 'user',
                'content': (
                    f'Topic: {topic}\n\n'
                    f'Material:\n{material_text}\n\n'
                    f'{difficulty_instruction} '
                    f'Generate between 5 and 8 questions total.'
                ),
            }
        ],
    )

    raw = message.content[0].text.strip()

    # Strip markdown code fences if Claude adds them despite instruction
    if raw.startswith('```'):
        raw = raw.split('```')[1]
        if raw.startswith('json'):
            raw = raw[4:]
        raw = raw.strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f'Claude returned invalid JSON: {e}\nRaw: {raw[:300]}')

    questions = data.get('questions', [])
    if not isinstance(questions, list) or len(questions) == 0:
        raise ValueError('Claude returned no questions.')

    return questions
