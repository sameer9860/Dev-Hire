"""
Bio Enhancer Engine for DevHire
===============================
Rewrites developer rough notes, draft bios, headlines, and skills
into a high-impact, professional tech summary.

Public API:
  enhance_developer_bio(bio, headline="", skills=None, api_key="") -> dict
"""

import json
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = (
    "You are an expert technical recruiter and developer career coach. "
    "Your task is to rewrite a developer's rough notes, bio draft, headline, and skills "
    "into a compelling, concise, professional first-person developer bio / technical summary for DevHire. "
    "Guidelines:\n"
    "1. Professional yet authentic tone in first person (e.g. 'I am a...', 'Passionate engineer...').\n"
    "2. Highlight core technical proficiencies, problem-solving mindset, and engineering impact.\n"
    "3. Keep it between 2 to 4 sentences (under 450 characters total) so it fits cleanly on profiles.\n"
    "4. Return ONLY a JSON object with a single key 'enhanced_bio', without markdown fences or extra text."
)

PROMPT_TEMPLATE = """Developer draft / rough notes: {bio}
Headline: {headline}
Skills: {skills}

Return this JSON format:
{{
  "enhanced_bio": "<polished, 2-4 sentence professional technical summary under 450 characters>"
}}
"""


def _generate_fallback_bio(bio: str, headline: str, skills: List[str]) -> str:
    """Generate a clean, structured bio template if Gemini is unavailable."""
    title = headline.strip() if headline else "Software Engineer"
    skills_slice = [s.strip() for s in skills if s.strip()][:5] if skills else []
    
    if skills_slice:
        skills_phrase = ", ".join(skills_slice[:-1]) + f" and {skills_slice[-1]}" if len(skills_slice) > 1 else skills_slice[0]
        skill_sentence = f"Proficient in {skills_phrase}, with a strong focus on clean code and scalable architecture."
    else:
        skill_sentence = "Focused on developing robust, user-centric web applications and modern technical solutions."

    if bio and len(bio.strip()) > 10:
        cleaned_notes = bio.strip().rstrip(".")
        return f"Passionate {title}. {cleaned_notes}. {skill_sentence}"
    
    return (
        f"Dedicated {title} with practical experience building modern, reliable software. "
        f"{skill_sentence} Always eager to learn new technologies and contribute to high-impact teams."
    )


def enhance_developer_bio(
    bio: str = "",
    headline: str = "",
    skills: Optional[List[str]] = None,
    api_key: str = "",
) -> dict:
    """
    Polishes a developer's bio using Gemini or fallback generator.

    Args:
        bio: Current bio draft or rough notes.
        headline: Developer headline (e.g. 'Full-Stack Developer').
        skills: List of developer skills (e.g. ['React', 'Python']).
        api_key: Google Gemini API key.

    Returns:
        dict: {"enhanced_bio": str, "ai_enhanced": bool}
    """
    skills_list = list(skills or [])
    clean_bio = (bio or "").strip()
    clean_headline = (headline or "").strip()

    if not api_key:
        fallback = _generate_fallback_bio(clean_bio, clean_headline, skills_list)
        return {"enhanced_bio": fallback, "ai_enhanced": False}

    try:
        from google import genai  # type: ignore
        from google.genai import types  # type: ignore

        client = genai.Client(api_key=api_key)
        prompt = PROMPT_TEMPLATE.format(
            bio=clean_bio if clean_bio else "None provided (use headline and skills)",
            headline=clean_headline if clean_headline else "Not specified",
            skills=", ".join(skills_list) if skills_list else "Not specified",
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.3,
                response_mime_type="application/json",
            ),
        )

        raw = (response.text or "").strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        data = json.loads(raw)
        enhanced_bio = data.get("enhanced_bio", "").strip()

        if enhanced_bio:
            # Enforce max length constraint
            if len(enhanced_bio) > 500:
                enhanced_bio = enhanced_bio[:497] + "..."
            return {"enhanced_bio": enhanced_bio, "ai_enhanced": True}

    except Exception as exc:
        logger.warning("Gemini bio enhancement failed, falling back to template: %s", exc)

    fallback = _generate_fallback_bio(clean_bio, clean_headline, skills_list)
    return {"enhanced_bio": fallback, "ai_enhanced": False}
