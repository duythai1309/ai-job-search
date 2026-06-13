from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from app.modules.cv.extraction import PARSER_VERSION, ExtractionError, extract_text
from app.modules.cv.repository import CvRepository, CvRepositoryError
from app.modules.cv.schemas import (
    CvDeleteData,
    CvDeleteResponse,
    CvDocumentRecord,
    CvDocumentResponse,
    CvUploadMeta,
    CvUploadRecord,
    CvUploadResponse,
)


MAX_CV_FILE_SIZE_BYTES = 5 * 1024 * 1024

SUPPORTED_FILES = {
    ".pdf": ("pdf", {"application/pdf"}),
    ".docx": (
        "docx",
        {
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
    ),
}


class CvUploadError(ValueError):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


class CvUploadService:
    def __init__(self, repository: CvRepository | None = None) -> None:
        self._repository = repository or CvRepository()

    def process_upload(
        self,
        *,
        filename: str | None,
        content_type: str | None,
        content: bytes,
    ) -> CvUploadResponse:
        extension = Path(filename or "").suffix.lower()
        supported = SUPPORTED_FILES.get(extension)
        if supported is None:
            raise CvUploadError(
                "unsupported_file_type",
                "Only PDF and DOCX CV files are supported.",
                415,
            )

        file_type, allowed_mime_types = supported
        if content_type not in allowed_mime_types:
            raise CvUploadError(
                "invalid_mime_type",
                "The uploaded file MIME type does not match its extension.",
                415,
            )

        if not content:
            raise CvUploadError("empty_file", "The uploaded CV is empty.", 400)

        if len(content) > MAX_CV_FILE_SIZE_BYTES:
            raise CvUploadError(
                "file_too_large",
                "The uploaded CV exceeds the 5 MiB size limit.",
                413,
            )

        try:
            extracted_text = extract_text(content, file_type)
        except ExtractionError as exc:
            raise CvUploadError(
                "cv_parse_failed",
                "The uploaded CV could not be parsed.",
                422,
            ) from exc

        cv_id = uuid4()
        created_at = datetime.now(UTC)
        safe_filename = Path(filename or f"cv.{file_type}").name
        warnings: list[str] = []

        payload = {
            "id": str(cv_id),
            "user_id": None,
            "filename": safe_filename,
            "content_type": content_type,
            "size_bytes": len(content),
            "extraction_method": f"{file_type}:{PARSER_VERSION}",
            "extracted_text": extracted_text,
            "text_preview": extracted_text[:240],
            "warnings": warnings,
            "created_at": created_at.isoformat(),
        }
        try:
            persisted = self._repository.create_document(payload)
        except CvRepositoryError as exc:
            raise CvUploadError(
                "cv_persistence_failed",
                "The extracted CV could not be saved.",
                503,
            ) from exc

        record = CvUploadRecord(
            id=persisted.get("id", cv_id),
            cv_id=persisted.get("id", cv_id),
            filename=persisted.get("filename", safe_filename),
            file_type=file_type,
            file_size_bytes=persisted.get("size_bytes", len(content)),
            extracted_text=persisted.get("extracted_text", extracted_text),
            parser_version=PARSER_VERSION,
            warnings=persisted.get("warnings", warnings),
            created_at=persisted.get("created_at", created_at),
        )
        return CvUploadResponse(
            data=record,
            meta=CvUploadMeta(max_file_size_bytes=MAX_CV_FILE_SIZE_BYTES),
        )

    def get_document(self, cv_id: str) -> CvDocumentResponse:
        try:
            record = self._repository.get_by_id(cv_id, "")
        except CvRepositoryError as exc:
            raise CvUploadError("cv_lookup_failed", "The CV could not be loaded.", 503) from exc
        if record is None:
            raise CvUploadError("cv_not_found", "The CV was not found.", 404)
        extraction_method = str(record.get("extraction_method", "pdf:unknown"))
        file_type, _, parser_version = extraction_method.partition(":")
        return CvDocumentResponse(
            data=CvDocumentRecord(
                id=record["id"],
                filename=record["filename"],
                file_type=file_type,
                file_size_bytes=record["size_bytes"],
                text_preview=record.get("text_preview", ""),
                parser_version=parser_version or PARSER_VERSION,
                warnings=record.get("warnings", []),
                created_at=record["created_at"],
            ),
            meta={"storage_tier": "supabase_or_demo_fallback"},
        )

    def delete_document(self, cv_id: str) -> CvDeleteResponse:
        if self._repository.get_by_id(cv_id, "") is None:
            raise CvUploadError("cv_not_found", "The CV was not found.", 404)
        try:
            self._repository.delete(cv_id, "")
        except CvRepositoryError as exc:
            raise CvUploadError("cv_delete_failed", "The CV could not be deleted.", 503) from exc
        return CvDeleteResponse(data=CvDeleteData(id=cv_id))
