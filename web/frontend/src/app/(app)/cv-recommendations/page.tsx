"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";

import { api } from "@/lib/api";

type Recommendation = {
  target_section?: string;
  action?: string;
  reason?: string;
  cv_evidence?: string;
  job_evidence?: string;
  prohibited_claims?: string[];
  priority?: string;
};

type RecommendationResult = {
  cv_id?: string;
  job_id?: string;
  suggestions?: Recommendation[];
  warnings?: string[];
};

type JobRecord = {
  id: string;
  title?: string;
  company?: string;
};

export default function CvRecommendationsPage() {
  const [storedCvId, setStoredCvId] = useState<string | null>(null);
  const [queryCvId, setQueryCvId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const cvId = queryCvId || storedCvId;

  const [job, setJob] = useState<JobRecord | null>(null);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStoredCvId(window.localStorage.getItem("vica:lastCvId"));
    const params = new URLSearchParams(window.location.search);
    setQueryCvId(params.get("cv_id"));
    setJobId(params.get("job_id"));
  }, []);

  useEffect(() => {
    if (!jobId) return;
    let alive = true;
    api
      .getJob<JobRecord>(jobId)
      .then((value) => {
        if (alive) setJob(value);
      })
      .catch(() => {
        if (alive) setJob(null);
      });
    return () => {
      alive = false;
    };
  }, [jobId]);

  useEffect(() => {
    if (!cvId || !jobId) return;
    let alive = true;
    setLoading(true);
    api
      .recommendations<RecommendationResult>(cvId, jobId)
      .then((value) => {
        if (alive) setResult(value);
      })
      .catch(() => {
        if (alive) setResult(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [cvId, jobId]);

  async function runAgain() {
    if (!cvId || !jobId) return;
    setRunning(true);
    setError(null);
    try {
      const value = await api.recommendations<RecommendationResult>(cvId, jobId);
      setResult(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lấy recommendations.");
    } finally {
      setRunning(false);
    }
  }

  const suggestions = result?.suggestions ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d95332]">Step 04 / Improve</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[#173c31]">CV recommendations</h1>
      <p className="mt-2 text-sm text-[#365347]/65">
        Các đề xuất này bám theo CV và job đã chọn, không thêm claim không có bằng chứng.
      </p>

      {!cvId || !jobId ? (
        <div className="mt-8 rounded-[1.5rem] border border-dashed border-[#1c2923]/15 bg-white/70 p-10 text-center">
          <p className="text-base font-semibold text-[#173c31]">Cần cv_id và job_id trên URL.</p>
          <p className="mt-2 text-sm text-[#365347]/62">Chọn job từ /jobs hoặc /job-matches, rồi mở route này với tham số phù hợp.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/cv-upload" className="inline-flex items-center gap-2 rounded-xl bg-[#173c31] px-5 py-3 text-sm font-bold text-white">
              Upload CV
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/job-matches" className="inline-flex items-center gap-2 rounded-xl border border-[#1c2923]/12 bg-white px-5 py-3 text-sm font-semibold text-[#24543f]">
              Tìm job
            </Link>
          </div>
        </div>
      ) : (
        <>
          <section className="mt-8 rounded-[1.5rem] border border-[#1c2923]/10 bg-white/80 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#24543f]">Selected job</p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[#173c31]">
                  {job?.title || jobId}
                </h2>
                <p className="mt-1 text-sm text-[#365347]/65">{job?.company || "Backend job details chưa có"}</p>
              </div>
              <button
                type="button"
                onClick={() => void runAgain()}
                disabled={running}
                className="inline-flex items-center gap-2 rounded-xl bg-[#173c31] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {running ? "Đang lấy..." : "Lấy lại recommendations"}
              </button>
            </div>
          </section>

          {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          {loading && <div className="mt-6 rounded-[1.5rem] border border-[#1c2923]/10 bg-white/70 p-8 text-center text-[#365347]/60">Đang tải recommendations...</div>}

          {!loading && suggestions.length > 0 && (
            <div className="mt-6 grid gap-4">
              {suggestions.map((suggestion, index) => (
                <article key={index} className="rounded-[1.5rem] border border-[#1c2923]/10 bg-white/80 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#24543f]">
                      {suggestion.target_section || "Section"}
                    </p>
                    <span className="rounded-full bg-[#f2f0e9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#365347]/60">
                      {suggestion.priority || "info"}
                    </span>
                  </div>
                  <h3 className="mt-3 text-xl font-extrabold tracking-[-0.04em] text-[#173c31]">{suggestion.action}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#365347]">{suggestion.reason}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-[#faf8f2] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#365347]/50">CV evidence</p>
                      <p className="mt-2 text-sm leading-6 text-[#365347]">{suggestion.cv_evidence || "N/A"}</p>
                    </div>
                    <div className="rounded-2xl bg-[#eef4eb] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#24543f]">Job evidence</p>
                      <p className="mt-2 text-sm leading-6 text-[#365347]">{suggestion.job_evidence || "N/A"}</p>
                    </div>
                  </div>
                  {suggestion.prohibited_claims?.length ? (
                    <p className="mt-4 rounded-2xl border border-[#d95332]/14 bg-[#fbebe5] p-3 text-sm leading-6 text-[#7f4332]">
                      {suggestion.prohibited_claims.join(" ")}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}

          {!loading && suggestions.length === 0 && (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-[#1c2923]/15 bg-white/70 p-10 text-center text-[#365347]/60">
              Backend chưa trả về suggestions.
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-xs text-[#365347]/55">
            <Sparkles className="h-4 w-4 text-[#d95332]" />
            <span>CV id: {cvId} · Job id: {jobId}</span>
          </div>
        </>
      )}
    </div>
  );
}
