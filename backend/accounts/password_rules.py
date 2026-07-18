"""Strong password rules shared by register and change-password."""

import re

# pyrefly: ignore [missing-import]
from django.core.exceptions import ValidationError


PASSWORD_RULES_HELP = (
    'Password must be at least 8 characters and include uppercase, lowercase, '
    'a number, and a special character. It cannot include your username.'
)


def password_related_to_username(password: str, username: str | None) -> bool:
    """True if password contains / is based on the username (case-insensitive)."""
    if not password or not username:
        return False

    u = username.lower().strip()
    p = password.lower()
    if len(u) < 3:
        return p == u

    if u in p:
        return True

    # Compare alphanumeric-only so Asdf@123 still matches username asdf
    u_alnum = re.sub(r'[^a-z0-9]', '', u)
    p_alnum = re.sub(r'[^a-z0-9]', '', p)
    if u_alnum and len(u_alnum) >= 3 and u_alnum in p_alnum:
        return True

    return False


def validate_strong_password(password: str, username: str | None = None) -> None:
    """Raise ValidationError if password fails DevHire strength rules."""
    errors: list[str] = []

    if not password or any(ch.isspace() for ch in password):
        errors.append('Password cannot contain spaces.')

    if not password or len(password) < 8:
        errors.append('Password must be at least 8 characters.')

    if password and not re.search(r'[A-Z]', password):
        errors.append('Password must include at least one uppercase letter.')

    if password and not re.search(r'[a-z]', password):
        errors.append('Password must include at least one lowercase letter.')

    if password and not re.search(r'\d', password):
        errors.append('Password must include at least one number.')

    if password and not re.search(r'[^A-Za-z0-9]', password):
        errors.append('Password must include at least one special character.')

    if password_related_to_username(password, username):
        errors.append('Password cannot be the same as or based on your username.')

    if errors:
        raise ValidationError(errors)
