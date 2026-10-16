"""
AI Application Pitch / Cover Note Generator Engine for DevHire
=============================================================
Generates a personalized, authentic, 2-paragraph cover note connecting
a developer's specific background (skills, projects, experience) to an
employer's job requirements.

Public API:
  generate_application_pitch(user_profile: dict, job_data: dict, api_key: str = "") -> dict
"""

import json
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = (
    "You are an elite technical career coach and software engineer recruiter. "
    "Your mission is to write a highly compelling, authentic, professional, and personalized "
    "2-paragraph application pitch / cover letter connecting a developer's real skills, projects, and background "
    "directly to the employer's job requirements.\n\n"
    "Guidelines:\n"
    "1. Structure: Exactly 2 well-crafted paragraphs (between 120 and 220 words total).\n"
    "   - Paragraph 1: Direct, energetic opening expressing excitement for the specific role at the target company. "
    "Highlight the developer's core technical focus (headline/skills) and immediately state how their background aligns with the job's core challenges.\n"
    "   - Paragraph 2: Concrete proof points. Reference 1 or 2 specific projects, tech stack tools, or achievements from the candidate's profile "
    "that demonstrate hands-on problem solving relevant to the employer's stack and requirements. Conclude with eagerness to contribute and interview.\n"
    "2. Tone: Professional, confident, concise, developer-centric. Never sound generic or like a generic cover letter template.\n"
    "3. Do not invent fake company names or fake candidate names; use the provided context.\n"
    "4. Return ONLY valid JSON matching: {\"cover_letter\": \"<the 2-paragraph text separated by \\n\\n>\"} without markdown fences."
)

PROMPT_TEMPLATE = """Candidate Profile:
- Name: {name}
- Headline: {headline}
- Key Skills: {skills}
- Key Projects: {projects}
- Experience / Background: {experience}
- Bio / Summary: {bio}

Target Job Details:
- Role Title: {job_title}
- Company: {company_name}
- Required Tech Stack: {job_tech_stack}
- Job Description: {job_description}
- Key Requirements: {job_requirements}

Write a tailored, high-converting 2-paragraph application pitch connecting this candidate's specific skills and projects to this role.
Return JSON format:
{{
  "cover_letter": "<2 paragraphs separated by \\n\\n>"
}}
"""


def _generate_fallback_pitch(user_profile: Dict[str, Any], job_data: Dict[str, Any]) -> str:
    """
    Generate a high-quality, structured 2-paragraph pitch when Gemini is unavailable.
    Dynamically finds skill intersections and references the candidate's top projects.
    """
    name = (user_profile.get("first_name") or user_profile.get("name") or "there").strip()
    headline = (user_profile.get("headline") or "Software Developer").strip()
    user_skills = [str(s).strip() for s in (user_profile.get("skills") or []) if str(s).strip()]
    projects = user_profile.get("projects") or []

    job_title = (job_data.get("title") or "Software Engineer").strip()
    company = (job_data.get("company_name") or "your team").strip()
    job_tech = [str(t).strip() for t in (job_data.get("tech_stack") or []) if str(t).strip()]

    # Find matching skills between candidate and job
    job_tech_lower = {t.lower() for t in job_tech}
    matching_skills = [s for s in user_skills if s.lower() in job_tech_lower]
    highlight_skills = matching_skills[:3] if matching_skills else user_skills[:3]
    skills_phrase = ", ".join(highlight_skills) if highlight_skills else "modern web technologies and software engineering"

    # Reference candidate's top project if available
    project_phrase = ""
    if projects and isinstance(projects, list):
        top_project = projects[0]
        if isinstance(top_project, dict):
            proj_title = top_project.get("title") or "recent project"
            proj_desc = top_project.get("description") or ""
            if proj_desc and len(proj_desc) > 80:
                proj_desc = proj_desc[:77] + "..."
            project_phrase = f"In my work on {proj_title}" + (f" ({proj_desc})" if proj_desc else "")
    elif user_skills:
        project_phrase = f"Through building scalable applications with {user_skills[0]}"

    # Paragraph 1: Hook & Alignment
    p1 = (
        f"I am writing to express my strong interest in the {job_title} role at {company}. "
        f"As a {headline} with hands-on experience in {skills_phrase}, I have focused on building "
        f"clean, high-performance applications that deliver real impact. The challenges outlined "
        f"for this role directly align with my technical background and passion for solving complex engineering problems."
    )

    # Paragraph 2: Evidence & Closing
    if project_phrase:
        p2 = (
            f"{project_phrase}, I demonstrated my ability to take ownership of features, collaborate effectively, "
            f"and write maintainable, tested code. I am eager to bring this same dedication to {company} "
            f"and contribute to your upcoming product milestones. Thank you for considering my application; "
            f"I look forward to discussing how my skills match your team's goals."
        )
    else:
        p2 = (
            f"Throughout my development journey, I have prioritized writing reliable code, collaborating across teams, "
            f"and rapidly adapting to modern engineering workflows. I am excited by {company}'s mission and would welcome "
            f"the opportunity to contribute to your engineering goals. Thank you for your time and consideration."
        )

    return f"{p1}\n\n{p2}"


def generate_application_pitch(
    user_profile: Dict[str, Any],
    job_data: Dict[str, Any],
    api_key: str = "",
) -> Dict[str, Any]:
    """
    Generates a personalized, 2-paragraph cover letter pitch connecting candidate's
    profile to the job requirements.

    Args:
        user_profile: Developer profile dict (name, headline, skills, projects, experience, bio).
        job_data: Job posting dict (title, company_name, tech_stack, description, requirements).
        api_key: Google Gemini API key.

    Returns:
        dict: {"cover_letter": str, "ai_enhanced": bool}
    """
    # Clean and format user projects for prompt
    projects_raw = user_profile.get("projects") or []
    formatted_projects = []
    if isinstance(projects_raw, list):
        for p in projects_raw[:3]:
            if isinstance(p, dict):
                title = p.get("title", "")
                desc = p.get("description", "")
                tech = p.get("technologies") or p.get("tech_stack") or []
                tech_str = f" [Tech: {', '.join(tech)}]" if tech else ""
                formatted_projects.append(f"{title}: {desc}{tech_str}")
            elif isinstance(p, str):
                formatted_projects.append(p)

    projects_text = "; ".join(formatted_projects) if formatted_projects else "None specified"

    # Clean experience
    exp_raw = user_profile.get("experience") or []
    formatted_exp = []
    if isinstance(exp_raw, list):
        for e in exp_raw[:2]:
            if isinstance(e, dict):
                role = e.get("title") or e.get("role", "")
                company = e.get("company", "")
                desc = e.get("description", "")
                formatted_exp.append(f"{role} at {company} ({desc})")
            elif isinstance(e, str):
                formatted_exp.append(e)
    exp_text = "; ".join(formatted_exp) if formatted_exp else "None specified"

    skills_list = [str(s) for s in (user_profile.get("skills") or [])]
    skills_text = ", ".join(skills_list) if skills_list else "Not specified"

    job_tech_list = [str(t) for t in (job_data.get("tech_stack") or [])]
    job_tech_text = ", ".join(job_tech_list) if job_tech_list else "Not specified"

    if not api_key:
        fallback = _generate_fallback_pitch(user_profile, job_data)
        return {"cover_letter": fallback, "ai_enhanced": False}

    try:
        from google import genai  # type: ignore
        from google.genai import types  # type: ignore

        client = genai.Client(api_key=api_key)
        prompt = PROMPT_TEMPLATE.format(
            name=user_profile.get("name") or user_profile.get("first_name") or "Candidate",
            headline=user_profile.get("headline") or "Software Developer",
            skills=skills_text,
            projects=projects_text,
            experience=exp_text,
            bio=user_profile.get("bio") or "Not specified",
            job_title=job_data.get("title") or "Software Engineer",
            company_name=job_data.get("company_name") or "Hiring Team",
            job_tech_stack=job_tech_text,
            job_description=job_data.get("description") or "Not specified",
            job_requirements=job_data.get("requirements") or "Not specified",
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.4,
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
        cover_letter = data.get("cover_letter", "").strip()

        if cover_letter:
            # Enforce max length constraint (under 2000 chars for DB field)
            if len(cover_letter) > 1950:
                cover_letter = cover_letter[:1947] + "..."
            return {"cover_letter": cover_letter, "ai_enhanced": True}

    except Exception as exc:
        logger.warning("Gemini application pitch generation failed, falling back to template: %s", exc)

    fallback = _generate_fallback_pitch(user_profile, job_data)
    return {"cover_letter": fallback, "ai_enhanced": False}
