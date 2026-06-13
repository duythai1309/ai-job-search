from __future__ import annotations

import httpx
import pytest

from app.core.config import ConfigError, clear_settings_cache, get_ai_settings
from app.modules.ai.adapter import AIAdapterError
from app.modules.ai.factory import get_cv_analysis_adapter
from app.modules.ai.gemini import GeminiAdapter


def test_gemini_adapter_success_does_not_expose_key():
    calls = []

    def fake_post(**kwargs):
        calls.append(kwargs)
        return {
            "candidates": [
                {"content": {"parts": [{"text": '{"summary":"ok"}'}]}}
            ]
        }

    adapter = GeminiAdapter(
        api_key="top-secret",
        model="test-model",
        timeout_seconds=7,
        post_json=fake_post,
    )

    result = adapter.generate_candidate_profile(
        cv_text="private cv",
        schema={"type": "object"},
    )

    assert result.text == '{"summary":"ok"}'
    assert result.model_name == "test-model"
    assert calls[0]["timeout"] == 7
    assert calls[0]["headers"]["x-goog-api-key"] == "top-secret"
    assert "top-secret" not in calls[0]["url"]


def test_gemini_timeout_is_sanitized():
    def timeout(**kwargs):
        raise httpx.TimeoutException("request included private cv and top-secret")

    adapter = GeminiAdapter(
        api_key="top-secret",
        model="test-model",
        timeout_seconds=1,
        post_json=timeout,
    )

    with pytest.raises(AIAdapterError) as error:
        adapter.generate_candidate_profile(
            cv_text="private cv",
            schema={"type": "object"},
        )

    assert str(error.value) == "AI provider timed out."
    assert "private cv" not in str(error.value)
    assert "top-secret" not in str(error.value)


def test_ai_provider_unset_selects_deterministic_fallback(monkeypatch):
    monkeypatch.delenv("AI_PROVIDER", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_MODEL", raising=False)
    clear_settings_cache()

    adapter = get_cv_analysis_adapter()
    result = adapter.generate_candidate_profile(
        cv_text="Python FastAPI",
        schema={},
    )

    assert result.model_name == "deterministic-fallback-v1"


def test_gemini_configuration_requires_key_and_model(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "gemini")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_MODEL", raising=False)
    clear_settings_cache()

    with pytest.raises(ConfigError) as error:
        get_ai_settings()

    assert "GEMINI_API_KEY" in str(error.value)
    assert "GEMINI_MODEL" in str(error.value)
    assert "top-secret" not in str(error.value)
