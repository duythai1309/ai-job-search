"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, MapPin, Sparkles, Building2, ArrowRight } from "lucide-react";

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

function getStoredCvId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("vica:lastCvId");
}

type FitResult = {
  score_total?: number;
  matched_skills?: string[];
  missing_skills?: string[];
  explanation?: string;
};

export default function JobMatchesPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(false);
  const [cvId, setCvId] = useState<string | null>(null);
  const [fits, setFits] = useState<Record<string, FitResult>>({});

  useEffect(() => {
    setCvId(getStoredCvId());
  }, []);

  async function searchJobs() {
    const value = query.trim();
    if (!value) return;
    setLoading(true);
    try {
      const result = await api.listJobs<{ jobs?: JobPosting[]; data?: { jobs?: JobPosting[] } }>({
        query: value,
        location: location.trim() || undefined,
        page_size: 20,
      });
      const list = Array.isArray((result as { jobs?: JobPosting[] })?.jobs)
        ? (result as { jobs: JobPosting[] }).jobs
        : (result as { data?: { jobs?: JobPosting[] } }).data?.jobs ?? [];
      setJobs(list);
    } finally {
      setLoading(false);
    }
  }

  async function computeFit(job: JobPosting) {
    if (!cvId) return;
    const result = await api.fitScore<FitResult>(cvId, job.id);
    setFits((prev) => ({ ...prev, [job.id]: result }));
  }

  const firstFit = useMemo(() => {
    const key = Object.keys(fits)[0];
    return key ? fits[key] : null;
  }, [fits]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d95332]">Step 03 / Match</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[#173c31]">Job matches</h1>
      <p className="mt-2 text-sm text-[#365347]/65">Tìm job và chấm fit score dựa trên CV đã upload gần nhất.</p>

      <section className="mt-8 rounded-[1.5rem] border border-[#1c2923]/10 bg-white/80 p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <label className="flex items-center gap-3 rounded-xl border border-[#1c2923]/10 bg-[#faf8f2] px-4 py-3">
            <Search className="h-5 w-5 text-[#365347]/50" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && void searchJobs()}
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#365347]/35"
              placeholder="Frontend Developer, Data Analyst..."
            />
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-[#1c2923]/10 bg-[#faf8f2] px-4 py-3">
            <MapPin className="h-5 w-5 text-[#365347]/50" />
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && void searchJobs()}
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#365347]/35"
              placeholder="Địa điểm"
            />
          </label>
          <button
            type="button"
            onClick={() => void searchJobs()}
            className="rounded-xl bg-[#173c31] px-6 py-3 text-sm font-bold text-white"
          >
            Tìm kiếm
          </button>
        </div>
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#365347]/60">
        <span className="rounded-full bg-[#eef4eb] px-3 py-1.5 font-semibold text-[#24543f]">
          CV: {cvId || "chưa có"}
        </span>
        {!cvId && <Link href="/cv-upload" className="font-semibold text-[#d95332]">Upload CV trước</Link>}
      </div>

      {loading && <div className="mt-6 rounded-[1.5rem] border border-[#1c2923]/10 bg-white/70 p-8 text-center text-[#365347]/60">Đang tìm việc...</div>}

      {!loading && jobs.length > 0 && (
        <div className="mt-6 grid gap-4">
          {jobs.map((job) => {
            const fit = fits[job.id];
            return (
              <article key={job.id} className="rounded-[1.5rem] border border-[#1c2923]/10 bg-white/80 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#eef4eb] text-[#24543f]">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-[#173c31]">{job.title}</h2>
                        <span className="rounded-full bg-[#f2f0e9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#365347]/60">
                          {SOURCE_LABELS[job.source] || job.source}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[#365347]">{job.company}</p>
                      <p className="mt-2 text-sm text-[#365347]/65">
                        {job.location || "Việt Nam"} · {formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_negotiable)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {cvId && (
                      <button
                        type="button"
                        onClick={() => void computeFit(job)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#ef6a45] px-4 py-2.5 text-sm font-bold text-white"
                      >
                        <Sparkles className="h-4 w-4" />
                        Tính fit score
                      </button>
                    )}
                    <Link href={`/jobs/${job.id}${cvId ? `?cv_id=${cvId}` : ""}`} className="rounded-xl border border-[#1c2923]/12 bg-white px-4 py-2.5 text-sm font-semibold text-[#24543f]">
                      Mở chi tiết
                    </Link>
                  </div>
                </div>

                {fit?.score_total != null && (
                  <div className="mt-4 rounded-2xl bg-[#faf8f2] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#24543f]">Fit score</p>
                    <p className="mt-2 text-4xl font-extrabold tracking-[-0.05em] text-[#173c31]">{fit.score_total}</p>
                    <p className="mt-2 text-sm leading-6 text-[#365347]">{fit.explanation || "Backend đã trả về kết quả."}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {fit.matched_skills?.map((skill) => (
                        <span key={skill} className="rounded-lg bg-[#dcebdd] px-2.5 py-1.5 text-xs font-semibold text-[#24543f]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-[#1c2923]/15 bg-white/70 p-10 text-center text-[#365347]/60">
          Nhập từ khóa để xem job match.
        </div>
      )}

      {firstFit?.missing_skills?.length ? (
        <div className="mt-6 rounded-[1.5rem] border border-[#1c2923]/10 bg-white/80 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9d4229]">Thiếu hoặc chưa xác minh</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {firstFit.missing_skills.map((skill) => (
              <span key={skill} className="rounded-lg bg-[#f8e5df] px-2.5 py-1.5 text-xs font-semibold text-[#9d4229]">
                {skill}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
