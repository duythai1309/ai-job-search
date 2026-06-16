from __future__ import annotations
import io

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from app.deps import get_current_user
from app.models.schemas import UserInfo
from app.services import gemini

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


def _extract_pdf_text(content: bytes) -> str:
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception:
        return content.decode("utf-8", errors="ignore")


@router.post("/parse-cv")
async def parse_cv(
    file: UploadFile = File(...),
    user: UserInfo = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Không có file nào được gửi lên")

    content = await file.read()
    filename = (file.filename or "").lower()

    if filename.endswith(".pdf"):
        text = _extract_pdf_text(content)
    else:
        text = content.decode("utf-8", errors="ignore")

    text = text.strip()
    if len(text) < 50:
        raise HTTPException(
            status_code=400,
            detail="Không thể đọc nội dung CV. Vui lòng thử file PDF hoặc TXT khác.",
        )

    try:
        result = await gemini.parse_uploaded_cv(text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi phân tích CV: {str(e)}")

    return result
