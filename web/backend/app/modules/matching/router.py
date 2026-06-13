from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.core.responses import APIErrorResponse
from app.modules.matching.schemas import FitScoreRequest, FitScoresResponse
from app.modules.matching.service import MatchingError, MatchingService


router = APIRouter(prefix="/fit-scores", tags=["fit-scores"])


def get_matching_service() -> MatchingService:
    return MatchingService()


@router.post("", response_model=FitScoresResponse, status_code=201)
def create_fit_scores(
    request: FitScoreRequest,
    service: MatchingService = Depends(get_matching_service),
) -> FitScoresResponse | JSONResponse:
    try:
        if request.analysis_id is not None:
            return service.calculate(request.analysis_id, request.job_ids)
        return service.calculate_for_cv(request.cv_id, request.job_id or "")
    except MatchingError as exc:
        error = APIErrorResponse(
            code=exc.code,
            message=exc.message,
            request_id=str(uuid4()),
        )
        return JSONResponse(status_code=exc.status_code, content=error.model_dump())
