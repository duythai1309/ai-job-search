from __future__ import annotations

from io import BytesIO

from docx import Document
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.modules.cv.repository import CvRepositoryError
from app.modules.cv.router import get_cv_upload_service
from app.modules.cv.service import MAX_CV_FILE_SIZE_BYTES, CvUploadService


client = TestClient(app)


class FakeCvRepository:
    def __init__(self) -> None:
        self.records: list[dict] = []
        self.fail = False

    def create_document(self, payload: dict) -> dict:
        if self.fail:
            raise CvRepositoryError("fake persistence failure")
        record = dict(payload)
        self.records.append(record)
        return record


@pytest.fixture(autouse=True)
def fake_cv_repository():
    repository = FakeCvRepository()
    app.dependency_overrides[get_cv_upload_service] = lambda: CvUploadService(repository)
    yield repository
    app.dependency_overrides.clear()


def _make_pdf(text: str) -> bytes:
    escaped = text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    stream = f"BT /F1 12 Tf 72 720 Td ({escaped}) Tj ET".encode("ascii")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
        b"<< /Length " + str(len(stream)).encode("ascii") + b" >>\nstream\n" + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode("ascii"))
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    pdf.extend(
        (
            f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            f"startxref\n{xref_offset}\n%%EOF\n"
        ).encode("ascii")
    )
    return bytes(pdf)


def _make_docx(text: str) -> bytes:
    document = Document()
    document.add_paragraph(text)
    buffer = BytesIO()
    document.save(buffer)
    return buffer.getvalue()


def test_upload_valid_pdf(fake_cv_repository):
    response = client.post(
        "/api/v1/cvs",
        files={"file": ("resume.pdf", _make_pdf("Python FastAPI internship"), "application/pdf")},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["data"]["filename"] == "resume.pdf"
    assert body["data"]["file_type"] == "pdf"
    assert "Python FastAPI internship" in body["data"]["extracted_text"]
    assert body["data"]["id"] == body["data"]["cv_id"]
    assert body["meta"]["persisted"] is True
    assert fake_cv_repository.records[0]["content_type"] == "application/pdf"
    assert fake_cv_repository.records[0]["text_preview"] == "Python FastAPI internship"


def test_upload_valid_docx(fake_cv_repository):
    response = client.post(
        "/api/v1/cvs",
        files={
            "file": (
                "resume.docx",
                _make_docx("Data analyst internship"),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["data"]["file_type"] == "docx"
    assert body["data"]["extracted_text"] == "Data analyst internship"
    assert fake_cv_repository.records[0]["extraction_method"].startswith("docx:")


def test_upload_rejects_unsupported_file_type():
    response = client.post(
        "/api/v1/cvs",
        files={"file": ("resume.txt", b"plain text", "text/plain")},
    )

    assert response.status_code == 415
    assert response.json()["code"] == "unsupported_file_type"


def test_upload_rejects_mime_type_mismatch():
    response = client.post(
        "/api/v1/cvs",
        files={"file": ("resume.pdf", _make_pdf("CV"), "text/plain")},
    )

    assert response.status_code == 415
    assert response.json()["code"] == "invalid_mime_type"


def test_upload_rejects_empty_file():
    response = client.post(
        "/api/v1/cvs",
        files={"file": ("resume.pdf", b"", "application/pdf")},
    )

    assert response.status_code == 400
    assert response.json()["code"] == "empty_file"


def test_upload_rejects_oversized_file():
    response = client.post(
        "/api/v1/cvs",
        files={
            "file": (
                "resume.pdf",
                b"x" * (MAX_CV_FILE_SIZE_BYTES + 1),
                "application/pdf",
            )
        },
    )

    assert response.status_code == 413
    assert response.json()["code"] == "file_too_large"


def test_upload_reports_parser_failure():
    response = client.post(
        "/api/v1/cvs",
        files={"file": ("resume.pdf", b"not-a-pdf", "application/pdf")},
    )

    assert response.status_code == 422
    assert response.json()["code"] == "cv_parse_failed"


def test_upload_reports_persistence_failure(fake_cv_repository):
    fake_cv_repository.fail = True

    response = client.post(
        "/api/v1/cvs",
        files={"file": ("resume.pdf", _make_pdf("CV"), "application/pdf")},
    )

    assert response.status_code == 503
    assert response.json()["code"] == "cv_persistence_failed"


def test_get_and_delete_cv(fake_cv_repository):
    upload = client.post(
        "/api/v1/cvs",
        files={"file": ("resume.pdf", _make_pdf("Python CV"), "application/pdf")},
    )
    cv_id = upload.json()["data"]["cv_id"]
    fake_cv_repository.get_by_id = lambda requested, user_id: next(
        (record for record in fake_cv_repository.records if record["id"] == requested),
        None,
    )
    fake_cv_repository.delete = lambda requested, user_id: fake_cv_repository.records.clear()

    fetched = client.get(f"/api/v1/cvs/{cv_id}")
    deleted = client.delete(f"/api/v1/cvs/{cv_id}")

    assert fetched.status_code == 200
    assert fetched.json()["data"]["filename"] == "resume.pdf"
    assert deleted.status_code == 200
    assert deleted.json()["data"] == {"id": cv_id, "deleted": True}
