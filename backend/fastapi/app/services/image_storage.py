from datetime import datetime

from app.database.supabase_client import supabase


BUCKET_NAME = "military-box-images"


def upload_image(
    device_id: str,
    image_bytes: bytes,
    file_extension: str = "jpg"
):
    timestamp = datetime.now().strftime(
        "%Y-%m-%d_%H-%M-%S"
    )

    file_path = (
        f"{device_id}/"
        f"{timestamp}.{file_extension}"
    )

    supabase.storage.from_(BUCKET_NAME).upload(
        path=file_path,
        file=image_bytes,
        file_options={
            "content-type": "image/jpeg",
            "cache-control": "3600",
            "upsert": "false"
        }
    )

    return file_path


def create_image_url(
    file_path: str,
    expires_in: int = 3600
):
    response = (
        supabase
        .storage
        .from_(BUCKET_NAME)
        .create_signed_url(
            file_path,
            expires_in
        )
    )

    return response["signedURL"]