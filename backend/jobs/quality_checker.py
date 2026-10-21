"""
Job Quality, Safety, and Duplicate Detection Engine for DevHire
==============================================================
Analyzes job descriptions for:
1. Missing responsibilities, unclear requirements, and incomplete information.
2. Suspicious indicators (scams, payment requests, questionable links).
3. Duplicate or near-duplicate listings.
4. Actionable improvement tips for employers.
"""

import re
import json
import logging
from typing import List, Dict, Any, Optional
from django.conf import settings

logger = logging.getLogger(__name__)

# Heuristic patterns for scam and suspicious job flags
SUSPICIOUS_PAYMENT_PATTERNS = [
    r'\b(?:pay|send|wire|transfer)\b.*?\b(?:fee|money|funds|deposit|crypto)\b',
    r'\b(?:application|processing|registration|background\s+check|equipment|training|starter\s+kit)\s+fee\b',
    r'\b(?:buy|purchase)\s+(?:your\s+own\s+)?(?:equipment|laptop|software)\s+(?:from|through)\s+(?:our\s+vendor|us)\b',
    r'\b(?:cashier(?:\'s)?\s+check|moneygram|western\s+union|gift\s+card(?:s)?)\b',
    r'\b(?:send\s+crypto|btc|usdt|eth)\s+to\b',
    r'\bupfront\s+(?:payment|deposit|investment)\b',
]

QUESTIONABLE_LINK_PATTERNS = [
    r'https?://(?:bit\.ly|tinyurl\.com|cutt\.ly|goo\.gl|is\.gd|rb\.gy|t\.co)/\S+',
    r'(?:t\.me/|telegram(?:\.me)?/|whatsapp\.com/chat/|wa\.me/)\S+',
    r'\b(?:contact|dm|message)\s+(?:me|us)?\s*(?:on|via)\s+(?:telegram|whatsapp|signal)\b',
    r'\b(?:send|email)\s+(?:your\s+)?resume\s+to\s+[a-zA-Z0-9._%+-]+@(?:gmail|yahoo|hotmail|outlook)\.com\b',
]

UNREALISTIC_EARNING_PATTERNS = [
    r'\bearn\s+\$?[1-9]\d{3,}\s*(?:per|/)\s*(?:week|day)\s+no\s+(?:experience|skills)\b',
    r'\bguaranteed\s+\$?[1-9]\d{3,}\s+(?:weekly|daily)\b',
    r'\bget\s+rich\s+quick\b',
]

RESPONSIBILITY_KEYWORDS = [
    'responsibilit', 'duties', 'what you\'ll do', 'what you will do', 'role overview',
    'you will', 'key tasks', 'day-to-day', 'build', 'develop', 'architect', 'design',
    'maintain', 'collaborate', 'implement', 'lead', 'coordinate'
]

REQUIREMENT_KEYWORDS = [
    'requirement', 'qualification', 'skills', 'experience', 'must have',
    'proficien', 'bachelor', 'degree', 'familiarity', 'competenc', 'years of'
]


def _tokenize(text: str) -> set:
    """Extract lowercased alphanumeric words of length >= 3."""
    words = re.findall(r'[a-zA-Z0-9]+', (text or '').lower())
    return {w for w in words if len(w) >= 3}


def _jaccard_similarity(set_a: set, set_b: set) -> float:
    if not set_a or not set_b:
        return 0.0
    intersection = len(set_a.intersection(set_b))
    union = len(set_a.union(set_b))
    return float(intersection) / float(union) if union > 0 else 0.0


def check_duplicate_listing(
    title: str,
    description: str,
    requirements: str,
    company_id: Optional[int] = None,
    exclude_job_id: Optional[int] = None,
) -> Optional[Dict[str, Any]]:
    """
    Check if this job is an identical or near-duplicate of an existing active job.
    """
    from .models import Job

    qs = Job.objects.filter(is_active=True)
    if exclude_job_id:
        qs = qs.exclude(id=exclude_job_id)

    # First check jobs by the same company (higher priority match)
    company_jobs = qs.filter(company_id=company_id) if company_id else qs.none()

    new_title_tokens = _tokenize(title)
    new_body_tokens = _tokenize(f"{description} {requirements}")

    # Check same company first
    for candidate in company_jobs[:20]:
        cand_title_tokens = _tokenize(candidate.title)
        cand_body_tokens = _tokenize(f"{candidate.description} {candidate.requirements}")

        title_sim = _jaccard_similarity(new_title_tokens, cand_title_tokens)
        body_sim = _jaccard_similarity(new_body_tokens, cand_body_tokens)

        if (title_sim >= 0.85 and body_sim >= 0.65) or body_sim >= 0.80:
            return {
                "type": "potential_duplicate",
                "severity": "warning",
                "message": f"This listing is highly similar to your existing active job '{candidate.title}' (ID #{candidate.id}).",
                "matched_job_id": candidate.id,
                "similarity_score": round(max(title_sim, body_sim) * 100),
            }

    # Also check platform-wide for exact clones (potential copied spam)
    for candidate in qs.exclude(company_id=company_id)[:30]:
        cand_title_tokens = _tokenize(candidate.title)
        cand_body_tokens = _tokenize(f"{candidate.description} {candidate.requirements}")

        title_sim = _jaccard_similarity(new_title_tokens, cand_title_tokens)
        body_sim = _jaccard_similarity(new_body_tokens, cand_body_tokens)

        if title_sim >= 0.90 and body_sim >= 0.85:
            return {
                "type": "potential_duplicate",
                "severity": "warning",
                "message": f"This listing appears to be an exact duplicate of an existing active posting (ID #{candidate.id}).",
                "matched_job_id": candidate.id,
                "similarity_score": round(body_sim * 100),
            }

    return None


def detect_safety_warning_flags(text: str) -> List[Dict[str, Any]]:
    """Scan text for recruitment scams, suspicious payment requests, or questionable links."""
    flags = []
    lower_text = text.lower()

    # 1. Suspicious payment flags
    for pattern in SUSPICIOUS_PAYMENT_PATTERNS:
        match = re.search(pattern, lower_text, re.IGNORECASE)
        if match:
            flags.append({
                "type": "suspicious_payment",
                "severity": "danger",
                "message": "Potential fee/payment request detected: Legitimate employers never ask candidates to pay fees or purchase equipment upfront.",
                "evidence": match.group(0)[:80],
            })
            break

    # 2. Questionable external link / Telegram contact
    for pattern in QUESTIONABLE_LINK_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            flags.append({
                "type": "questionable_link",
                "severity": "warning",
                "message": "Questionable contact method or link shortener detected: dev hiring typically takes place via official company domains or direct platform messaging.",
                "evidence": match.group(0)[:80],
            })
            break

    # 3. Unrealistic promises
    for pattern in UNREALISTIC_EARNING_PATTERNS:
        match = re.search(pattern, lower_text, re.IGNORECASE)
        if match:
            flags.append({
                "type": "unrealistic_promise",
                "severity": "warning",
                "message": "Unrealistic or misleading compensation claim detected.",
                "evidence": match.group(0)[:80],
            })
            break

    return flags


def evaluate_job_quality_heuristic(
    title: str,
    description: str,
    requirements: str,
    tech_stack: Optional[List[str]] = None,
    salary_min: Optional[int] = None,
    salary_max: Optional[int] = None,
    location: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Deterministic rule-based evaluation of job clarity, completeness, and structure.
    Returns quality_score (0-100), missing_elements, and suggestions.
    """
    desc_words = len(re.findall(r'\w+', description or ''))
    req_words = len(re.findall(r'\w+', requirements or ''))
    total_words = desc_words + req_words
    tech_count = len(tech_stack or [])

    score = 100
    missing_elements = []
    suggestions = []

    # Title check
    clean_title = (title or '').strip()
    if len(clean_title) < 5:
        score -= 15
        missing_elements.append("Descriptive job title")
        suggestions.append("Provide a clear, specific job title (e.g. 'Senior Full-Stack Engineer').")

    # Description length and clarity
    if desc_words < 20:
        score -= 25
        missing_elements.append("Detailed job description")
        suggestions.append("Expand the job description to explain the team's mission, product, and core work (at least 40-60 words).")
    elif desc_words < 45:
        score -= 10
        suggestions.append("Consider adding more context about your engineering culture and day-to-day challenges.")

    # Responsibilities presence
    desc_lower = (description or '').lower()
    has_responsibilities = any(k in desc_lower for k in RESPONSIBILITY_KEYWORDS) or '\n-' in (description or '') or '\n*' in (description or '')
    if not has_responsibilities and desc_words < 80:
        score -= 15
        missing_elements.append("Explicit responsibilities / day-to-day tasks")
        suggestions.append("Detail key responsibilities or daily tasks so candidates know what to expect.")

    # Requirements presence and quality
    req_lower = (requirements or '').lower()
    if req_words < 15:
        score -= 20
        missing_elements.append("Clear qualification requirements")
        suggestions.append("List specific requirements (e.g. years of experience, languages, or domain knowledge).")
    elif not any(k in req_lower for k in REQUIREMENT_KEYWORDS) and '\n-' not in (requirements or ''):
        score -= 10
        suggestions.append("Format requirements as concise bullet points with specific technical skills.")

    # Tech stack tags
    if tech_count == 0:
        score -= 15
        missing_elements.append("Tech stack tags")
        suggestions.append("Add at least 3-5 tech stack tags (e.g. 'React', 'Python', 'PostgreSQL') to help matching developers find you.")
    elif tech_count < 3:
        score -= 5
        suggestions.append("Add a few more primary tools or frameworks to your tech stack tags.")

    # Salary clarity
    if not salary_min and not salary_max:
        score -= 10
        suggestions.append("Disclosing a salary range boosts qualified applicant volume by up to 50%.")
    elif salary_min and salary_max and salary_min > salary_max:
        score -= 15
        missing_elements.append("Valid salary range")
        suggestions.append("Ensure minimum salary is less than or equal to maximum salary.")

    # Location clarity
    clean_location = (location or '').strip()
    if not clean_location:
        score -= 10
        missing_elements.append("Location or remote specification")
        suggestions.append("Specify a clear location or confirm 'Remote' status.")

    score = max(10, min(100, score))

    return {
        "quality_score": score,
        "word_count": total_words,
        "missing_elements": missing_elements,
        "suggestions": suggestions,
        "clarity_rating": "Excellent" if score >= 85 else "Good" if score >= 70 else "Needs Improvement" if score >= 50 else "Poor",
    }


def audit_job_quality_and_safety(
    title: str,
    description: str,
    requirements: str,
    tech_stack: Optional[List[str]] = None,
    salary_min: Optional[int] = None,
    salary_max: Optional[int] = None,
    location: Optional[str] = None,
    company_id: Optional[int] = None,
    exclude_job_id: Optional[int] = None,
    use_ai: bool = True,
) -> Dict[str, Any]:
    """
    Comprehensive audit combining:
    1. Duplicate listing check
    2. Scam / suspicious payment & link detection
    3. Completeness & quality scoring
    4. Optional Gemini AI deep analysis
    """
    combined_text = f"{title}\n\n{description}\n\n{requirements}\n\nLocation: {location or ''}"

    # 1. Duplicate check
    duplicate_flag = check_duplicate_listing(
        title=title,
        description=description,
        requirements=requirements,
        company_id=company_id,
        exclude_job_id=exclude_job_id,
    )

    # 2. Safety flags
    safety_flags = detect_safety_warning_flags(combined_text)
    if duplicate_flag:
        safety_flags.insert(0, duplicate_flag)

    # 3. Heuristic quality baseline
    heuristic_res = evaluate_job_quality_heuristic(
        title=title,
        description=description,
        requirements=requirements,
        tech_stack=tech_stack,
        salary_min=salary_min,
        salary_max=salary_max,
        location=location,
    )

    quality_score = heuristic_res["quality_score"]
    missing_elements = heuristic_res["missing_elements"]
    suggestions = heuristic_res["suggestions"]
    ai_enhanced = False

    # Penalty for safety flags
    has_danger_flag = any(f.get("severity") == "danger" for f in safety_flags)
    has_warning_flag = any(f.get("severity") == "warning" for f in safety_flags)

    if has_danger_flag:
        quality_score = min(quality_score, 35)
    elif has_warning_flag:
        quality_score = max(10, quality_score - 20)

    # 4. Optional Gemini AI audit if API key is configured
    api_key = getattr(settings, 'GEMINI_API_KEY', '')
    if use_ai and api_key and len(description or '') > 20:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)
            ai_prompt = f"""You are an expert recruitment safety and quality auditor at DevHire.
Evaluate this job post for:
1. Missing responsibilities or vague requirements
2. Suspicious elements, scam flags, or misleading claims
3. Specific actionable tips to improve clarity

Job Title: {title}
Location: {location}
Tech Stack: {tech_stack}
Description:
{description}

Requirements:
{requirements}

Return strictly a JSON object:
{{
  "ai_score_adjustment": 0,
  "missing_elements": ["element 1", "element 2"],
  "actionable_tips": ["tip 1", "tip 2"],
  "suspicious_notes": []
}}
"""
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=ai_prompt,
                config=types.GenerateContentConfig(
                    system_instruction="You are an AI job listing quality and fraud protection system. Return valid JSON only.",
                    temperature=0.2,
                    response_mime_type="application/json",
                ),
            )
            raw = (response.text or "").strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
                raw = raw.strip()

            ai_data = json.loads(raw)
            extra_missing = ai_data.get("missing_elements", [])
            for item in extra_missing:
                if item and item not in missing_elements:
                    missing_elements.append(item)

            extra_tips = ai_data.get("actionable_tips", [])
            for tip in extra_tips:
                if tip and tip not in suggestions:
                    suggestions.append(tip)

            # AI suspicious notes
            for note in ai_data.get("suspicious_notes", []):
                if note and not any(f.get("evidence") == note for f in safety_flags):
                    safety_flags.append({
                        "type": "ai_flagged_concern",
                        "severity": "warning",
                        "message": note,
                    })

            ai_enhanced = True
        except Exception as exc:
            logger.info("Gemini AI job audit skipped/failed, using heuristic engine: %s", exc)

    # 5. Determine moderation status
    # Listings with severe fraud flags or severe duplicates are flagged for admin human review
    should_flag = has_danger_flag or (duplicate_flag is not None) or (quality_score < 40)
    moderation_status = "flagged" if should_flag else "approved"

    return {
        "quality_score": quality_score,
        "moderation_status": moderation_status,
        "is_flagged_for_review": should_flag,
        "missing_elements": missing_elements[:6],
        "suggestions": suggestions[:6],
        "safety_flags": safety_flags,
        "ai_enhanced": ai_enhanced,
    }
