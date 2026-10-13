"""
Job Post Generator Engine for DevHire
====================================
Generates comprehensive job description, responsibilities/requirements,
and recommended tech stack from a job title.

Public API:
  generate_job_post(title, experience_level="", job_type="", location="", company_name="", api_key="") -> dict
"""

import json
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = (
    "You are an expert technical recruiter and hiring manager at a top tech company. "
    "Given a job title and optional metadata, auto-generate a comprehensive, professional job posting. "
    "Requirements:\n"
    "1. description: 2 engaging paragraphs describing the role, mission, and day-to-day impact (at least 60 words).\n"
    "2. requirements: 5 to 8 bullet points formatted with markdown '-' covering key responsibilities and required qualifications.\n"
    "3. tech_stack: Array of 4 to 8 modern technology keywords (e.g. ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker']).\n"
    "4. Return ONLY valid JSON matching the requested structure without markdown fences."
)

PROMPT_TEMPLATE = """Job Title: {title}
Experience Level: {experience_level}
Job Type: {job_type}
Location: {location}
Company Name: {company_name}

Return this JSON format:
{{
  "description": "<2 paragraphs describing the role, impact, and expectations>",
  "requirements": "<5-8 bullet points starting with - covering responsibilities and requirements>",
  "tech_stack": [<4 to 8 specific technology keywords>]
}}
"""


def _generate_fallback_job(
    title: str,
    experience_level: str,
    job_type: str,
    location: str,
    company_name: str,
) -> dict:
    """Generate structured fallback job post when Gemini is unavailable."""
    exp = experience_level.capitalize() if experience_level else "Mid-level"
    company = company_name if company_name else "Our team"
    loc = location if location else "Remote"

    # Default tech stack heuristics
    lower_title = title.lower()
    tech = []
    if "react" in lower_title:
        tech = ["React", "TypeScript", "JavaScript", "TailwindCSS", "Next.js", "REST APIs"]
    elif "python" in lower_title or "django" in lower_title:
        tech = ["Python", "Django", "PostgreSQL", "Docker", "REST APIs", "Redis"]
    elif "fullstack" in lower_title or "full stack" in lower_title or "full-stack" in lower_title:
        tech = ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker", "TailwindCSS"]
    elif "node" in lower_title or "backend" in lower_title:
        tech = ["Node.js", "TypeScript", "Express", "PostgreSQL", "Redis", "Docker"]
    elif "devops" in lower_title or "cloud" in lower_title:
        tech = ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Linux"]
    elif "mobile" in lower_title or "flutter" in lower_title:
        tech = ["Flutter", "Dart", "Firebase", "REST APIs", "Git", "State Management"]
    else:
        tech = ["JavaScript", "TypeScript", "Git", "REST APIs", "SQL", "Agile"]

    description = (
        f"{company} is looking for a talented {title} to join our growing engineering team. "
        f"In this role ({loc}), you will collaborate closely with product managers, designers, "
        f"and fellow engineers to build, scale, and maintain high-quality software solutions.\n\n"
        f"As a {exp} engineer, you will have significant ownership over technical decisions, "
        f"architecture, and code quality. You'll contribute to a fast-paced environment where innovation, "
        f"mentorship, and continuous learning are highly valued."
    )

    requirements = (
        f"- Proven experience designing and implementing scalable software applications as a {title}.\n"
        f"- Solid hands-on proficiency with {', '.join(tech[:3])} and modern development tooling.\n"
        f"- Experience collaborating in cross-functional agile teams and conducting thorough code reviews.\n"
        f"- Strong understanding of software design patterns, testing principles, and performance optimization.\n"
        f"- Excellent communication skills with the ability to articulate technical concepts clearly.\n"
        f"- Passion for staying up-to-date with emerging industry trends and best practices."
    )

    return {
        "description": description,
        "requirements": requirements,
        "tech_stack": tech,
        "ai_enhanced": False,
    }


def generate_job_post(
    title: str,
    experience_level: str = "",
    job_type: str = "",
    location: str = "",
    company_name: str = "",
    api_key: str = "",
) -> dict:
    """
    Auto-generates job description, requirements, and tech stack.

    Args:
        title: Job Title (e.g. 'Senior React Developer')
        experience_level: 'junior' | 'mid' | 'senior'
        job_type: 'full-time' | 'contract' | etc.
        location: e.g. 'Remote'
        company_name: Company name
        api_key: Gemini API key

    Returns:
        dict: {
            "description": str,
            "requirements": str,
            "tech_stack": List[str],
            "ai_enhanced": bool
        }
    """
    clean_title = (title or "").strip()
    if not clean_title:
        raise ValueError("Job title is required to generate a job posting.")

    if not api_key:
        return _generate_fallback_job(
            clean_title, experience_level, job_type, location, company_name
        )

    try:
        from google import genai  # type: ignore
        from google.genai import types  # type: ignore

        client = genai.Client(api_key=api_key)
        prompt = PROMPT_TEMPLATE.format(
            title=clean_title,
            experience_level=experience_level or "Not specified",
            job_type=job_type or "Full-time",
            location=location or "Flexible / Remote",
            company_name=company_name or "Our Company",
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
        description = data.get("description", "").strip()
        requirements = data.get("requirements", "").strip()
        tech_stack = data.get("tech_stack", [])

        if isinstance(tech_stack, list):
            tech_stack = [str(t).strip() for t in tech_stack if str(t).strip()]
        else:
            tech_stack = []

        if description and requirements:
            return {
                "description": description,
                "requirements": requirements,
                "tech_stack": tech_stack,
                "ai_enhanced": True,
            }

    except Exception as exc:
        logger.warning("Gemini job post generation failed, falling back to template: %s", exc)

    return _generate_fallback_job(
        clean_title, experience_level, job_type, location, company_name
    )
