"""
AI Career Coach Engine for DevHire
====================================
Analyzes a developer's profile against real job market demands,
identifies skill gaps, and generates a personalized 30/60-day
learning roadmap with concrete, actionable tasks.

Public API:
  generate_career_roadmap(user_profile, target_role, duration_days, job_samples, api_key="") -> dict
"""

import json
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = (
    "You are an expert software engineering career coach specializing in helping junior and mid-level "
    "developers break into their target roles. Your task is to analyze a developer's current profile "
    "and generate a highly practical, personalized career roadmap.\n\n"
    "Guidelines:\n"
    "1. Identify 3-6 specific skill gaps between the developer's current skills and the target role requirements.\n"
    "2. Generate a structured roadmap with concrete weekly tasks that a developer can act on immediately.\n"
    "3. Each task should have: a title, short description, category (learn/build/practice/read/apply), "
    "an optional free resource URL, and the week number it belongs to.\n"
    "4. Tasks should be realistic for a working developer (no more than 8-10 tasks per week).\n"
    "5. Recommend at least 1-2 portfolio projects that demonstrate the missing skills.\n"
    "6. Write a short 2-3 sentence personalized summary for the developer.\n"
    "7. Return ONLY valid JSON matching the schema below — no markdown, no extra text.\n"
    "Schema:\n"
    "{\n"
    '  "summary": "<2-3 sentence personalized analysis and encouragement>",\n'
    '  "skill_gaps": ["<gap1>", "<gap2>", ...],\n'
    '  "tasks": [\n'
    '    {\n'
    '      "title": "<action-oriented task title>",\n'
    '      "description": "<1-2 sentence description>",\n'
    '      "category": "<learn|build|practice|read|apply>",\n'
    '      "resource_url": "<optional direct link to free resource>",\n'
    '      "week": <week_number_int>\n'
    "    }\n"
    "  ]\n"
    "}"
)

PROMPT_TEMPLATE = """Developer Profile:
- Name: {name}
- Headline: {headline}
- Current Skills: {skills}
- Projects Built: {projects}
- Work Experience: {experience}
- Bio: {bio}

Target Role: {target_role}
Roadmap Duration: {duration_days} days ({num_weeks} weeks)

Top Job Market Requirements for "{target_role}" (from real listings):
{job_samples}

Analyze this developer's profile, identify what skills they are missing for the target role,
and generate a structured {duration_days}-day learning roadmap with specific weekly tasks.
Focus on skills the developer DOES NOT already have. Be practical and encouraging.

Return JSON following the schema exactly.
"""


# ── Fallback data: curated roadmaps for common target roles ──────────────────

COMMON_ROADMAPS: Dict[str, Dict[str, Any]] = {
    "junior django developer": {
        "skill_gaps": ["Django REST Framework", "PostgreSQL", "Docker", "JWT Authentication", "Pytest"],
        "tasks_per_week": [
            [
                {"title": "Complete Django for Beginners tutorial", "description": "Work through the official Django tutorial and build a blog app to solidify models, views, and templates.", "category": "learn", "resource_url": "https://docs.djangoproject.com/en/stable/intro/tutorial01/"},
                {"title": "Set up PostgreSQL locally", "description": "Install PostgreSQL, create a database, and connect it to your Django project using psycopg2.", "category": "practice", "resource_url": "https://www.postgresql.org/docs/current/tutorial.html"},
                {"title": "Build a REST API with Django REST Framework", "description": "Create a simple CRUD API for a Todo app using DRF Serializers, ViewSets, and Routers.", "category": "build", "resource_url": "https://www.django-rest-framework.org/tutorial/quickstart/"},
            ],
            [
                {"title": "Implement JWT Authentication", "description": "Add token-based authentication to your API using djangorestframework-simplejwt.", "category": "learn", "resource_url": "https://django-rest-framework-simplejwt.readthedocs.io/"},
                {"title": "Write pytest tests for your API", "description": "Write unit and integration tests for your DRF endpoints using pytest-django.", "category": "practice", "resource_url": "https://pytest-django.readthedocs.io/en/latest/"},
                {"title": "Containerize with Docker", "description": "Write a Dockerfile and docker-compose.yml for your Django + PostgreSQL project.", "category": "build", "resource_url": "https://docs.docker.com/samples/django/"},
            ],
            [
                {"title": "Build a full Portfolio API project", "description": "Build a complete Django REST API project (e.g., a Job Board or Expense Tracker) with auth, CRUD, tests, and Docker.", "category": "build", "resource_url": ""},
                {"title": "Deploy to Railway or Render", "description": "Deploy your portfolio project to a free cloud platform and add the live URL to your GitHub and DevHire profile.", "category": "apply", "resource_url": "https://railway.app/"},
            ],
        ],
    },
    "full-stack developer": {
        "skill_gaps": ["React", "TypeScript", "REST API Integration", "Git & CI/CD", "Docker"],
        "tasks_per_week": [
            [
                {"title": "Learn React Fundamentals", "description": "Complete the official React tutorial covering components, hooks (useState, useEffect), and props.", "category": "learn", "resource_url": "https://react.dev/learn"},
                {"title": "TypeScript Crash Course", "description": "Go through TypeScript basics — types, interfaces, generics — and convert a small JS project to TS.", "category": "learn", "resource_url": "https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html"},
            ],
            [
                {"title": "Build a frontend that consumes a REST API", "description": "Build a React + TypeScript UI that fetches, displays, and posts data to your own or a public API.", "category": "build", "resource_url": ""},
                {"title": "Learn Git branching and PRs", "description": "Practice git branching, merging, and opening pull requests on GitHub using a personal project.", "category": "practice", "resource_url": "https://learngitbranching.js.org/"},
            ],
            [
                {"title": "Set up a CI/CD pipeline with GitHub Actions", "description": "Add a GitHub Actions workflow that runs lint and tests on every push to your full-stack project.", "category": "build", "resource_url": "https://docs.github.com/en/actions"},
                {"title": "Deploy full-stack app (frontend + backend)", "description": "Deploy your React frontend to Vercel and your API backend to Railway or Render.", "category": "apply", "resource_url": "https://vercel.com/docs"},
            ],
        ],
    },
    "frontend developer": {
        "skill_gaps": ["React", "TypeScript", "CSS Animations", "Accessibility (a11y)", "Performance Optimization"],
        "tasks_per_week": [
            [
                {"title": "Deep-dive into React hooks", "description": "Master useState, useEffect, useRef, useMemo, useCallback, and custom hooks with small focused exercises.", "category": "learn", "resource_url": "https://react.dev/reference/react"},
                {"title": "TypeScript with React", "description": "Learn how to type props, state, events, and API responses in a React + TypeScript project.", "category": "learn", "resource_url": "https://react-typescript-cheatsheet.netlify.app/"},
            ],
            [
                {"title": "Build an animated portfolio page", "description": "Create a personal portfolio site with smooth CSS/Framer Motion animations and responsive layout.", "category": "build", "resource_url": "https://www.framer.com/motion/"},
                {"title": "Accessibility audit and fixes", "description": "Run axe DevTools on your site, identify a11y violations, and fix them (ARIA labels, focus states, color contrast).", "category": "practice", "resource_url": "https://www.deque.com/axe/devtools/"},
            ],
            [
                {"title": "Optimize Core Web Vitals (LCP, CLS, INP)", "description": "Use Lighthouse to audit your portfolio and optimize images, fonts, and layout shifts.", "category": "practice", "resource_url": "https://web.dev/explore/learn-core-web-vitals"},
                {"title": "Contribute to an open-source frontend project", "description": "Find a beginner-friendly issue on GitHub and make a meaningful PR to build public proof of work.", "category": "apply", "resource_url": "https://goodfirstissue.dev/"},
            ],
        ],
    },
}

DEFAULT_SUMMARY_TEMPLATE = (
    "Based on your profile as a {headline}, you're building a solid foundation as a {target_role}. "
    "The roadmap below focuses on the most in-demand skills employers are looking for right now, "
    "turning identified gaps into concrete weekly actions you can start today."
)


def _build_fallback_roadmap(
    user_profile: Dict[str, Any],
    target_role: str,
    duration_days: int,
) -> Dict[str, Any]:
    """
    Build a structured fallback roadmap using curated templates when Gemini is unavailable.
    """
    role_key = target_role.lower().strip()
    template = COMMON_ROADMAPS.get(role_key)

    # Try partial match
    if not template:
        for k, v in COMMON_ROADMAPS.items():
            if any(word in role_key for word in k.split()):
                template = v
                break

    # Generic fallback
    if not template:
        template = {
            "skill_gaps": ["Automated Testing", "Docker", "CI/CD", "Cloud Deployment", "Open Source Contribution"],
            "tasks_per_week": [
                [
                    {"title": f"Research core skills for {target_role}", "description": f"Spend a day surveying job listings for {target_role} and listing the top 5 skills you still need.", "category": "read", "resource_url": ""},
                    {"title": "Set up a dedicated learning project", "description": "Create a GitHub repo for your learning sprint — this becomes a portfolio piece at the end.", "category": "build", "resource_url": ""},
                ],
                [
                    {"title": "Complete an online course for a key skill gap", "description": "Pick the most critical skill gap and commit to finishing a focused course or tutorial this week.", "category": "learn", "resource_url": "https://www.freecodecamp.org/"},
                    {"title": "Write tests for your project", "description": "Add unit tests to your learning project to practice test-driven development.", "category": "practice", "resource_url": ""},
                ],
                [
                    {"title": "Build a portfolio project demonstrating new skills", "description": "Ship something real using the skills you have been learning and add it to your DevHire profile.", "category": "build", "resource_url": ""},
                    {"title": "Apply to 3 relevant positions", "description": "Use your updated skills and new project to apply to at least 3 jobs matching the target role.", "category": "apply", "resource_url": ""},
                ],
            ],
        }

    user_skills = {s.lower().strip() for s in (user_profile.get("skills") or [])}
    skill_gaps = [g for g in template["skill_gaps"] if g.lower() not in user_skills]
    if not skill_gaps:
        skill_gaps = template["skill_gaps"][:3]

    num_weeks = max(duration_days // 7, 1)
    tasks_per_week_data = template["tasks_per_week"]

    tasks = []
    order_counter = 0
    for week_idx in range(num_weeks):
        week_tasks_source = tasks_per_week_data[week_idx % len(tasks_per_week_data)]
        for task in week_tasks_source:
            tasks.append({
                "title": task["title"],
                "description": task["description"],
                "category": task["category"],
                "resource_url": task.get("resource_url", ""),
                "week": week_idx + 1,
                "order": order_counter,
            })
            order_counter += 1

    headline = user_profile.get("headline") or "Software Developer"
    summary = DEFAULT_SUMMARY_TEMPLATE.format(headline=headline, target_role=target_role)

    return {
        "summary": summary,
        "skill_gaps": skill_gaps,
        "tasks": tasks,
    }


def generate_career_roadmap(
    user_profile: Dict[str, Any],
    target_role: str,
    duration_days: int = 30,
    job_samples: Optional[List[Dict[str, Any]]] = None,
    api_key: str = "",
) -> Dict[str, Any]:
    """
    Generates a personalized career roadmap with skill gap analysis.

    Args:
        user_profile: Developer profile dict (name, headline, skills, projects, experience, bio).
        target_role:  The role the developer wants to reach (e.g. "Junior Django Developer").
        duration_days: Roadmap duration, 30 or 60.
        job_samples:  Sample job listings for market context.
        api_key:      Google Gemini API key.

    Returns:
        dict: {"summary": str, "skill_gaps": list, "tasks": list, "ai_enhanced": bool}
    """
    num_weeks = max(duration_days // 7, 1)

    # Format job samples for the prompt
    job_text = "No specific job listings provided."
    if job_samples:
        parts = []
        for j in job_samples[:5]:
            tech = ", ".join(str(t) for t in (j.get("tech_stack") or []))
            parts.append(f"- {j.get('title', 'Role')}: tech_stack=[{tech}], requirements={str(j.get('requirements', ''))[:200]}")
        job_text = "\n".join(parts)

    # Format user data for prompt
    skills_list = [str(s) for s in (user_profile.get("skills") or [])]
    skills_text = ", ".join(skills_list) if skills_list else "Not specified"

    projects_raw = user_profile.get("projects") or []
    proj_parts = []
    if isinstance(projects_raw, list):
        for p in projects_raw[:3]:
            if isinstance(p, dict):
                proj_parts.append(f"{p.get('title', 'Project')}: {p.get('description', '')[:100]}")
            elif isinstance(p, str):
                proj_parts.append(p)
    projects_text = "; ".join(proj_parts) if proj_parts else "None listed"

    exp_raw = user_profile.get("experience") or []
    exp_parts = []
    if isinstance(exp_raw, list):
        for e in exp_raw[:2]:
            if isinstance(e, dict):
                role = e.get("title") or e.get("position") or e.get("role", "Role")
                company = e.get("company", "")
                exp_parts.append(f"{role} at {company}")
            elif isinstance(e, str):
                exp_parts.append(e)
    exp_text = "; ".join(exp_parts) if exp_parts else "None listed"

    if not api_key:
        result = _build_fallback_roadmap(user_profile, target_role, duration_days)
        result["ai_enhanced"] = False
        return result

    try:
        from google import genai  # type: ignore
        from google.genai import types  # type: ignore

        client = genai.Client(api_key=api_key)
        prompt = PROMPT_TEMPLATE.format(
            name=user_profile.get("name") or user_profile.get("first_name") or "Developer",
            headline=user_profile.get("headline") or "Software Developer",
            skills=skills_text,
            projects=projects_text,
            experience=exp_text,
            bio=(user_profile.get("bio") or "Not specified")[:300],
            target_role=target_role,
            duration_days=duration_days,
            num_weeks=num_weeks,
            job_samples=job_text,
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.5,
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
        tasks_raw = data.get("tasks") or []

        # Normalize tasks — add week/order if Gemini omitted them
        tasks = []
        for idx, t in enumerate(tasks_raw):
            if not isinstance(t, dict):
                continue
            week = int(t.get("week", (idx // 4) + 1))
            tasks.append({
                "title": str(t.get("title", ""))[:300],
                "description": str(t.get("description", ""))[:500],
                "category": t.get("category", "learn") if t.get("category") in ("learn", "build", "practice", "read", "apply") else "learn",
                "resource_url": str(t.get("resource_url", ""))[:500],
                "week": week,
                "order": idx,
            })

        if tasks:
            return {
                "summary": str(data.get("summary", ""))[:800],
                "skill_gaps": [str(g) for g in (data.get("skill_gaps") or [])[:8]],
                "tasks": tasks,
                "ai_enhanced": True,
            }

    except Exception as exc:
        logger.warning("Gemini career roadmap generation failed, using fallback: %s", exc)

    result = _build_fallback_roadmap(user_profile, target_role, duration_days)
    result["ai_enhanced"] = False
    return result
