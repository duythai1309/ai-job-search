from fastapi.testclient import TestClient
import pytest

from app.main import app


client = TestClient(app)


@pytest.mark.parametrize(
    ("method", "path", "placeholder_key"),
    [
        ("get", "/api/v1/chat/sessions", "sessions"),
        ("post", "/api/v1/chat/sessions", "session"),
        ("post", "/api/v1/chat/messages", "message"),
        ("get", "/api/v1/analytics/market", "insights"),
        ("post", "/api/v1/cover-letters", "cover_letter"),
        ("post", "/api/v1/exports/pdf", "download_url"),
    ],
)
def test_post_mvp_compatibility_endpoints(method, path, placeholder_key):
    response = (
        client.post(path, json={})
        if method == "post"
        else client.get(path)
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["implemented"] is False
    assert body["data"]["status"] == "post_mvp"
    assert placeholder_key in body["data"]["placeholder"]
    assert body["meta"]["compatibility_stub"] is True
