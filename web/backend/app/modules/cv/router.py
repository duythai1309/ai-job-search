from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import JSONResponse

from app.core.responses import APIErrorResponse
from app.modules.cv.schemas import CvDeleteResponse, CvDocumentResponse, CvUploadResponse
from app.modules.cv.service import MAX_CV_FILE_SIZE_BYTES, CvUploadError, CvUploadService


router = APIRouter(prefix="/cvs", tags=["cvs"])


def get_cv_upload_service() -> CvUploadService:
    return CvUploadService()


@router.post("", response_model=CvUploadResponse, status_code=201)
async def upload_cv(
    file: UploadFile = File(...),
    service: CvUploadService = Depends(get_cv_upload_service),
) -> CvUploadResponse | JSONResponse:
    content = await file.read(MAX_CV_FILE_SIZE_BYTES + 1)
    try:
        return service.process_upload(
            filename=file.filename,
            content_type=file.content_type,
            content=content,
        )
    except CvUploadError as exc:
        error = APIErrorResponse(
            code=exc.code,
            message=exc.message,
            request_id=str(uuid4()),
        )
        return JSONResponse(status_code=exc.status_code, content=error.model_dump())
    finally:
        await file.close()


@router.get("/{cv_id}", response_model=CvDocumentResponse)
def get_cv(
    cv_id: str,
    service: CvUploadService = Depends(get_cv_upload_service),
) -> CvDocumentResponse | JSONResponse:
    try:
        return service.get_document(cv_id)
    except CvUploadError as exc:
        error = APIErrorResponse(code=exc.code, message=exc.message, request_id=str(uuid4()))
        return JSONResponse(status_code=exc.status_code, content=error.model_dump())


@router.delete("/{cv_id}", response_model=CvDeleteResponse)
def delete_cv(
    cv_id: str,
    service: CvUploadService = Depends(get_cv_upload_service),
) -> CvDeleteResponse | JSONResponse:
    try:
        return service.delete_document(cv_id)
    except CvUploadError as exc:
        error = APIErrorResponse(code=exc.code, message=exc.message, request_id=str(uuid4()))
        return JSONResponse(status_code=exc.status_code, content=error.model_dump())
