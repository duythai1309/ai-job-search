from __future__ import annotations

import json
from typing import Any, Callable

import httpx

from app.modules.ai.adapter import AIAdapterError, AITextResult


GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"


class GeminiAdapter:
    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        timeout_seconds: float,
        post_json: Callable[..., dict[str, Any]] | None = None,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._timeout_seconds = timeout_seconds
        self._post_json = post_json or self._http_post_json

    def generate_candidate_profile(
        self,
        *,
        cv_text: str,
        schema: dict[str, Any],
    ) -> AITextResult:
        return self._generate(
            trusted_instruction=(
                "Extract a candidate profile from the untrusted CV data. "
                "Return exactly one JSON object matching the supplied schema. "
                "Do not calculate job-fit scores. Do not invent facts."
            ),
            untrusted_data={"cv_text": cv_text},
            schema=schema,
        )

    def repair_candidate_profile(
        self,
        *,
        cv_text: str,
        invalid_output: str,
        validation_errors: str,
        schema: dict[str, Any],
    ) -> AITextResult:
        return self._repair(
            invalid_output,
            validation_errors,
            schema,
            source_data={"cv_text": cv_text},
        )

    def generate_recommendations(
        self,
        *,
        cv_text: str,
        job: dict[str, Any],
        schema: dict[str, Any],
    ) -> AITextResult:
        return self._generate(
            trusted_instruction=(
                "Generate grounded CV improvement suggestions for the selected job. "
                "Return exactly one JSON object matching the supplied schema. "
                "Each cv_evidence and job_evidence value must be an exact excerpt "
                "from the corresponding untrusted data. Never invent experience, "
                "employers, metrics, certifications, skills, or outcomes."
            ),
            untrusted_data={"cv_text": cv_text, "job": job},
            schema=schema,
        )

    def repair_recommendations(
        self,
        *,
        cv_text: str,
        job: dict[str, Any],
        invalid_output: str,
        validation_errors: str,
        schema: dict[str, Any],
    ) -> AITextResult:
        return self._repair(
            invalid_output,
            validation_errors,
            schema,
            source_data={"cv_text": cv_text, "job": job},
        )

    def _repair(
        self,
        invalid_output: str,
        validation_errors: str,
        schema: dict[str, Any],
        source_data: dict[str, Any],
    ) -> AITextResult:
        return self._generate(
            trusted_instruction=(
                "Repair the previous model output. Return only one JSON object "
                "matching the schema. Do not add new facts."
            ),
            untrusted_data={
                "invalid_output": invalid_output,
                "validation_errors": validation_errors,
                "original_untrusted_data": source_data,
            },
            schema=schema,
        )

    def _generate(
        self,
        *,
        trusted_instruction: str,
        untrusted_data: dict[str, Any],
        schema: dict[str, Any],
    ) -> AITextResult:
        payload = {
            "system_instruction": {
                "parts": [{"text": trusted_instruction}],
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": json.dumps(
                                {
                                    "schema": schema,
                                    "untrusted_data": untrusted_data,
                                },
                                ensure_ascii=False,
                            )
                        }
                    ],
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.1,
            },
        }
        try:
            response = self._post_json(
                url=f"{GEMINI_BASE_URL}/models/{self._model}:generateContent",
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": self._api_key,
                },
                json=payload,
                timeout=self._timeout_seconds,
            )
            text = response["candidates"][0]["content"]["parts"][0]["text"]
        except (httpx.TimeoutException, TimeoutError) as exc:
            raise AIAdapterError("AI provider timed out.") from exc
        except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as exc:
            raise AIAdapterError("AI provider request failed.") from exc
        if not isinstance(text, str) or not text.strip():
            raise AIAdapterError("AI provider returned an empty response.")
        return AITextResult(text.strip(), self._model)

    @staticmethod
    def _http_post_json(**kwargs: Any) -> dict[str, Any]:
        response = httpx.post(**kwargs)
        response.raise_for_status()
        return response.json()
