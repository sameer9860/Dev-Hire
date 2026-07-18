"""Helpers for requiring company (work) emails — not free/personal providers."""

FREE_EMAIL_DOMAINS = {
    'gmail.com',
    'googlemail.com',
    'yahoo.com',
    'yahoo.co.uk',
    'yahoo.co.in',
    'hotmail.com',
    'outlook.com',
    'live.com',
    'msn.com',
    'icloud.com',
    'me.com',
    'mac.com',
    'aol.com',
    'protonmail.com',
    'proton.me',
    'pm.me',
    'mail.com',
    'zoho.com',
    'yandex.com',
    'yandex.ru',
    'gmx.com',
    'gmx.net',
    'mail.ru',
    'inbox.com',
    'fastmail.com',
    'tutanota.com',
    'hey.com',
}


def email_domain(email: str) -> str:
    if not email or '@' not in email:
        return ''
    return email.rsplit('@', 1)[-1].strip().lower()


def is_free_email(email: str) -> bool:
    return email_domain(email) in FREE_EMAIL_DOMAINS


def is_company_email(email: str) -> bool:
    domain = email_domain(email)
    return bool(domain) and domain not in FREE_EMAIL_DOMAINS
