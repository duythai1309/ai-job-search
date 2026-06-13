"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Sparkles, CheckCircle2, AlertCircle, Lightbulb, ExternalLink, MapPin } from "lucide-react";

import { api } from "@/lib/api";
import { JobPosting } from "@/lib/types";

const SOURCE_LABELS: Record<string, string> = {
  vietnamworks: "VietnamWorks",
  topcv: "TopCV",
  itviec: "ITviec",
  careerviet: "CareerViet",
  jobsgo: "JobsGo",
  other: "Khác",
};

function formatSalary(min?: number, max?: number, currency = "VND", negotiable = false): string {
  if (negotiable) return "Thoả thuận";
  if (!min && !max) return "—";
  const fmt = (n: number) => (currency === "VND" ? `${(n / 1_000_000).toFixed(0)}tr` : `$${(n / 1000).toFixed(0)}k`);
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `Từ ${fmt(min)}`;
  return `Đến ${fmt(max!)}`;
}

type FitResult = {
  cv_id: string;
  job_id: string;
  score_total: number;
  score_breakdown?: Array<{ label: string; score: number; notes?: string }>;
  matched_skills?: string[];
  missing_skills?: string[];
  evidence?: string[];
  explanation?: string;
  calculated_at?: string;
};

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-400";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-[#365347]">{label}</span>
        <span className="font-bold text-[#173c31]">{score}/100</span>
      </div>
      <div className="h-2 rounded-full bg-[#f2f0e9]">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function getStoredCvId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("vica:lastCvId");
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;
  const [cvId, setCvId] = useState<string | null>(null);

  const [job, setJob] = useState<JobPosting | null>(null);
  const [fit, setFit] = useState<FitResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCvId(new URLSearchParams(window.location.search).get("cv_id") ?? getStoredCvId());

    let alive = true;
    setLoading(true);
    api
      .getJob<JobPosting>(jobId)
      .then((result) => {
        if (alive) setJob(result);
      })
      .catch(() => {
        if (alive) setError("Không tải được thông tin việc làm.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [jobId]);

  const score = useMemo(() => fit?.score_total ?? null, [fit]);

  async function computeFit() {
    if (!cvId) return;
    setScoring(true);
    setError(null);
    try {
      const result = await api.fitScore<FitResult>(cvId, jobId);
      setFit(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tính fit score.");
    } finally {
      setScoring(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 py-10 sm:px-7 lg:px-10"><div className="h-80 animate-pulse rounded-[1.5rem] bg-white/70" /></div>;
  }

  if (!job) {
    return <div className="mx-auto max-w-5xl px-4 py-10 text-center text-[#365347]/60">Không tìm thấy việc làm.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <Link href="/jobs" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#24543f]">
        <ArrowLeft className="h-4 w-4" />
        Quay lại tìm việc
      </Link>

      <section className="rounded-[1.5rem] border border-[#1c2923]/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(30,55,43,0.05)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-[-0.04em] text-[#173c31]">{job.title}</h1>
              <span className="rounded-full bg-[#f2f0e9] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#365347]/60">
                {SOURCE_LABELS[job.source] || job.source}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-[#365347]">{job.company}</p>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#365347]/68">
              <MapPin className="h-4 w-4" />
              {job.location || "Việt Nam"}
              <span>·</span>
              {formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_negotiable)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[#1c2923]/12 bg-white px-4 py-2.5 text-sm font-semibold text-[#24543f]"
            >
              <ExternalLink className="h-4 w-4" />
              Nguồn gốc
            </a>
            <Link
              href={cvId ? `/cv-recommendations?cv_id=${cvId}&job_id=${job.id}` : "/cv-upload"}
              className="rounded-xl bg-[#173c31] px-4 py-2.5 text-sm font-bold text-white"
            >
              Xem gợi ý
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {job.skills_required?.slice(0, 8).map((skill) => (
            <span key={skill} className="rounded-lg bg-[#dcebdd] px-2.5 py-1.5 text-xs font-semibold text-[#24543f]">
              {skill}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void computeFit()}
            disabled={!cvId || scoring}
            className="inline-flex items-center gap-2 rounded-xl bg-[#ef6a45] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {scoring ? "Đang tính..." : cvId ? "Đánh giá fit score" : "Upload CV trước"}
          </button>
          {!cvId && (
            <Link href="/cv-upload" className="rounded-xl border border-[#1c2923]/12 bg-white px-4 py-2.5 text-sm font-semibold text-[#24543f]">
              Tải CV lên
            </Link>
          )}
        </div>
      </section>

      {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {fit && (
        <section className="mt-6 grid gap-4 rounded-[1.5rem] border border-[#1c2923]/10 bg-white/80 p-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[1.25rem] bg-[#173c31] p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f6b49e]">Fit score</p>
            <div className="mt-4 text-5xl font-extrabold tracking-[-0.06em]">{score ?? 0}</div>
            <p className="mt-2 text-sm text-white/70">Tính từ CV đã lưu và mô tả công việc hiện tại.</p>
          </div>

          <div className="space-y-4">
            {fit.score_breakdown?.length ? (
              fit.score_breakdown.map((item) => (
                <ScoreBar key={item.label} score={item.score} label={item.label} />
              ))
            ) : (
              <div className="text-sm text-[#365347]/60">Backend chưa trả về breakdown chi tiết.</div>
            )}

            {fit.matched_skills?.length ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#24543f]">Khớp kỹ năng</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {fit.matched_skills.map((skill) => (
                    <span key={skill} className="rounded-lg bg-[#dcebdd] px-2.5 py-1.5 text-xs font-semibold text-[#24543f]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {fit.missing_skills?.length ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9d4229]">Cần bổ sung</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {fit.missing_skills.map((skill) => (
                    <span key={skill} className="rounded-lg bg-[#f8e5df] px-2.5 py-1.5 text-xs font-semibold text-[#9d4229]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {fit.explanation && (
              <div className="rounded-2xl bg-[#faf8f2] p-4 text-sm leading-6 text-[#365347]">
                <Lightbulb className="mb-2 h-4 w-4 text-[#d95332]" />
                {fit.explanation}
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-[#365347]/55">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {fit.calculated_at ? `Tính lúc ${new Date(fit.calculated_at).toLocaleString("vi-VN")}` : "Kết quả đã được trả về từ backend"}
            </div>
          </div>
        </section>
      )}

      <section className="mt-6 rounded-[1.5rem] border border-[#1c2923]/10 bg-white/80 p-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#24543f]">Mô tả công việc</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#365347]">{job.description || "Backend chưa có mô tả chi tiết."}</p>

        {job.requirements?.length ? (
          <div className="mt-6">
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#9d4229]">Yêu cầu</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[#365347]">
              {job.requirements.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#d95332]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}
