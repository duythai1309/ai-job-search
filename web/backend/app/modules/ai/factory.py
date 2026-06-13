from __future__ import annotations

from app.core.config import ConfigError, get_ai_settings
from app.modules.ai.adapter import (
    CvAnalysisAIAdapter,
    DeterministicCvAnalysisAdapter,
    RecommendationAIAdapter,
)
from app.modules.ai.gemini import GeminiAdapter


class AIProviderConfigurationError(RuntimeError):
    pass


def _gemini_or_none() -> GeminiAdapter | None:
    try:
        settings = get_ai_settings()
    except ConfigError as exc:
        raise AIProviderConfigurationError("AI provider configuration is invalid.") from exc
    if settings.provider is None:
        return None
    return GeminiAdapter(
        api_key=settings.gemini_api_key or "",
        model=settings.gemini_model or "",
        timeout_seconds=settings.timeout_seconds,
    )


def get_cv_analysis_adapter() -> CvAnalysisAIAdapter:
    return _gemini_or_none() or DeterministicCvAnalysisAdapter()


def get_recommendation_adapter() -> RecommendationAIAdapter | None:
    return _gemini_or_none()
