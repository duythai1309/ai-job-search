from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse

from app.core.responses import APIErrorResponse
from app.modules.jobs.schemas import JobDetailResponse, JobsListResponse
from app.modules.jobs.service import JobNotFoundError, JobsService


router = APIRouter(prefix="/jobs", tags=["jobs"])


def get_jobs_service() -> JobsService:
    return JobsService()


@router.get("", response_model=JobsListResponse)
def list_jobs(
    q: str = Query(default="", max_length=120),
    location: str = Query(default="", max_length=120),
    role_type: str = Query(default="", max_length=80),
    limit: int = Query(default=20, ge=1, le=50),
    service: JobsService = Depends(get_jobs_service),
) -> JobsListResponse:
    return service.list_jobs(
        query=q.strip(),
        location=location.strip(),
        role_type=role_type.strip(),
        limit=limit,
    )


@router.get("/{job_id}", response_model=JobDetailResponse)
def get_job(
    job_id: str,
    service: JobsService = Depends(get_jobs_service),
) -> JobDetailResponse | JSONResponse:
    try:
        return service.get_job(job_id)
    except JobNotFoundError:
        error = APIErrorResponse(
            code="job_not_found",
            message="The job was not found.",
            request_id=str(uuid4()),
        )
        return JSONResponse(status_code=404, content=error.model_dump())
