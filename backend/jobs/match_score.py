"""
Match Score Engine for DevHire
==============================
Computes a compatibility score between a developer's profile and a job posting.

Two-tier scoring:
  1. Local score  — instant set-intersection on skills/tech_stack (no API call)
  2. AI score     — Gemini semantic scoring for fuzzy matches (e.g. "ReactJS" ↔ "React")
                    Result is cached in Django cache for 24 hours per (developer_id, job_id).

Public API:
  compute_match(developer, job, use_ai=True) -> MatchResult
"""

import json
import logging
from dataclasses import dataclass, field
from typing import List, Optional

from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

CACHE_TTL = 60 * 60 * 24  # 24 hours


@dataclass
class MatchResult:
    score: int                        # 0–100
    matching_skills: List[str]        # skills dev has that job wants
    missing_skills: List[str]         # skills job wants that dev lacks
    bonus_skills: List[str]           # dev skills not required but relevant
    ai_enhanced: bool = False         # whether Gemini was used
    label: str = ""                   # "Excellent", "Good", "Fair", "Low"

    def __post_init__(self):
        if not self.label:
            if self.score >= 80:
                self.label = "Excellent"
            elif self.score >= 60:
                self.label = "Good"
            elif self.score >= 40:
                self.label = "Fair"
            else:
                self.label = "Low"

    def to_dict(self) -> dict:
        return {
            "score": self.score,
            "label": self.label,
            "matching_skills": self.matching_skills,
            "missing_skills": self.missing_skills,
            "bonus_skills": self.bonus_skills,
            "ai_enhanced": self.ai_enhanced,
        }


def _normalize(skill: str) -> str:
    """Lower-case, strip punctuation for comparison."""
    return skill.lower().strip().replace(".", "").replace("-", "").replace(" ", "")


def _local_match(dev_skills: List[str], job_skills: List[str]) -> dict:
    """
    Fast set-intersection match. Returns matching/missing/bonus lists
    and a raw score (0–100).
    """
    if not job_skills:
        return {
            "score": 100,
            "matching": [],
            "missing": [],
            "bonus": list(dev_skills),
        }

    norm_dev = {_normalize(s): s for s in dev_skills}
    norm_job = {_normalize(s): s for s in job_skills}

    matching_keys = set(norm_dev) & set(norm_job)
    missing_keys = set(norm_job) - set(norm_dev)
    bonus_keys = set(norm_dev) - set(norm_job)

    matching = [norm_dev[k] for k in matching_keys]
    missing = [norm_job[k] for k in missing_keys]
    bonus = [norm_dev[k] for k in bonus_keys]

    score = round(len(matching_keys) / len(norm_job) * 100) if norm_job else 100
    return {"score": score, "matching": matching, "missing": missing, "bonus": bonus}


# ──────────────────────────────────────────────────────────────────────────────
# AI Scoring
# ──────────────────────────────────────────────────────────────────────────────

_AI_SYSTEM = (
    "You are an expert technical recruiter evaluating developer-job compatibility. "
    "You will receive a developer skill list and a job posting. "
    "Your job is to semantically match skills (e.g. 'ReactJS' == 'React', "
    "'Node' ≈ 'Express'), considering aliases, related frameworks, and ecosystems. "
    "Return ONLY valid JSON, no markdown, no explanation."
)

_AI_PROMPT_TEMPLATE = """Developer skills: {dev_skills}

Job title: {job_title}
Job required tech stack: {job_skills}
Job description (excerpt): {job_desc}

Return this JSON object:
{{
  "score": <integer 0-100, overall compatibility>,
  "matching_skills": [<skills the developer has that match job requirements, using the job's terminology>],
  "missing_skills": [<skills the job requires that the developer is missing>],
  "bonus_skills": [<developer skills not required but relevant to this job>],
  "reasoning": "<1 sentence summary>"
}}"""


def _cache_key(developer_id: int, job_id: int) -> str:
    return f"match_score:v1:{developer_id}:{job_id}"


def _ai_match(
    dev_skills: List[str],
    job_title: str,
    job_skills: List[str],
    job_desc: str,
    api_key: str,
) -> Optional[dict]:
    """
    Calls Gemini to perform semantic skill matching.
    Returns parsed dict or None on failure.
    """
    try:
        from google import genai  # type: ignore
        from google.genai import types  # type: ignore

        client = genai.Client(api_key=api_key)

        prompt = _AI_PROMPT_TEMPLATE.format(
            dev_skills=", ".join(dev_skills) if dev_skills else "None listed",
            job_title=job_title,
            job_skills=", ".join(job_skills) if job_skills else "Not specified",
            job_desc=(job_desc or "")[:800],  # Keep prompt short
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=_AI_SYSTEM,
                temperature=0.1,
                response_mime_type="application/json",
            ),
        )

        raw = response.text.strip()
        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)

        # Validate required keys
        score = int(data.get("score", 0))
        return {
            "score": max(0, min(100, score)),
            "matching": data.get("matching_skills", []),
            "missing": data.get("missing_skills", []),
            "bonus": data.get("bonus_skills", []),
        }

    except Exception as exc:
        logger.warning("AI match scoring failed, falling back to local: %s", exc)
        return None


# ──────────────────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────────────────

def compute_match(developer, job, use_ai: bool = True) -> MatchResult:
    """
    Compute a match score between a developer User instance and a Job instance.

    Args:
        developer: accounts.User with role='developer'
        job:       jobs.Job instance
        use_ai:    If True and GEMINI_API_KEY is configured, use Gemini for
                   semantic matching; otherwise fall back to local scoring.

    Returns:
        MatchResult dataclass
    """
    dev_skills: List[str] = list(developer.skills or [])
    job_skills: List[str] = list(job.tech_stack or [])

    # 1. Try cached result first
    cache_key = _cache_key(developer.pk, job.pk)
    cached = cache.get(cache_key)
    if cached:
        return MatchResult(**cached)

    # 2. Always compute local score (instant, no API)
    local = _local_match(dev_skills, job_skills)

    api_key = getattr(settings, "GEMINI_API_KEY", "")
    ai_result = None

    if use_ai and api_key:
        ai_result = _ai_match(
            dev_skills=dev_skills,
            job_title=job.title,
            job_skills=job_skills,
            job_desc=job.description,
            api_key=api_key,
        )

    if ai_result:
        result = MatchResult(
            score=ai_result["score"],
            matching_skills=ai_result["matching"],
            missing_skills=ai_result["missing"],
            bonus_skills=ai_result["bonus"],
            ai_enhanced=True,
        )
    else:
        result = MatchResult(
            score=local["score"],
            matching_skills=local["matching"],
            missing_skills=local["missing"],
            bonus_skills=local["bonus"],
            ai_enhanced=False,
        )

    # 3. Cache the result
    cache.set(cache_key, {
        "score": result.score,
        "matching_skills": result.matching_skills,
        "missing_skills": result.missing_skills,
        "bonus_skills": result.bonus_skills,
        "ai_enhanced": result.ai_enhanced,
        "label": result.label,
    }, CACHE_TTL)

    return result


def invalidate_match_cache(developer_id: int, job_id: int):
    """Call this when dev skills or job tech_stack change."""
    cache.delete(_cache_key(developer_id, job_id))
