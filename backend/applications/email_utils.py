import logging
from django.conf import settings
from accounts.email_utils import send_mail_async

logger = logging.getLogger(__name__)


def send_application_confirmation_email(application):
    """
    Sends an asynchronous confirmation email to the developer upon submitting an application.
    Does NOT include job ID. Includes support link: https://devhire-frontend-gamma.vercel.app/contact
    """
    developer = getattr(application, 'developer', None)
    if not developer or not getattr(developer, 'email', None):
        return None

    job = getattr(application, 'job', None)
    job_title = getattr(job, 'title', 'Job') if job else 'Job'

    company = getattr(job, 'company', None) if job else None
    company_name = (
        getattr(company, 'company_name', None)
        or getattr(company, 'username', None)
        or 'the employer'
    )

    dev_name = (
        getattr(developer, 'first_name', None)
        or getattr(developer, 'username', None)
        or 'there'
    )
    dev_name = dev_name.capitalize() if isinstance(dev_name, str) else 'there'

    contact_url = "https://devhire-frontend-gamma.vercel.app/contact"
    subject = f"Job Application - DevHire"
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or 'noreply@devhire.com'

    message = (
        f"Dear {dev_name},\n\n"
        f"Thank you for using DevHire.\n\n"
        f"Thank you for applying to the job {job_title} posted by {company_name}. "
        f"Let's first get you acquainted with some guidelines to be followed on DevHire.\n\n"
        f"Important guidelines to be followed on DevHire:\n"
        f"- Applying to internships/jobs on DevHire is free. If an organization asks for a fee or a security deposit, please notify us by visiting the Contact Center so that we can take appropriate action.\n"
        f"- Always ask for an offer letter or an email that confirms your hiring and mentions the terms and conditions of the internship or job from the employer before you start.\n\n"
        f"Next steps:\n"
        f"- If the employer likes your application, they will get in touch with you within 1-2 weeks. You can also check your application status by logging into your DevHire account.\n"
        f"- Companies typically receive a large number of applications and may not be able to process all of them. Apply to as many relevant internships/jobs as possible to maximize your chances of getting selected.\n\n"
        f"If you have any questions or need further assistance, please feel free to contact us.\n\n"
        f"Best regards,\n"
        f"The DevHire Team\n"
        f"{contact_url}\n"
    )

    html_message = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #18181b; background-color: #f4f4f5; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
    <div style="background-color: #ffffff; padding: 24px 28px 18px 28px; border-bottom: 1px solid #f4f4f5; text-align: left;">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0;">
        <tr>
          <td align="center" valign="middle" style="width: 40px; height: 40px; background-color: #09090b; border-radius: 8px; text-align: center; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; line-height: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            DH
          </td>
        </tr>
      </table>
    </div>
    <div style="padding: 28px;">
      <p style="margin-top: 0; font-size: 16px; font-weight: 600; color: #09090b;">Dear {dev_name},</p>
      <p style="font-size: 15px; color: #3f3f46;">Thank you for using <strong>DevHire</strong>.</p>
      <p style="font-size: 15px; color: #3f3f46;">Thank you for applying to the job <strong>{job_title}</strong> posted by <strong>{company_name}</strong>. Let's first get you acquainted with some guidelines to be followed on DevHire.</p>

      <div style="margin: 20px 0; padding: 18px; background-color: #f8fafc; border-left: 4px solid #0284c7; border-radius: 8px;">
        <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 15px; font-weight: 700; color: #0f172a;">Important guidelines to be followed on DevHire</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #334155;">
          <li style="margin-bottom: 8px;"><strong>Applying is 100% free:</strong> Applying to internships/jobs on DevHire is free. If an organization asks for a fee or a security deposit, please notify us by visiting the Contact Center so that we can take appropriate action.</li>
          <li><strong>Always verify your offer:</strong> Always ask for an offer letter or an email that confirms your hiring and mentions the terms and conditions of the internship or job from the employer before you start.</li>
        </ul>
      </div>

      <div style="margin: 20px 0; padding: 18px; background-color: #f9fafb; border-left: 4px solid #10b981; border-radius: 8px;">
        <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 15px; font-weight: 700; color: #111827;">Next steps</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #374151;">
          <li style="margin-bottom: 8px;">If the employer likes your application, they will get in touch with you within 1-2 weeks. You can also check your application status by logging into your DevHire account.</li>
          <li>Companies typically receive a large number of applications and may not be able to process all of them. Apply to as many relevant internships/jobs as possible to maximize your chances of getting selected.</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #52525b; margin-top: 24px;">If you have any questions or need further assistance, please feel free to contact us.</p>

      <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f4f4f5; font-size: 14px; color: #52525b;">
        <p style="margin: 0; font-weight: 600; color: #18181b;">Best regards,</p>
        <p style="margin: 4px 0 12px 0; font-weight: bold; color: #09090b;">The DevHire Team</p>
        <p style="margin: 0;"><a href="{contact_url}" style="color: #2563eb; text-decoration: underline; font-weight: 500;">{contact_url}</a></p>
      </div>
    </div>
  </div>
</body>
</html>"""

    try:
        send_mail_async(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=[developer.email],
            fail_silently=True,
            html_message=html_message,
        )
    except Exception as exc:
        logger.exception("Failed to dispatch application confirmation email: %s", exc)

