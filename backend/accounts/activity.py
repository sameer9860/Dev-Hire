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


def _values_equal(old, new) -> bool:
    if isinstance(old, list) or isinstance(new, list):
        return list(old or []) == list(new or [])
    return (old or '') == (new or '')


def log_profile_changes(user, previous: dict, updated: dict):
    """Create one activity entry per changed profile field."""
    for field, (action, message) in PROFILE_FIELD_MESSAGES.items():
        if field not in updated:
            continue
        if _values_equal(previous.get(field), updated.get(field)):
            continue
        log_activity(
            user,
            category='profile',
            action=action,
            message=message,
            metadata={'field': field},
        )
