from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.core.responses import APIErrorResponse
from app.modules.ai.factory import (
    AIProviderConfigurationError,
    get_recommendation_adapter,
)
from app.modules.recommendations.schemas import (
    RecommendationRequest,
    RecommendationResponse,
)
from app.modules.recommendations.service import (
    RecommendationError,
    RecommendationService,
)


router = APIRouter(prefix="/recommendations", tags=["recommendations"])


def get_recommendation_service() -> RecommendationService:
    try:
        adapter = get_recommendation_adapter()
    except AIProviderConfigurationError:
        from app.modules.ai.adapter import AIAdapterError

        class InvalidConfigurationAdapter:
            def generate_recommendations(self, **kwargs):
                raise AIAdapterError("AI provider configuration is invalid.")

            def repair_recommendations(self, **kwargs):
                raise AIAdapterError("AI provider configuration is invalid.")

        adapter = InvalidConfigurationAdapter()
    return RecommendationService(ai_adapter=adapter)


@router.post("", response_model=RecommendationResponse, status_code=201)
def create_recommendations(
    request: RecommendationRequest,
    service: RecommendationService = Depends(get_recommendation_service),
) -> RecommendationResponse | JSONResponse:
    try:
        return service.create(request.cv_id, request.job_id)
    except RecommendationError as exc:
        error = APIErrorResponse(code=exc.code, message=exc.message, request_id=str(uuid4()))
        return JSONResponse(status_code=exc.status_code, content=error.model_dump())
