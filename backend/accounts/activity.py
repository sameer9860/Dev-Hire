from .models import ActivityLog

PROFILE_FIELD_MESSAGES = {
    'bio': ('bio_changed', 'Changed bio'),
    'avatar_url': ('avatar_changed', 'Updated profile photo'),
    'skills': ('skills_changed', 'Updated tech stack'),
    'github_url': ('github_changed', 'Updated GitHub URL'),
    'portfolio_url': ('portfolio_changed', 'Updated portfolio URL'),
    'resume_url': ('resume_replaced', 'Replaced resume'),
    'headline': ('headline_changed', 'Changed headline'),
    'location': ('location_changed', 'Changed location'),
    'phone_number': ('phone_changed', 'Changed phone number'),
    'first_name': ('first_name_changed', 'Changed first name'),
    'last_name': ('last_name_changed', 'Changed last name'),
    'gender': ('gender_changed', 'Changed gender'),
    'date_of_birth': ('dob_changed', 'Changed date of birth'),
    'address': ('address_changed', 'Changed address'),
    'province': ('province_changed', 'Changed province'),
    'city': ('city_changed', 'Changed city'),
    'current_address': ('current_address_changed', 'Changed current address'),
    'social_links': ('social_links_changed', 'Updated social links'),
    'education': ('education_changed', 'Updated education'),
    'experience': ('experience_changed', 'Updated experience'),
    'projects': ('projects_changed', 'Updated projects'),
    'achievements': ('achievements_changed', 'Updated achievements'),
    'training': ('training_changed', 'Updated training & certifications'),
    'languages': ('languages_changed', 'Updated languages'),
    'company_name': ('company_name_changed', 'Changed company name'),
    'company_website': ('company_website_changed', 'Changed company website'),
    'company_size': ('company_size_changed', 'Changed company size'),
    'company_social_links': ('company_social_links_changed', 'Updated company social links'),
    'company_photos': ('company_gallery_updated', 'Updated company gallery photos'),
    'contact_person': ('contact_person_changed', 'Updated contact person'),
    'company_category': ('company_category_changed', 'Updated company category'),
    'company_founded': ('company_founded_changed', 'Updated company founded year'),
    'company_province': ('company_province_changed', 'Updated company province'),
    'company_district': ('company_district_changed', 'Updated company district'),
    'company_location': ('company_location_changed', 'Updated company location'),
    'company_address': ('company_address_changed', 'Updated company address'),
    'company_email': ('company_email_changed', 'Updated company contact email'),
    'company_phone': ('company_phone_changed', 'Updated company phone number'),
}


def log_activity(user, *, category: str, action: str, message: str, metadata: dict | None = None):
    if not user or not getattr(user, 'is_authenticated', False):
        return None
    return ActivityLog.objects.create(
        user=user,
        category=category,
        action=action,
        message=message,
        metadata=metadata or {},
    )


def _normalize_social_links(val):
    if not isinstance(val, list):
        return []
    cleaned = []
    for item in val:
        if isinstance(item, dict):
            url = str(item.get('url') or '').strip()
            if url:
                cleaned.append({
                    'platform': str(item.get('platform') or 'website').strip().lower(),
                    'url': url,
                })
    return cleaned


def _normalize_photos(val):
    if not isinstance(val, list):
        return []
    return [str(p).strip() for p in val if p and str(p).strip()]


def _values_equal(field: str, old, new) -> bool:
    if field in ('company_social_links', 'social_links'):
        return _normalize_social_links(old) == _normalize_social_links(new)
    if field == 'company_photos':
        return _normalize_photos(old) == _normalize_photos(new)
    if isinstance(old, list) or isinstance(new, list):
        return list(old or []) == list(new or [])
    return str(old or '').strip() == str(new or '').strip()


def log_profile_changes(user, previous: dict, updated: dict):
    """Create one activity entry per changed profile field."""
    for field, (action, message) in PROFILE_FIELD_MESSAGES.items():
        if field not in updated:
            continue
        if _values_equal(field, previous.get(field), updated.get(field)):
            continue
        log_activity(
            user,
            category='profile',
            action=action,
            message=message,
            metadata={'field': field},
        )
