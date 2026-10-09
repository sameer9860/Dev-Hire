import io
import json
import logging
from typing import Any, Dict
from django.conf import settings
import pypdf

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """You are an expert AI Resume Parsing assistant for DevHire, a developer hiring platform.
Your task is to analyze the provided resume text and extract candidate profile details into clean, structured JSON matching the DevHire developer profile format.

Follow these rules:
1. Extract accurately without inventing or hallucinating information.
2. If a field is not present in the resume, provide empty string `""` for string fields, `false` for boolean, and `[]` for arrays.
3. For candidate name, extract first_name and last_name separately.
4. For contact, extract phone_number, location, address (street or district if specified), and profile links (github_url, portfolio_url, linkedin_url).
5. For skills, provide individual distinct technology keywords (e.g. "React", "TypeScript", "Django", "PostgreSQL", "Docker", "Python").
6. For education, extract institution name, degree (e.g. "Bachelor of Computer Science"), field of study, start_year, and end_year.
7. For experience, extract company, role/title, start_date (e.g. "2022-01" or "Jan 2022"), end_date (or empty if current), description summary, and current (boolean).
8. For projects, extract project title, description, list of technologies used, and project url if available.
9. For languages, extract spoken/written languages (e.g. ["English", "Nepali"]).
10. For headline, create a professional concise headline if not explicitly stated (e.g. "Full-Stack Developer | Python & React").
11. For bio, provide a professional summary (maximum 500 characters).
"""

JSON_STRUCTURE_PROMPT = """Return a valid JSON object with EXACTLY this structure:
{
  "first_name": string,
  "last_name": string,
  "headline": string,
  "bio": string,
  "phone_number": string,
  "location": string,
  "address": string,
  "github_url": string,
  "portfolio_url": string,
  "linkedin_url": string,
  "skills": [string],
  "education": [
    {
      "institution": string,
      "degree": string,
      "field": string,
      "start_year": string,
      "end_year": string
    }
  ],
  "experience": [
    {
      "company": string,
      "role": string,
      "start_date": string,
      "end_date": string,
      "description": string,
      "current": boolean
    }
  ],
  "projects": [
    {
      "title": string,
      "description": string,
      "technologies": [string],
      "url": string
    }
  ],
  "achievements": [
    {
      "title": string,
      "description": string,
      "date": string
    }
  ],
  "training": [
    {
      "title": string,
      "institution": string,
      "year": string
    }
  ],
  "languages": [string]
}
"""


def extract_text_from_pdf(pdf_file) -> str:
    """
    Extracts text from an uploaded PDF file or file-like object using pypdf.
    Limits to the first 10 pages.
    """
    try:
        if hasattr(pdf_file, 'read'):
            content = pdf_file.read()
            # Reset pointer if possible
            if hasattr(pdf_file, 'seek'):
                pdf_file.seek(0)
            reader = pypdf.PdfReader(io.BytesIO(content))
        elif isinstance(pdf_file, bytes):
            reader = pypdf.PdfReader(io.BytesIO(pdf_file))
        else:
            reader = pypdf.PdfReader(pdf_file)

        extracted_text = []
        for index, page in enumerate(reader.pages[:10]):
            text = page.extract_text()
            if text:
                extracted_text.append(text)

        full_text = "\n\n".join(extracted_text).strip()
        return full_text
    except Exception as e:
        logger.error(f"Failed to extract text from PDF: {e}")
        raise ValueError(f"Unable to read PDF file: {str(e)}")


def parse_resume_with_gemini(resume_text: str, api_key: str = None) -> Dict[str, Any]:
    """
    Sends the extracted resume text to Google Gemini using google-genai
    and returns a normalized structured JSON dictionary.
    """
    key = api_key or getattr(settings, 'GEMINI_API_KEY', '')
    if not key:
        raise ValueError("GEMINI_API_KEY is not configured.")

    if not resume_text or len(resume_text.strip()) < 20:
        raise ValueError("Resume contains insufficient readable text.")

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=key)

    prompt = (
        f"{SYSTEM_INSTRUCTION}\n\n"
        f"{JSON_STRUCTURE_PROMPT}\n\n"
        f"--- CANDIDATE RESUME TEXT ---\n"
        f"{resume_text}\n"
        f"--- END RESUME TEXT ---"
    )

    # Use gemini-2.5-flash with JSON mode
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )

    response_text = response.text or ""
    # Strip any markdown fences just in case
    cleaned = response_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as err:
        logger.error(f"Failed to decode Gemini JSON response: {response_text}")
        raise ValueError(f"Invalid AI response format: {str(err)}")

    return normalize_parsed_resume(data)


def normalize_parsed_resume(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ensures all expected keys and types are properly present and normalized.
    """
    def ensure_str(v):
        return str(v).strip() if v is not None else ""

    def ensure_list_str(v):
        if not isinstance(v, list):
            return []
        return [str(item).strip() for item in v if item]

    def ensure_list_dict(v):
        if not isinstance(v, list):
            return []
        return [item for item in v if isinstance(item, dict)]

    skills = ensure_list_str(raw.get("skills"))
    # Deduplicate skills case-insensitively while preserving formatting
    seen = set()
    deduped_skills = []
    for s in skills:
        lower = s.lower()
        if lower not in seen:
            seen.add(lower)
            deduped_skills.append(s)

    languages = ensure_list_str(raw.get("languages"))

    education = ensure_list_dict(raw.get("education"))
    for item in education:
        for k in ["institution", "degree", "field", "start_year", "end_year", "location", "dates"]:
            item[k] = ensure_str(item.get(k))
        if not item.get("dates"):
            start = item.get("start_year", "")
            end = item.get("end_year", "")
            if start and end:
                item["dates"] = f"{start} - {end}"
            elif start:
                item["dates"] = start
            elif end:
                item["dates"] = end

    experience = ensure_list_dict(raw.get("experience"))
    for item in experience:
        for k in ["company", "role", "position", "start_date", "end_date", "dates", "description"]:
            item[k] = ensure_str(item.get(k))
        pos = item.get("position") or item.get("role")
        item["position"] = pos
        item["role"] = pos
        item["current"] = bool(item.get("current", False))
        if not item.get("dates"):
            start = item.get("start_date", "")
            end = item.get("end_date", "")
            if start and end:
                item["dates"] = f"{start} - {end}"
            elif start and item["current"]:
                item["dates"] = f"{start} - Present"
            elif start:
                item["dates"] = start

    projects = ensure_list_dict(raw.get("projects"))
    for item in projects:
        item["title"] = ensure_str(item.get("title"))
        item["description"] = ensure_str(item.get("description"))
        item["url"] = ensure_str(item.get("url"))
        item["date"] = ensure_str(item.get("date"))
        item["technologies"] = ensure_list_str(item.get("technologies"))

    achievements = raw.get("achievements")
    if isinstance(achievements, list):
        norm_achievements = []
        for item in achievements:
            if isinstance(item, dict):
                norm_achievements.append({
                    "title": ensure_str(item.get("title")),
                    "description": ensure_str(item.get("description")),
                    "date": ensure_str(item.get("date")),
                })
            elif isinstance(item, str) and item.strip():
                norm_achievements.append({
                    "title": item.strip(),
                    "description": "",
                    "date": "",
                })
        achievements = norm_achievements
    else:
        achievements = []

    training = ensure_list_dict(raw.get("training"))
    for item in training:
        item["title"] = ensure_str(item.get("title"))
        item["institution"] = ensure_str(item.get("institution"))
        item["date"] = ensure_str(item.get("date") or item.get("year"))

    github_url = ensure_str(raw.get("github_url"))
    portfolio_url = ensure_str(raw.get("portfolio_url"))
    linkedin_url = ensure_str(raw.get("linkedin_url"))
    social_links = []
    if github_url:
        social_links.append({"platform": "github", "url": github_url})
    if portfolio_url:
        social_links.append({"platform": "portfolio", "url": portfolio_url})
    if linkedin_url:
        social_links.append({"platform": "linkedin", "url": linkedin_url})

    return {
        "first_name": ensure_str(raw.get("first_name")),
        "last_name": ensure_str(raw.get("last_name")),
        "headline": ensure_str(raw.get("headline")),
        "bio": ensure_str(raw.get("bio")),
        "phone_number": ensure_str(raw.get("phone_number")),
        "location": ensure_str(raw.get("location")),
        "address": ensure_str(raw.get("address")),
        "github_url": github_url,
        "portfolio_url": portfolio_url,
        "linkedin_url": linkedin_url,
        "social_links": social_links,
        "skills": deduped_skills,
        "education": education,
        "experience": experience,
        "projects": projects,
        "achievements": achievements,
        "training": training,
        "languages": languages,
    }
