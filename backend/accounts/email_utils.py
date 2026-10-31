"""Asynchronous email sending utilities for DevHire."""

import logging
import threading
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def _send_worker(subject, message, from_email, recipient_list, fail_silently=True):
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=recipient_list,
            fail_silently=fail_silently,
        )
    except Exception as exc:
        logger.exception("Failed to deliver background email to %s: %s", recipient_list, exc)


def send_mail_async(subject, message, from_email, recipient_list, fail_silently=True):
    """
    Sends an email in a background daemon thread so the HTTP request returns immediately.
    In unit test environments (locmem backend), executes synchronously for test assertion stability.
    """
    if getattr(settings, 'EMAIL_BACKEND', '').endswith('locmem.EmailBackend'):
        _send_worker(subject, message, from_email, recipient_list, fail_silently)
        return None

    thread = threading.Thread(
        target=_send_worker,
        args=(subject, message, from_email, recipient_list, fail_silently),
        daemon=True,
    )
    thread.start()
    return thread
