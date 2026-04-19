import json
import os
import anthropic


def match_job(user_skills: list, user_level: str, job_title: str,
              job_requirements: str, job_skill_tags: list) -> dict:
    """
    Evaluate how well a user matches a specific job.
    Returns {match_score: 0-100, match_reason: str, missing_skills: [], strengths: []}
    """
    client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY', ''))

    skill_names = [s.get('name', '') for s in user_skills]

    message = client.messages.create(
        model='claude-sonnet-4-20250514',
        max_tokens=600,
        system=(
            'You are a career advisor evaluating candidate-job fit. '
            'Return ONLY valid JSON: '
            '{"match_score": 75, "match_reason": "...", "missing_skills": ["..."], "strengths": ["..."]}'
        ),
        messages=[{
            'role': 'user',
            'content': (
                f'Candidate skills: {", ".join(skill_names) or "none yet"}\n'
                f'Candidate level: {user_level}\n\n'
                f'Job title: {job_title}\n'
                f'Job requirements: {job_requirements}\n'
                f'Required skills: {", ".join(job_skill_tags) or "not specified"}\n\n'
                'How well does this candidate match? Be specific and honest.'
            ),
        }],
    )

    raw = message.content[0].text.strip()
    if raw.startswith('```'):
        raw = raw.split('```')[1].lstrip('json').strip()

    data = json.loads(raw)
    return {
        'match_score': min(100, max(0, int(data.get('match_score', 0)))),
        'match_reason': data.get('match_reason', ''),
        'missing_skills': data.get('missing_skills', []),
        'strengths': data.get('strengths', []),
    }


def rank_jobs_for_user(user_skills: list, user_level: str, jobs: list) -> list:
    """
    Rank top jobs for a user. Returns jobs sorted by match_score desc.
    Each item: {job_id, title, type, match_score, match_reason, missing_skills, strengths}
    """
    results = []
    for job in jobs[:10]:  # limit to avoid too many AI calls
        try:
            result = match_job(
                user_skills=user_skills,
                user_level=user_level,
                job_title=job.get('title', ''),
                job_requirements=job.get('requirements', ''),
                job_skill_tags=job.get('skill_tags', []),
            )
            results.append({
                'job_id': str(job.get('id', '')),
                'title': job.get('title', ''),
                'type': job.get('type', ''),
                'location': job.get('location', ''),
                'is_remote': job.get('is_remote', False),
                'skill_tags': job.get('skill_tags', []),
                'deadline': job.get('deadline'),
                **result,
            })
        except Exception:
            continue

    return sorted(results, key=lambda x: x['match_score'], reverse=True)[:5]
