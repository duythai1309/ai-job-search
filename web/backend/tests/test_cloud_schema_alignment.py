from pathlib import Path


MIGRATION = (
    Path(__file__).resolve().parents[2]
    / "supabase"
    / "migrations"
    / "002_cloud_backend_mvp_alignment.sql"
)


def test_cloud_alignment_migration_is_additive():
    sql = MIGRATION.read_text(encoding="utf-8").casefold()

    assert "drop table" not in sql
    assert "drop column" not in sql
    assert "alter column" not in sql
    assert "alter table public.job_postings\n    add column if not exists" in sql


def test_cloud_alignment_preserves_uuid_job_references():
    sql = MIGRATION.read_text(encoding="utf-8").casefold()

    assert "alter table public.job_postings alter column id" not in sql
    assert "job_id uuid not null references public.job_postings(id)" in sql
    assert "on public.job_postings (source, source_job_id)" in sql
