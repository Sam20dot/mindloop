import json
import os
import anthropic


def evaluate_answer(question_text: str, correct_answer: str, user_response: str) -> dict:
    """
    Returns { score: int (0-100), feedback: str, encouragement: str }
    Raises ValueError if Claude returns unparseable JSON.
    """
    client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY', ''))

    message = client.messages.create(
        model='claude-sonnet-4-20250514',
        max_tokens=1024,
        system=(
            'You are a supportive and encouraging tutor. Evaluate the student answer fairly. '
            'Return ONLY a valid JSON object with this exact structure: '
            '{"score": <number 0-100>, "feedback": "<constructive feedback>", '
            '"encouragement": "<motivating message>"} '
            'No extra text, no markdown, no explanation.'
        ),
        messages=[
            {
                'role': 'user',
                'content': (
                    f'Question: {question_text}\n\n'
                    f'Correct Answer: {correct_answer}\n\n'
                    f'Student Answer: {user_response}'
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
        raise ValueError(f'Claude returned invalid JSON: {e}\nRaw: {raw[:300]}')

    score = int(data.get('score', 0))
    if not 0 <= score <= 100:
        score = max(0, min(100, score))

    return {
        'score': score,
        'feedback': data.get('feedback', ''),
        'encouragement': data.get('encouragement', 'Keep going!'),
    }
