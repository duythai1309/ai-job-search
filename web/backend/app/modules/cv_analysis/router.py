from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.core.responses import APIErrorResponse
from app.modules.ai.factory import (
    AIProviderConfigurationError,
    get_cv_analysis_adapter,
)
from app.modules.cv_analysis.repository import CvAnalysisRepository
from app.modules.cv_analysis.schemas import CvAnalysisRequest, CvAnalysisResponse
from app.modules.cv_analysis.service import CvAnalysisError, CvAnalysisService


router = APIRouter(prefix="/cv-analyses", tags=["cv-analyses"])


def get_cv_analysis_service() -> CvAnalysisService:
    try:
        adapter = get_cv_analysis_adapter()
    except AIProviderConfigurationError:
        from app.modules.ai.adapter import AIAdapterError

        class InvalidConfigurationAdapter:
            def generate_candidate_profile(self, **kwargs):
                raise AIAdapterError("AI provider configuration is invalid.")

            def repair_candidate_profile(self, **kwargs):
                raise AIAdapterError("AI provider configuration is invalid.")

        adapter = InvalidConfigurationAdapter()
    return CvAnalysisService(repository=CvAnalysisRepository(), ai_adapter=adapter)


@router.post("", response_model=CvAnalysisResponse, status_code=201)
def create_cv_analysis(
    request: CvAnalysisRequest,
    service: CvAnalysisService = Depends(get_cv_analysis_service),
) -> CvAnalysisResponse | JSONResponse:
    try:
        return service.analyze(request.cv_id)
    except CvAnalysisError as exc:
        error = APIErrorResponse(
            code=exc.code,
            message=exc.message,
            request_id=str(uuid4()),
        )
        return JSONResponse(status_code=exc.status_code, content=error.model_dump())
