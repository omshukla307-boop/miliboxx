from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.image_storage import upload_image


router = APIRouter(
    prefix="/images",
    tags=["Images"]
)


@router.post("/test-upload")
async def test_image_upload(
    file: UploadFile = File(...)
):

    try:

        image_bytes = await file.read()

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="Empty image file"
            )

        file_extension = "jpg"

        if file.filename and "." in file.filename:
            file_extension = file.filename.rsplit(
                ".", 1
            )[1].lower()

        image_path = upload_image(
            device_id="ESP32_MILITARY_BOX_01",
            image_bytes=image_bytes,
            file_extension=file_extension
        )

        return {
            "success": True,
            "message": "Image uploaded successfully",
            "image_path": image_path
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )