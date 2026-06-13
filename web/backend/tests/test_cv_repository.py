from __future__ import annotations

import pytest

from app.modules.cv.repository import CvRepository, CvRepositoryError


class FakeResponse:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    def __init__(self, response):
        self.response = response
        self.inserted = None

    def insert(self, payload):
        self.inserted = payload
        return self

    def execute(self):
        return self.response


class FakeClient:
    def __init__(self, response):
        self.query = FakeQuery(response)
        self.table_name = None

    def table(self, table_name):
        self.table_name = table_name
        return self.query


def test_create_document_uses_injected_client_without_env(monkeypatch):
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_ANON_KEY", raising=False)
    monkeypatch.delenv("SUPABASE_SERVICE_ROLE_KEY", raising=False)
    payload = {"id": "cv-1", "filename": "resume.pdf"}
    client = FakeClient(FakeResponse([payload]))
    repository = CvRepository(client_provider=lambda: client)

    result = repository.create_document(payload)

    assert result == payload
    assert client.table_name == "cv_documents"
    assert client.query.inserted == payload


def test_create_document_fails_closed_when_no_record_is_returned():
    client = FakeClient(FakeResponse([]))
    repository = CvRepository(client_provider=lambda: client)

    with pytest.raises(CvRepositoryError):
        repository.create_document({"id": "cv-1"})
