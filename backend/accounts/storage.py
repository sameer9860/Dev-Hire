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
