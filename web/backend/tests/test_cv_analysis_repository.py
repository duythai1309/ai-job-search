from __future__ import annotations

import pytest

from app.modules.cv_analysis.repository import (
    CvAnalysisRepository,
    CvAnalysisRepositoryError,
)


class FakeResponse:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    def __init__(self, response):
        self.response = response
        self.selected = None
        self.filters = []
        self.inserted = None

    def select(self, columns):
        self.selected = columns
        return self

    def eq(self, column, value):
        self.filters.append((column, value))
        return self

    def maybe_single(self):
        return self

    def insert(self, payload):
        self.inserted = payload
        return self

    def execute(self):
        return self.response


class FakeClient:
    def __init__(self, responses):
        self.responses = responses
        self.queries = {}

    def table(self, table_name):
        query = FakeQuery(self.responses[table_name])
        self.queries[table_name] = query
        return query


def test_repository_reads_cv_and_persists_analysis_without_env(monkeypatch):
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_ANON_KEY", raising=False)
    monkeypatch.delenv("SUPABASE_SERVICE_ROLE_KEY", raising=False)
    cv_record = {"id": "cv-1", "extracted_text": "Python"}
    analysis_record = {"id": "analysis-1", "cv_id": "cv-1"}
    client = FakeClient(
        {
            "cv_documents": FakeResponse(cv_record),
            "cv_analyses": FakeResponse([analysis_record]),
        }
    )
    repository = CvAnalysisRepository(client_provider=lambda: client)

    assert repository.get_cv_document("cv-1") == cv_record
    assert repository.create_analysis(analysis_record) == analysis_record
    assert client.queries["cv_documents"].filters == [("id", "cv-1")]
    assert client.queries["cv_analyses"].inserted == analysis_record


def test_repository_fails_closed_when_insert_returns_no_record():
    client = FakeClient({"cv_analyses": FakeResponse([])})
    repository = CvAnalysisRepository(client_provider=lambda: client)

    with pytest.raises(CvAnalysisRepositoryError):
        repository.create_analysis({"id": "analysis-1"})
