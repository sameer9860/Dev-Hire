"""
Personalized Job Discovery and Recommendation Engine for DevHire
===============================================================
Matches developers to active opportunities based on:
1. Technical skills & tech stack overlap
2. Experience level compatibility
3. Location & remote work preferences
4. Employment type

Provides transparent "Why this matches you" explanations and dispatches
alerts when new matching opportunities are published.
"""

import logging
from typing import List, Dict, Any, Optional
from django.contrib.auth import get_user_model
from .models import Job
from .match_score import compute_match, _normalize

logger = logging.getLogger(__name__)
User = get_user_model()


def get_personalized_recommendations(developer_user, limit: int = 15) -> List[Dict[str, Any]]:
    """
    Returns ranked, personalized job recommendations for a developer user
    with detailed 'why it matches' explanations.
    """
    if not developer_user or getattr(developer_user, 'role', '') != 'developer':
        return []

    dev_skills = [s for s in (developer_user.skills or []) if str(s).strip()]
    dev_location = (getattr(developer_user, 'location', '') or '').strip().lower()
    dev_headline = (getattr(developer_user, 'headline', '') or '').strip().lower()
    dev_exp_entries = getattr(developer_user, 'experience', []) or []

    # Estimate developer experience level from entries & headline
    est_years = len(dev_exp_entries)
    if 'senior' in dev_headline or 'lead' in dev_headline or 'principal' in dev_headline or est_years >= 5:
        dev_level = 'senior'
    elif 'junior' in dev_headline or 'intern' in dev_headline or est_years <= 1:
        dev_level = 'junior'
    else:
        dev_level = 'mid'

    # Filter for active jobs that are not rejected by moderation
    jobs_qs = (
        Job.objects.filter(is_active=True)
        .exclude(moderation_status='rejected')
        .select_related('company')
        .prefetch_related('saves')
    )

    scored_jobs = []

    for job in jobs_qs:
        # 1. Base skill match
        match_result = compute_match(developer_user, job, use_ai=False)
        base_skill_score = match_result.score

        # 2. Level adjustment
        level_score = 0
        level_reason = None
        if job.experience_level == dev_level:
            level_score = 15
            level_reason = f"Perfect level match: Role is tailored for {job.get_experience_level_display()} developers."
        elif (dev_level == 'senior' and job.experience_level == 'mid') or (dev_level == 'mid' and job.experience_level == 'junior'):
            level_score = 8
            level_reason = f"Experience compatible: You meet or exceed the {job.get_experience_level_display()} qualifications."

        # 3. Location / Remote adjustment
        location_score = 0
        location_reason = None
        job_loc_lower = (job.location or '').lower()

        if job.is_remote:
            location_score = 15
            location_reason = "Remote flexibility: Offers 100% remote work."
        elif dev_location and (dev_location in job_loc_lower or job_loc_lower in dev_location):
            location_score = 15
            location_reason = f"Location proximity: Located in {job.location}."
        elif not dev_location:
            location_score = 5

        # 4. Composite Discovery Score (Weighted)
        # 60% skills, 20% experience level, 20% location/remote
        composite_score = int(round((base_skill_score * 0.60) + (level_score * 1.33) + (location_score * 1.33)))
        composite_score = max(5, min(100, composite_score))

        # Generate human-friendly explanations
        reasons = []
        if match_result.matching_skills:
            top_skills = match_result.matching_skills[:4]
            reasons.append(f"Strong tech stack match: You have {', '.join(top_skills)}.")
        if location_reason:
            reasons.append(location_reason)
        if level_reason:
            reasons.append(level_reason)

        if not reasons:
            reasons.append("Trending tech opportunity matching your developer profile.")

        company_obj = job.company
        company_name = getattr(company_obj, 'company_name', '') or company_obj.username

        # Check if saved
        is_saved = any(s.developer_id == developer_user.id for s in job.saves.all())

        scored_jobs.append({
            "id": job.id,
            "title": job.title,
            "company": {
                "id": company_obj.id,
                "username": company_obj.username,
                "company_name": company_name,
                "avatar_url": getattr(company_obj, 'avatar_url', ''),
            },
            "location": job.location,
            "is_remote": job.is_remote,
            "job_type": job.job_type,
            "experience_level": job.experience_level,
            "tech_stack": job.tech_stack,
            "salary_min": job.salary_min,
            "salary_max": job.salary_max,
            "quality_score": job.quality_score,
            "safety_flags": job.safety_flags,
            "moderation_status": job.moderation_status,
            "is_saved": is_saved,
            "created_at": job.created_at,
            "recommendation": {
                "score": base_skill_score,
                "composite_score": composite_score,
                "skill_match_score": base_skill_score,
                "matching_skills": match_result.matching_skills,
                "missing_skills": match_result.missing_skills,
                "reasons": reasons,
                "badge": match_result.label or ("Top Match" if base_skill_score >= 80 else "Strong Fit" if base_skill_score >= 60 else "Good Match"),
            }
        })

    # Sort descending by composite recommendation ranking
    scored_jobs.sort(key=lambda x: x["recommendation"]["composite_score"], reverse=True)
    return scored_jobs[:limit]


def notify_matching_developers_of_new_job(job: Job, min_match_threshold: int = 50, max_notifications: int = 25):
    """
    Finds developers whose skills strongly match a newly published job,
    and logs an ActivityLog alert for them.
    """
    if not job or not job.is_active or job.moderation_status == 'rejected':
        return 0

    job_tech = [_normalize(t) for t in (job.tech_stack or []) if _normalize(t)]
    if not job_tech:
        return 0

    from accounts.activity import log_activity

    company_name = getattr(job.company, 'company_name', '') or job.company.username
    developers = User.objects.filter(role='developer', is_active=True)

    notified_count = 0
    job_tech_set = set(job_tech)

    for dev in developers:
        dev_skills = [_normalize(s) for s in (dev.skills or []) if _normalize(s)]
        if not dev_skills:
            continue

        common = job_tech_set.intersection(set(dev_skills))
        overlap_pct = int(round((len(common) / len(job_tech_set)) * 100))

        if overlap_pct >= min_match_threshold:
            log_activity(
                dev,
                category='job',
                action='new_job_opportunity',
                message=f"New job matching your skills: {job.title} at {company_name} ({overlap_pct}% match)",
                metadata={
                    'job_id': job.id,
                    'job_title': job.title,
                    'company_name': company_name,
                    'match_score': overlap_pct,
                    'matching_skills': list(common)[:5],
                },
            )
            notified_count += 1
            if notified_count >= max_notifications:
                break

    return notified_count
