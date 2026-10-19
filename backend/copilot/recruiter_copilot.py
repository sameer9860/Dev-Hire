"""
AI Recruiter Copilot Engine for DevHire
=========================================
Assists recruiters and hiring managers in:
1. Natural-language candidate search & ranking across applicants
2. Candidate summaries tailored to job requirements
3. Side-by-side applicant comparison
4. Custom technical & behavioral interview question generation
5. Professional interview invitation & follow-up message drafting

Public API:
  search_candidates(query, candidates, job_info=None, api_key="") -> dict
  summarize_candidate(candidate, job_info, api_key="") -> dict
  compare_candidates(candidates, job_info, api_key="") -> dict
  generate_interview_questions(candidate, job_info, api_key="") -> dict
  draft_recruiter_message(candidate, job_info, message_type, extra_details="", api_key="") -> dict
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


# ── Helper: Candidate representation for prompts ────────────────────────────

def format_candidate_for_prompt(c: Dict[str, Any]) -> str:
    """Format candidate profile dict into a concise text block."""
    skills_str = ", ".join(str(s) for s in (c.get("skills") or [])) or "None listed"

    projects_list = []
    for p in (c.get("projects") or [])[:3]:
        if isinstance(p, dict):
            projects_list.append(f"{p.get('title', 'Project')}: {p.get('description', '')[:120]}")
        elif isinstance(p, str):
            projects_list.append(p[:120])
    projects_str = "; ".join(projects_list) if projects_list else "None listed"

    exp_list = []
    for e in (c.get("experience") or [])[:3]:
        if isinstance(e, dict):
            exp_list.append(f"{e.get('title') or e.get('role', 'Role')} at {e.get('company', 'Company')} ({e.get('duration', '')})")
        elif isinstance(e, str):
            exp_list.append(e[:100])
    exp_str = "; ".join(exp_list) if exp_list else "None listed"

    return (
        f"ID: {c.get('id')} | Name: {c.get('name', 'Candidate')} | Headline: {c.get('headline', '')}\n"
        f"Skills: {skills_str}\n"
        f"Experience: {exp_str}\n"
        f"Projects: {projects_str}\n"
        f"Cover Letter snippet: {str(c.get('cover_letter', ''))[:200]}"
    )


# ── 1. Natural Language Candidate Search ─────────────────────────────────────

SEARCH_SYSTEM_INSTRUCTION = (
    "You are an expert technical recruiter assistant. Given a recruiter's natural-language search query "
    "and a list of applicants, evaluate how well each applicant satisfies the recruiter's criteria. "
    "Rank the candidates by fit, assign a match score (0-100), identify matching highlights with evidence "
    "from their profile, and note any potential gaps.\n\n"
    "Return ONLY valid JSON matching this schema:\n"
    "{\n"
    '  "results": [\n'
    '    {\n'
    '      "candidate_id": <int>,\n'
    '      "match_score": <int 0-100>,\n'
    '      "fit_level": "<High|Medium|Low>",\n'
    '      "summary": "<1-2 sentence evidence-based summary of fit>",\n'
    '      "highlights": ["<highlight 1>", "<highlight 2>"],\n'
    '      "potential_gaps": ["<gap 1>"]\n'
    '    }\n'
    '  ]\n'
    "}"
)

def search_candidates(
    query: str,
    candidates: List[Dict[str, Any]],
    job_info: Optional[Dict[str, Any]] = None,
    api_key: str = "",
) -> Dict[str, Any]:
    """
    Search and rank candidates using natural language.
    """
    if not candidates:
        return {"results": [], "query": query, "ai_enhanced": False}

    # Prepare fallback ranking first
    fallback_results = _fallback_search(query, candidates)

    if not api_key:
        return {
            "results": fallback_results,
            "query": query,
            "ai_enhanced": False,
        }

    try:
        from google import genai  # type: ignore
        from google.genai import types  # type: ignore

        client = genai.Client(api_key=api_key)

        candidates_text = "\n---\n".join(format_candidate_for_prompt(c) for c in candidates[:25])
        job_context = ""
        if job_info:
            job_context = (
                f"\nContext Job Posting: {job_info.get('title', '')}\n"
                f"Requirements: {job_info.get('requirements', '')[:300]}\n"
                f"Tech Stack: {', '.join(job_info.get('tech_stack') or [])}\n"
            )

        prompt = (
            f"Recruiter Search Query: \"{query}\"\n"
            f"{job_context}\n"
            f"Applicants Pool ({len(candidates)} candidates):\n"
            f"{candidates_text}\n\n"
            f"Analyze all candidates against the query and return the ranked results JSON."
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SEARCH_SYSTEM_INSTRUCTION,
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
        results = data.get("results") or []

        # Merge candidate objects back
        cand_map = {c["id"]: c for c in candidates}
        final_results = []
        for r in results:
            cid = r.get("candidate_id")
            if cid in cand_map:
                cand_copy = dict(cand_map[cid])
                cand_copy.update({
                    "match_score": int(r.get("match_score", 50)),
                    "fit_level": r.get("fit_level", "Medium"),
                    "copilot_summary": r.get("summary", ""),
                    "highlights": r.get("highlights", []),
                    "potential_gaps": r.get("potential_gaps", []),
                })
                final_results.append(cand_copy)

        final_results.sort(key=lambda x: x.get("match_score", 0), reverse=True)
        if final_results:
            return {
                "results": final_results,
                "query": query,
                "ai_enhanced": True,
            }

    except Exception as exc:
        logger.warning("Gemini candidate search failed, using fallback: %s", exc)

    return {
        "results": fallback_results,
        "query": query,
        "ai_enhanced": False,
    }


def _fallback_search(query: str, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Heuristic keyword matching & scoring fallback."""
    terms = [t.lower().strip() for t in re.split(r'[,;\s]+', query) if len(t.strip()) > 1]
    results = []

    for c in candidates:
        score = 30  # base
        highlights = []
        gaps = []

        cand_skills = {str(s).lower() for s in (c.get("skills") or [])}
        cand_text = " ".join([
            str(c.get("headline") or "").lower(),
            str(c.get("bio") or "").lower(),
            str(c.get("cover_letter") or "").lower(),
            " ".join(str(p.get("description", "")) for p in (c.get("projects") or []) if isinstance(p, dict)).lower(),
        ])

        matched_terms = []
        missing_terms = []
        for t in terms:
            if t in cand_skills:
                score += 20
                matched_terms.append(t)
            elif t in cand_text:
                score += 10
                matched_terms.append(t)
            else:
                missing_terms.append(t)

        score = min(max(score, 10), 98)

        if matched_terms:
            highlights.append(f"Demonstrated skills/keywords: {', '.join(matched_terms[:4])}")
        if c.get("projects"):
            highlights.append(f"Documented {len(c.get('projects'))} portfolio projects")
        if missing_terms:
            gaps.append(f"No direct mention of: {', '.join(missing_terms[:3])}")

        fit_level = "High" if score >= 75 else "Medium" if score >= 50 else "Low"
        summary = (
            f"Candidate matches {len(matched_terms)} query criteria with {score}% estimated relevance."
            if matched_terms
            else "Candidate has limited documented overlap with the search query."
        )

        cand_copy = dict(c)
        cand_copy.update({
            "match_score": score,
            "fit_level": fit_level,
            "copilot_summary": summary,
            "highlights": highlights,
            "potential_gaps": gaps,
        })
        results.append(cand_copy)

    results.sort(key=lambda x: x.get("match_score", 0), reverse=True)
    return results


# ── 2. Candidate Summary for Job ─────────────────────────────────────────────

def summarize_candidate(
    candidate: Dict[str, Any],
    job_info: Dict[str, Any],
    api_key: str = "",
) -> Dict[str, Any]:
    """
    Generate an executive candidate summary assessing fit for a specific job.
    """
    cand_name = candidate.get("name") or candidate.get("username") or "Candidate"
    job_title = job_info.get("title", "Position")

    if not api_key:
        return _fallback_summary(candidate, job_info)

    try:
        from google import genai  # type: ignore
        from google.genai import types  # type: ignore

        client = genai.Client(api_key=api_key)

        prompt = (
            f"Job Position: {job_title}\n"
            f"Required Tech Stack: {', '.join(job_info.get('tech_stack') or [])}\n"
            f"Job Requirements: {job_info.get('requirements', '')[:400]}\n\n"
            f"Candidate:\n{format_candidate_for_prompt(candidate)}\n\n"
            f"Write a concise executive recruiter briefing on this applicant for {job_title}. "
            f"Include overall assessment, key strengths, potential gaps, and a suggested recommendation."
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are a talent acquisition specialist. Return JSON with schema:\n"
                    "{\n"
                    '  "overview": "<2-3 sentence recruiter briefing>",\n'
                    '  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],\n'
                    '  "gaps": ["<gap 1>", "<gap 2>"],\n'
                    '  "recommendation": "<Proceed to Screen|Deep Dive Technical|Strong Hire|Hold>",\n'
                    '  "recommendation_reason": "<1 sentence reasoning>"\n'
                    "}"
                ),
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
        data["ai_enhanced"] = True
        return data

    except Exception as exc:
        logger.warning("Gemini candidate summary failed, using fallback: %s", exc)

    return _fallback_summary(candidate, job_info)


def _fallback_summary(candidate: Dict[str, Any], job_info: Dict[str, Any]) -> Dict[str, Any]:
    cand_name = candidate.get("name") or candidate.get("username") or "Candidate"
    job_title = job_info.get("title", "Position")
    cand_skills = {str(s).lower() for s in (candidate.get("skills") or [])}
    req_skills = [str(s) for s in (job_info.get("tech_stack") or [])]

    matching = [s for s in req_skills if s.lower() in cand_skills]
    missing = [s for s in req_skills if s.lower() not in cand_skills]

    strengths = []
    if matching:
        strengths.append(f"Matching technical skills: {', '.join(matching)}")
    if candidate.get("projects"):
        strengths.append(f"Has built {len(candidate.get('projects'))} documented projects")
    if candidate.get("headline"):
        strengths.append(f"Focused headline: {candidate.get('headline')}")

    gaps = []
    if missing:
        gaps.append(f"Missing core requirements: {', '.join(missing[:3])}")
    else:
        gaps.append("Verify depth of practical experience during technical interview")

    recommendation = "Proceed to Screen" if len(matching) >= max(len(req_skills) // 2, 1) else "Hold"

    return {
        "overview": (
            f"{cand_name} applied for {job_title} with {len(matching)} matching skills out of "
            f"{len(req_skills)} requested."
        ),
        "strengths": strengths or ["Solid foundational profile"],
        "gaps": gaps,
        "recommendation": recommendation,
        "recommendation_reason": f"Matches {len(matching)} required technologies for {job_title}.",
        "ai_enhanced": False,
    }


# ── 3. Compare Candidates Side-by-Side ───────────────────────────────────────

def compare_candidates(
    candidates: List[Dict[str, Any]],
    job_info: Dict[str, Any],
    api_key: str = "",
) -> Dict[str, Any]:
    """
    Compare 2 to 4 candidates side-by-side for a specific job.
    """
    if len(candidates) < 2:
        return {"error": "At least 2 candidates are required for comparison."}

    if not api_key:
        return _fallback_compare(candidates, job_info)

    try:
        from google import genai  # type: ignore
        from google.genai import types  # type: ignore

        client = genai.Client(api_key=api_key)

        cand_blocks = []
        for c in candidates:
            cand_blocks.append(format_candidate_for_prompt(c))

        prompt = (
            f"Target Position: {job_info.get('title', 'Role')}\n"
            f"Job Requirements: {job_info.get('requirements', '')[:400]}\n"
            f"Required Tech Stack: {', '.join(job_info.get('tech_stack') or [])}\n\n"
            f"Candidates to compare:\n"
            + "\n===\n".join(cand_blocks)
            + "\n\nProvide an objective side-by-side comparative analysis of these candidates for this role."
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are a senior tech hiring panel lead. Return JSON matching schema:\n"
                    "{\n"
                    '  "verdict_summary": "<2-3 sentence executive recommendation>",\n'
                    '  "top_pick_id": <int candidate_id>,\n'
                    '  "top_pick_reason": "<1-2 sentence reason for top pick>",\n'
                    '  "candidates_comparison": [\n'
                    '    {\n'
                    '      "candidate_id": <int>,\n'
                    '      "rank": <int 1..N>,\n'
                    '      "key_differentiator": "<what makes them stand out>",\n'
                    '      "strongest_fit_area": "<area of highest capability>",\n'
                    '      "biggest_risk": "<main concern or gap to investigate>",\n'
                    '      "recommended_action": "<Invite to Tech Interview|Review Projects|Consider for Alternative Role>"\n'
                    '    }\n'
                    '  ]\n'
                    "}"
                ),
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
        data["ai_enhanced"] = True
        return data

    except Exception as exc:
        logger.warning("Gemini candidate comparison failed, using fallback: %s", exc)

    return _fallback_compare(candidates, job_info)


def _fallback_compare(candidates: List[Dict[str, Any]], job_info: Dict[str, Any]) -> Dict[str, Any]:
    req_skills = {str(s).lower() for s in (job_info.get("tech_stack") or [])}

    scored = []
    for c in candidates:
        cand_skills = {str(s).lower() for s in (c.get("skills") or [])}
        matching = req_skills.intersection(cand_skills)
        match_count = len(matching)
        num_projects = len(c.get("projects") or [])
        score = (match_count * 20) + (num_projects * 5)
        scored.append((score, match_count, c))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_cand = scored[0][2]

    comparisons = []
    for rank, (score, match_count, c) in enumerate(scored, 1):
        missing = [s for s in req_skills if s not in {str(k).lower() for k in (c.get("skills") or [])}]
        comparisons.append({
            "candidate_id": c["id"],
            "rank": rank,
            "key_differentiator": f"{match_count} direct skill matches with {len(c.get('projects') or [])} projects",
            "strongest_fit_area": c.get("headline") or "Software Engineering",
            "biggest_risk": f"Missing direct evidence for: {', '.join(missing[:2])}" if missing else "Needs hands-on coding verification",
            "recommended_action": "Invite to Tech Interview" if rank == 1 else "Review Projects & Hold",
        })

    return {
        "verdict_summary": f"Based on skill coverage and portfolio depth, {top_cand.get('name', 'Top candidate')} leads the group.",
        "top_pick_id": top_cand["id"],
        "top_pick_reason": f"Demonstrated {scored[0][1]} matching tech stack requirements.",
        "candidates_comparison": comparisons,
        "ai_enhanced": False,
    }


# ── 4. Interview Question Generator ──────────────────────────────────────────

def generate_interview_questions(
    candidate: Dict[str, Any],
    job_info: Dict[str, Any],
    api_key: str = "",
) -> Dict[str, Any]:
    """
    Generate tailored technical and behavioral interview questions for a candidate.
    """
    job_title = job_info.get("title", "Software Engineer")

    if not api_key:
        return _fallback_interview_questions(candidate, job_info)

    try:
        from google import genai  # type: ignore
        from google.genai import types  # type: ignore

        client = genai.Client(api_key=api_key)

        prompt = (
            f"Job Title: {job_title}\n"
            f"Tech Stack: {', '.join(job_info.get('tech_stack') or [])}\n"
            f"Job Requirements: {job_info.get('requirements', '')[:400]}\n\n"
            f"Candidate Profile:\n{format_candidate_for_prompt(candidate)}\n\n"
            f"Generate 5 high-impact, tailored interview questions specifically connecting the candidate's "
            f"actual experience/projects with this job's needs. Include 3 technical questions and 2 behavioral questions."
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are an expert technical interviewer at a high-growth tech company. "
                    "Return ONLY valid JSON with schema:\n"
                    "{\n"
                    '  "interview_focus": "<1-2 sentence focus area for the interviewer>",\n'
                    '  "questions": [\n'
                    '    {\n'
                    '      "type": "<technical|behavioral|project-deep-dive>",\n'
                    '      "question": "<the tailored question>",\n'
                    '      "why_ask": "<why this matters given candidate profile & job requirements>",\n'
                    '      "look_for": "<positive signal to look for in the answer>"\n'
                    '    }\n'
                    '  ]\n'
                    "}"
                ),
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
        data["ai_enhanced"] = True
        return data

    except Exception as exc:
        logger.warning("Gemini interview question generation failed, using fallback: %s", exc)

    return _fallback_interview_questions(candidate, job_info)


def _fallback_interview_questions(candidate: Dict[str, Any], job_info: Dict[str, Any]) -> Dict[str, Any]:
    job_title = job_info.get("title", "Developer")
    skills = candidate.get("skills") or job_info.get("tech_stack") or ["Software Engineering"]
    primary_skill = skills[0] if skills else "Python"
    second_skill = skills[1] if len(skills) > 1 else "Database"

    first_proj = (candidate.get("projects") or [{}])[0]
    proj_title = first_proj.get("title") if isinstance(first_proj, dict) else "your recent project"

    return {
        "interview_focus": f"Evaluate practical depth in {primary_skill} and real-world implementation decisions in {proj_title or 'past projects'}.",
        "questions": [
            {
                "type": "project-deep-dive",
                "question": f"In {proj_title or 'your recent project'}, what was the most difficult architectural tradeoff you made, and what would you do differently today?",
                "why_ask": "Tests real engineering judgment, reflection, and technical maturity rather than textbook answers.",
                "look_for": "Clear explanation of constraints, alternative approaches considered, and measured outcomes.",
            },
            {
                "type": "technical",
                "question": f"How do you handle database query optimization and avoid N+1 bottlenecks when building services with {second_skill}?",
                "why_ask": f"Directly tests production performance awareness for {job_title}.",
                "look_for": "Mentions of eager loading (select_related/prefetch_related or joins), indexing, and profiling tools.",
            },
            {
                "type": "technical",
                "question": f"Walk me through how you design and secure an authenticated REST API endpoint in {primary_skill}.",
                "why_ask": "Verifies end-to-end API design security, validation, and token handling.",
                "look_for": "Talks about JWT/session authentication, permission checks, rate limiting, and schema validation.",
            },
            {
                "type": "behavioral",
                "question": "Tell me about a time you received critical code review feedback or had a disagreement with a team member. How did you handle it?",
                "why_ask": "Evaluates teamwork, communication skills, and ability to collaborate productively.",
                "look_for": "Humility, focus on team goals, and objective reasoning.",
            },
            {
                "type": "behavioral",
                "question": f"When faced with an unfamiliar technology required for {job_title}, what is your approach to getting up to speed quickly?",
                "why_ask": "Assesses growth mindset and independent problem-solving skills.",
                "look_for": "Structured learning habits, reading docs, building quick spike prototypes.",
            },
        ],
        "ai_enhanced": False,
    }


# ── 5. Recruiter Message & Interview Drafter ─────────────────────────────────

MESSAGE_TEMPLATES = {
    "interview_invite": {
        "subject": "Interview Invitation: {job_title} at {company_name}",
        "body": (
            "Hi {candidate_name},\n\n"
            "Thank you for applying to the {job_title} position at {company_name}. We reviewed your application and were "
            "especially impressed by your background in {highlight}.\n\n"
            "We would love to invite you to a 30-minute introductory technical discussion to learn more about your experience "
            "and share more about our engineering challenges.\n\n"
            "{extra_details}\n\n"
            "Please let us know your availability over the next few days.\n\n"
            "Best regards,\n"
            "The {company_name} Hiring Team"
        ),
    },
    "technical_screen": {
        "subject": "Next Steps: Technical Screen for {job_title}",
        "body": (
            "Hi {candidate_name},\n\n"
            "Great connecting with you! We'd like to move forward to the technical screening stage for {job_title}.\n\n"
            "This stage will focus on practical problem solving and your experience with {highlight}.\n\n"
            "{extra_details}\n\n"
            "Looking forward to our conversation.\n\n"
            "Best regards,\n"
            "{company_name} Team"
        ),
    },
    "follow_up": {
        "subject": "Follow-Up on your application for {job_title} at {company_name}",
        "body": (
            "Hi {candidate_name},\n\n"
            "We wanted to follow up on your recent application for {job_title}. Our hiring team is actively reviewing "
            "profiles and we are interested in learning more about your availability.\n\n"
            "{extra_details}\n\n"
            "Warm regards,\n"
            "{company_name}"
        ),
    },
    "rejection_polite": {
        "subject": "Update on your application for {job_title} at {company_name}",
        "body": (
            "Hi {candidate_name},\n\n"
            "Thank you for taking the time to apply for the {job_title} position at {company_name} and sharing your work with us.\n\n"
            "While your experience with {highlight} is impressive, we have decided to move forward with candidates whose specific background "
            "more closely aligns with our immediate technical requirements for this role.\n\n"
            "We appreciate your interest in {company_name} and wish you the best in your job search.\n\n"
            "Sincerely,\n"
            "The {company_name} Team"
        ),
    },
}

def draft_recruiter_message(
    candidate: Dict[str, Any],
    job_info: Dict[str, Any],
    message_type: str = "interview_invite",
    extra_details: str = "",
    api_key: str = "",
) -> Dict[str, Any]:
    """
    Draft personalized recruiter outreach, invitation, or follow-up note.
    """
    cand_name = candidate.get("first_name") or candidate.get("name") or "there"
    job_title = job_info.get("title", "Engineering Role")
    company_name = job_info.get("company_name") or "our company"

    skills = candidate.get("skills") or []
    highlight = ", ".join(str(s) for s in skills[:3]) if skills else "your software engineering background"

    template = MESSAGE_TEMPLATES.get(message_type, MESSAGE_TEMPLATES["interview_invite"])

    if not api_key:
        subject = template["subject"].format(
            job_title=job_title,
            company_name=company_name,
        )
        body = template["body"].format(
            candidate_name=cand_name,
            job_title=job_title,
            company_name=company_name,
            highlight=highlight,
            extra_details=extra_details.strip() if extra_details else "Let us know a time that works best for you.",
        )
        return {"subject": subject, "body": body, "ai_enhanced": False}

    try:
        from google import genai  # type: ignore
        from google.genai import types  # type: ignore

        client = genai.Client(api_key=api_key)

        prompt = (
            f"Draft a professional {message_type.replace('_', ' ')} message to an applicant.\n"
            f"Candidate Name: {cand_name}\n"
            f"Role: {job_title}\n"
            f"Company: {company_name}\n"
            f"Candidate Profile: {format_candidate_for_prompt(candidate)}\n"
            f"Recruiter Notes/Details to Include: {extra_details or 'None'}\n\n"
            f"Write a warm, concise, professional message. Mention 1 specific strength from their profile."
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are an empathetic executive tech recruiter. Return JSON with schema:\n"
                    "{\n"
                    '  "subject": "<Email/Message Subject Line>",\n'
                    '  "body": "<Complete message body with proper greetings and sign-off>"\n'
                    "}"
                ),
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
        return {
            "subject": data.get("subject", template["subject"].format(job_title=job_title, company_name=company_name)),
            "body": data.get("body", ""),
            "ai_enhanced": True,
        }

    except Exception as exc:
        logger.warning("Gemini message drafting failed, using fallback: %s", exc)

    subject = template["subject"].format(
        job_title=job_title,
        company_name=company_name,
    )
    body = template["body"].format(
        candidate_name=cand_name,
        job_title=job_title,
        company_name=company_name,
        highlight=highlight,
        extra_details=extra_details.strip() if extra_details else "Let us know a time that works best for you.",
    )
    return {"subject": subject, "body": body, "ai_enhanced": False}
