"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { JobPosting, SOURCE_LABELS, formatSalary } from "@/lib/types";
import toast from "react-hot-toast";
import {
  Search, MapPin, Bookmark, ExternalLink, Briefcase,
  Clock, Building2,
} from "lucide-react";

const SOURCES = [
  { id: "vietnamworks", label: "VietnamWorks" },
  { id: "topcv",        label: "TopCV" },
  { id: "itviec",       label: "ITviec" },
  { id: "careerviet",   label: "CareerViet" },
];

const QUICK_SEARCHES = [
  "Frontend Developer", "Data Analyst", "Product Manager",
  "Backend Developer", "UX Designer", "Marketing",
];

function CompanyAvatar({ logo, name }: { logo?: string; name: string }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={name}
        className="w-11 h-11 rounded-xl object-contain border border-slate-200 shrink-0 bg-white"
      />
    );
  }
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold shrink-0">
      {initials || <Building2 className="w-5 h-5" />}
    </div>
  );
}

export default function JobsPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const search = useCallback(
    async (q?: string) => {
      const searchQuery = q ?? query;
      if (!searchQuery.trim()) {
        toast.error("Vui lòng nhập từ khóa tìm kiếm");
        return;
      }
      if (q) setQuery(q);
      setLoading(true);
      setSearched(true);
      try {
        const params = new URLSearchParams({
          q: searchQuery,
          location,
          sources: selectedSources.join(","),
          limit: "30",
        });
        const result = await api.get<{ jobs: JobPosting[] }>(`/jobs/search?${params}`);
        setJobs(result.jobs || []);
        if (result.jobs.length === 0)
          toast("Không tìm thấy việc làm phù hợp", { icon: "🔍" });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Có lỗi khi tìm kiếm";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [query, location, selectedSources]
  );

  function toggleSource(id: string) {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function saveJob(job: JobPosting) {
    if (savedIds.has(job.id)) return;
    try {
      await api.post("/applications", {
        job_posting_id: job.id,
        company_name: job.company,
        role_title: job.title,
        source_url: job.url,
        status: "bookmarked",
      });
      setSavedIds((prev) => new Set(prev).add(job.id));
      toast.success("Đã lưu việc làm");
    } catch {
      toast.error("Không thể lưu việc làm");
    }
  }

  return (
    <div className="px-8 lg:px-12 py-10 max-w-screen-2xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tìm việc</h1>
        <p className="text-slate-400 mt-1.5 text-sm">
          Tổng hợp từ VietnamWorks, TopCV, ITviec và CareerViet
        </p>
      </div>

      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Vị trí, kỹ năng, tên công ty..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-slate-400 transition-colors"
          />
        </div>
        <div className="relative sm:w-52">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Địa điểm"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-slate-400 transition-colors"
          />
        </div>
        <button
          onClick={() => search()}
          disabled={loading}
          className="bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white px-8 py-3 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
        >
          {loading ? "Đang tìm..." : "Tìm kiếm"}
        </button>
      </div>

      {/* Filters & suggestions */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-10 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400">Nguồn</span>
          {SOURCES.map((s) => (
            <button
              key={s.id}
              onClick={() => toggleSource(s.id)}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer border ${
                selectedSources.includes(s.id)
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400">Gợi ý</span>
          {QUICK_SEARCHES.map((q) => (
            <button
              key={q}
              onClick={() => search(q)}
              className="text-slate-600 hover:text-slate-900 underline underline-offset-4 decoration-slate-300 hover:decoration-slate-900 transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="py-6 animate-pulse flex gap-4">
              <div className="w-11 h-11 rounded-xl bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-slate-100 rounded" />
                <div className="h-3 w-1/4 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty searched state */}
      {!loading && searched && jobs.length === 0 && (
        <div className="text-center py-24 border border-dashed border-slate-200 rounded-2xl">
          <Search className="w-6 h-6 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Không tìm thấy kết quả</p>
          <p className="text-sm text-slate-400 mt-1">Thử từ khóa khác hoặc thay đổi bộ lọc nguồn</p>
        </div>
      )}

      {/* Initial empty state */}
      {!loading && !searched && (
        <div className="text-center py-24 border border-dashed border-slate-200 rounded-2xl">
          <Briefcase className="w-6 h-6 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Nhập từ khóa để bắt đầu tìm kiếm</p>
          <p className="text-sm text-slate-400 mt-1">
            Ví dụ: &quot;Frontend Developer&quot;, &quot;Data Analyst&quot;, &quot;Product Manager&quot;
          </p>
        </div>
      )}

      {/* Results: flat list rows */}
      {!loading && jobs.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 mb-3">{jobs.length} kết quả</p>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {jobs.map((job) => {
              const saved = savedIds.has(job.id);
              return (
                <div key={job.id} className="py-6 group">
                  <div className="flex items-start gap-4">
                    <CompanyAvatar logo={job.company_logo_url} name={job.company} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="font-semibold text-slate-900 hover:underline underline-offset-4 transition-colors text-[15px] line-clamp-1"
                          >
                            {job.title}
                          </Link>
                          <p className="text-sm text-slate-500 mt-0.5">{job.company}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
                            {SOURCE_LABELS[job.source] || job.source}
                          </span>
                          {job.is_remote && (
                            <span className="text-[11px] px-2.5 py-1 rounded-full font-medium border border-slate-200 text-slate-600">
                              Remote
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {job.location}
                          </span>
                        )}
                        {(job.salary_min || job.salary_max || job.salary_negotiable) && (
                          <span className="font-medium text-slate-700">
                            {formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_negotiable)}
                          </span>
                        )}
                        {job.employment_type && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {job.employment_type}
                          </span>
                        )}
                        {job.skills_required.length > 0 && (
                          <span className="text-slate-400">
                            {job.skills_required.slice(0, 5).join(" · ")}
                            {job.skills_required.length > 5 && ` +${job.skills_required.length - 5}`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Row actions */}
                    <div className="flex items-center gap-2 shrink-0 self-center">
                      <button
                        onClick={() => saveJob(job)}
                        disabled={saved}
                        title={saved ? "Đã lưu" : "Lưu việc làm"}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                          saved
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-900"
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${saved ? "fill-white" : ""}`} />
                      </button>
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ứng tuyển trên trang gốc"
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-900 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="hidden sm:inline-flex items-center px-4 h-9 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                      >
                        Đánh giá AI
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
