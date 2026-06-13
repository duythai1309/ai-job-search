from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class CvUploadRecord(BaseModel):
    id: UUID
    cv_id: UUID
    filename: str
    file_type: Literal["pdf", "docx"]
    file_size_bytes: int = Field(gt=0)
    extracted_text: str = Field(min_length=1)
    parser_version: str
    warnings: list[str] = Field(default_factory=list)
    created_at: datetime


class CvUploadMeta(BaseModel):
    persisted: Literal[True] = True
    max_file_size_bytes: int


class CvUploadResponse(BaseModel):
    data: CvUploadRecord
    meta: CvUploadMeta


class CvDocumentRecord(BaseModel):
    id: UUID
    filename: str
    file_type: Literal["pdf", "docx"]
    file_size_bytes: int = Field(gt=0)
    text_preview: str
    parser_version: str
    warnings: list[str] = Field(default_factory=list)
    created_at: datetime


class CvDocumentResponse(BaseModel):
    data: CvDocumentRecord
    meta: dict = Field(default_factory=dict)


class CvDeleteData(BaseModel):
    id: UUID
    deleted: Literal[True] = True


class CvDeleteResponse(BaseModel):
    data: CvDeleteData
    meta: dict = Field(default_factory=dict)
