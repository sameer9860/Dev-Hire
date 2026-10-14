# pyrefly: ignore [missing-import]
import os
import uuid
import logging
from django.conf import settings
from django.core.files.storage import default_storage

logger = logging.getLogger(__name__)


def save_file_to_supabase_or_local(uploaded_file, request=None, folder="uploads") -> str:
    """
    Uploads a file to Supabase Storage if configured (SUPABASE_URL and SUPABASE_KEY).
    Otherwise, falls back to Django's default local file storage.

    Returns the public URL of the saved file.
    """
    ext = os.path.splitext(uploaded_file.name)[1].lower()
    unique_name = f"{uuid.uuid4()}{ext}"
    filename = f"{folder}/{unique_name}"

    supabase_url = getattr(settings, "SUPABASE_URL", "").strip().rstrip("/")
    supabase_key = getattr(settings, "SUPABASE_KEY", "").strip()
    bucket_name = getattr(settings, "SUPABASE_STORAGE_BUCKET", "devhire-media").strip()

    if supabase_url and supabase_key:
        try:
            import requests

            content_type = getattr(uploaded_file, "content_type", None) or "application/octet-stream"
            file_bytes = uploaded_file.read()

            upload_endpoint = f"{supabase_url}/storage/v1/object/{bucket_name}/{filename}"
            headers = {
                "Authorization": f"Bearer {supabase_key}",
                "apiKey": supabase_key,
                "Content-Type": content_type,
                "x-upsert": "true",
            }

            response = requests.post(upload_endpoint, data=file_bytes, headers=headers, timeout=15)

            if response.status_code in (200, 201):
                public_url = f"{supabase_url}/storage/v1/object/public/{bucket_name}/{filename}"
                logger.info(f"File successfully uploaded to Supabase Storage: {public_url}")
                return public_url
            else:
                logger.error(
                    f"Supabase upload failed with status {response.status_code}: {response.text}. "
                    "Falling back to local storage."
                )
        except Exception as exc:
            logger.error(f"Error uploading file to Supabase Storage: {exc}. Falling back to local storage.")

    # Fallback to Django default storage (local media folder)
    file_path = default_storage.save(filename, uploaded_file)
    if request:
        return request.build_absolute_uri(settings.MEDIA_URL + file_path)
    return f"{settings.MEDIA_URL}{file_path}"


def extract_supabase_path(stored_url: str) -> str | None:
    """
    Given a stored Supabase public URL like:
      https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    Returns just the object path, e.g. "resumes/abc-uuid.pdf".

    Returns None if the URL is not a recognised Supabase storage URL (e.g. local).
    """
    if not stored_url:
        return None

    supabase_url = getattr(settings, "SUPABASE_URL", "").strip().rstrip("/")
    bucket_name = getattr(settings, "SUPABASE_STORAGE_BUCKET", "devhire-media").strip()

    # Case 1: Full public URL
    prefix_public = f"{supabase_url}/storage/v1/object/public/{bucket_name}/"
    if stored_url.startswith(prefix_public):
        path = stored_url[len(prefix_public):]
        return path.split("?")[0]

    # Case 2: Full signed URL (to re-sign / refresh)
    prefix_sign = f"{supabase_url}/storage/v1/object/sign/{bucket_name}/"
    if stored_url.startswith(prefix_sign):
        path = stored_url[len(prefix_sign):]
        return path.split("?")[0]

    # Case 3: Relative path starting with /storage/v1/object/public/
    rel_prefix = f"/storage/v1/object/public/{bucket_name}/"
    if stored_url.startswith(rel_prefix):
        path = stored_url[len(rel_prefix):]
        return path.split("?")[0]

    # Case 4: Plain path inside bucket, e.g. "resumes/..."
    if stored_url.startswith("resumes/") or stored_url.startswith("avatars/"):
        return stored_url.split("?")[0]

    return None


def generate_supabase_signed_url(stored_url: str, expires_in: int = 3600) -> str:
    """
    Given a stored Supabase public URL, returns a short-lived signed URL
    valid for `expires_in` seconds (default: 1 hour = 3600s).

    - Only authenticated requests reach this; the signed URL is single-session safe.
    - Falls back to the original URL if Supabase is not configured or the URL
      is not a Supabase storage URL (i.e. local dev fallback files).
    """
    supabase_url = getattr(settings, "SUPABASE_URL", "").strip().rstrip("/")
    supabase_key = getattr(settings, "SUPABASE_KEY", "").strip()
    bucket_name = getattr(settings, "SUPABASE_STORAGE_BUCKET", "devhire-media").strip()

    if not (supabase_url and supabase_key):
        return stored_url  # local dev — return as-is

    object_path = extract_supabase_path(stored_url)
    if not object_path:
        return stored_url  # not a Supabase URL — return as-is

    try:
        import requests as req

        sign_endpoint = f"{supabase_url}/storage/v1/object/sign/{bucket_name}/{object_path}"
        headers = {
            "Authorization": f"Bearer {supabase_key}",
            "apiKey": supabase_key,
            "Content-Type": "application/json",
        }
        resp = req.post(
            sign_endpoint,
            json={"expiresIn": expires_in},
            headers=headers,
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            signed_path = data.get("signedURL") or data.get("signedUrl") or ""
            if signed_path:
                if signed_path.startswith("http"):
                    return signed_path
                # Supabase returns relative path "/object/sign/...", which MUST have the "/storage/v1" prefix!
                if not signed_path.startswith("/storage/v1"):
                    if signed_path.startswith("/"):
                        signed_path = f"/storage/v1{signed_path}"
                    else:
                        signed_path = f"/storage/v1/{signed_path}"
                return f"{supabase_url}{signed_path}"
        logger.warning(
            f"Failed to generate Supabase signed URL (status {resp.status_code}): {resp.text}"
        )
    except Exception as exc:
        logger.error(f"Error generating Supabase signed URL: {exc}")

    return stored_url  # fallback: return original URL
