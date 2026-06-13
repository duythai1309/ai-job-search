"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import { JobPosting } from "@/lib/types";
import { Building2, MapPin, Search, Sparkles, ExternalLink } from "lucide-react";

const QUICK_SEARCHES = ["Frontend Developer", "Data Analyst", "Product Manager", "Backend Developer"];

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

export default function JobsPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (nextQuery?: string) => {
    const value = (nextQuery ?? query).trim();
    if (!value) return;

    setLoading(true);
    setSearched(true);
    try {
      const result = await api.listJobs<{
        jobs?: JobPosting[];
        data?: { jobs?: JobPosting[] };
      }>({
        query: value,
        location: location.trim() || undefined,
        page_size: 24,
      });

      const list = Array.isArray((result as { jobs?: JobPosting[] })?.jobs)
        ? (result as { jobs: JobPosting[] }).jobs
        : (result as { data?: { jobs?: JobPosting[] } }).data?.jobs ?? [];
      setJobs(list);
    } finally {
      setLoading(false);
    }
  }, [location, query]);

  useEffect(() => {
    void search("Frontend Developer");
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d95332]">Step 03 / Discover</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[#173c31]">Tìm việc</h1>
        <p className="mt-2 text-sm text-[#365347]/65">Tổng hợp việc làm từ nhiều nguồn, ưu tiên kết quả đã chuẩn hóa.</p>
      </div>

      <section className="rounded-[1.5rem] border border-[#1c2923]/10 bg-white/78 p-4 shadow-[0_18px_60px_rgba(30,55,43,0.05)] sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <label className="flex items-center gap-3 rounded-xl border border-[#1c2923]/10 bg-[#faf8f2] px-4 py-3">
            <Search className="h-5 w-5 text-[#365347]/50" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && void search()}
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#365347]/35"
              placeholder="Vị trí, kỹ năng, tên công ty..."
            />
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-[#1c2923]/10 bg-[#faf8f2] px-4 py-3">
            <MapPin className="h-5 w-5 text-[#365347]/50" />
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && void search()}
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#365347]/35"
              placeholder="Địa điểm"
            />
          </label>
          <button
            type="button"
            onClick={() => void search()}
            className="rounded-xl bg-[#173c31] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#10261f]"
          >
            Tìm kiếm
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#365347]/40">Gợi ý</span>
          {QUICK_SEARCHES.map((item) => (
            <button
              key={item}
              onClick={() => {
                setQuery(item);
                void search(item);
              }}
              className="rounded-full border border-[#1c2923]/10 bg-white px-3 py-1.5 text-xs font-semibold text-[#365347]/75 transition hover:border-[#24543f] hover:text-[#173c31]"
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {loading && (
        <div className="mt-6 grid gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-[1.5rem] border border-[#1c2923]/10 bg-white/60" />
          ))}
        </div>
      )}

      {!loading && searched && jobs.length === 0 && (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-[#1c2923]/15 bg-white/65 p-10 text-center text-[#365347]/60">
          Không tìm thấy việc làm phù hợp.
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <div className="mt-6 grid gap-4">
          {jobs.map((job) => (
            <article
              key={job.id}
              className="rounded-[1.5rem] border border-[#1c2923]/10 bg-white/80 p-5 shadow-[0_18px_60px_rgba(30,55,43,0.04)]"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#eef4eb] text-[#24543f]">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-[#173c31]">{job.title}</h2>
                      <span className="rounded-full bg-[#f2f0e9] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#365347]/60">
                        {SOURCE_LABELS[job.source] || job.source}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[#365347]">{job.company}</p>
                    <p className="mt-2 text-sm text-[#365347]/68">
                      {job.location || "Việt Nam"} · {formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_negotiable)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="rounded-xl bg-[#173c31] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#10261f]"
                  >
                    Xem chi tiết
                  </Link>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#1c2923]/12 bg-white px-4 py-2.5 text-sm font-semibold text-[#24543f] transition hover:border-[#24543f]"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Nguồn gốc
                  </a>
                </div>
              </div>

              {job.skills_required?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {job.skills_required.slice(0, 6).map((skill) => (
                    <span key={skill} className="rounded-lg bg-[#dcebdd] px-2.5 py-1.5 text-xs font-semibold text-[#24543f]">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {!loading && !searched && (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-[#1c2923]/15 bg-white/65 p-10 text-center text-[#365347]/60">
          Nhập từ khóa để bắt đầu tìm kiếm.
        </div>
      )}
    </div>
  );
}
