from __future__ import annotations

import importlib


def test_repository_modules_import_without_supabase_env(monkeypatch):
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_ANON_KEY", raising=False)
    monkeypatch.delenv("SUPABASE_SERVICE_ROLE_KEY", raising=False)

    modules = [
        "app.modules.cv.repository",
        "app.modules.jobs.repository",
        "app.modules.recommendations.repository",
        "app.modules.audit.repository",
    ]

    for module_name in modules:
        module = importlib.import_module(module_name)
        assert module is not None


def test_repository_classes_expose_expected_methods():
    from app.modules.audit.repository import AuditRepository
    from app.modules.cv.repository import CvRepository
    from app.modules.jobs.repository import JobsRepository
    from app.modules.recommendations.repository import RecommendationsRepository

    assert hasattr(CvRepository, "list_for_user")
    assert hasattr(CvRepository, "get_by_id")
    assert hasattr(CvRepository, "create")
    assert hasattr(CvRepository, "delete")

    assert hasattr(JobsRepository, "list_jobs")
    assert hasattr(JobsRepository, "get_by_id")

    assert hasattr(RecommendationsRepository, "get_by_cv_and_job")
    assert hasattr(RecommendationsRepository, "create")

    assert hasattr(AuditRepository, "append_event")
