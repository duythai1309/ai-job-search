"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { JobPosting, FitEvaluation, SOURCE_LABELS, formatSalary } from "@/lib/types";
import { TECH_ROLES, SCOPE_LABEL } from "@/lib/scope";
import toast from "react-hot-toast";
import clsx from "clsx";
import {
  Search, MapPin, Bookmark, ExternalLink, Briefcase,
  Clock, Building2, RefreshCw, Sparkles, CheckCircle2,
  AlertCircle, Lightbulb, FileText,
} from "lucide-react";

const SOURCES = [
  { id: "vietnamworks", label: "VietnamWorks" },
  { id: "topcv",        label: "TopCV" },
  { id: "itviec",       label: "ITviec" },
  { id: "careerviet",   label: "CareerViet" },
  { id: "ybox",         label: "YBOX" },
  { id: "vieclam24h",   label: "Vieclam24h" },
];

const QUICK_SEARCHES = TECH_ROLES;

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
  const [crawling, setCrawling] = useState(false);
  const [searched, setSearched] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [evaluation, setEvaluation] = useState<FitEvaluation | null>(null);
  const [loadingEval, setLoadingEval] = useState(false);

  const selectJob = useCallback((job: JobPosting) => {
    setSelectedJob(job);
    setEvaluation(null);
  }, []);

  async function evaluateJob(jobId: string) {
    setLoadingEval(true);
    try {
      const result = await api.post<FitEvaluation>(`/jobs/${jobId}/evaluate-fit`);
      setEvaluation(result);
    } catch (e: any) {
      toast.error(e.message || "Có lỗi khi đánh giá");
    } finally {
      setLoadingEval(false);
    }
  }

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
        const found = result.jobs || [];
        setJobs(found);
        if (found.length > 0) {
          setSelectedJob(found[0]);
          setEvaluation(null);
        } else {
          setSelectedJob(null);
          setEvaluation(null);
        }
        if (found.length === 0)
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

  async function crawlNow() {
    if (crawling) return;
    setCrawling(true);
    const t = toast.loading("Đang cập nhật dữ liệu việc làm... (có thể mất 30–60s)");
    try {
      const res = await api.post<{ total: number }>("/jobs/crawl", {
        q: query.trim() || undefined,
        sources: selectedSources.length ? selectedSources : undefined,
        location: location.trim() || undefined,
      });
      toast.success(`Đã cập nhật ${res.total ?? 0} việc làm vào hệ thống`, { id: t });
      if (query.trim()) await search();
    } catch {
      toast.error("Cập nhật dữ liệu thất bại", { id: t });
    } finally {
      setCrawling(false);
    }
  }

  function toggleSource(id: string) {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function saveJob(job: JobPosting) {
    if (savedIds.has(job.id)) return;
    try {
      await api.post("/applications/", {
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
    <div className="max-w-screen-2xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tìm việc</h1>
        <p className="text-slate-400 mt-1.5 text-sm">
          Việc làm {SCOPE_LABEL} — tổng hợp từ VietnamWorks, TopCV, ITviec và CareerViet
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
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-8 py-3 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
        >
          {loading ? "Đang tìm..." : "Tìm kiếm"}
        </button>
        <button
          onClick={crawlNow}
          disabled={crawling}
          title="Crawl dữ liệu mới nhất từ các nguồn rồi lưu vào hệ thống"
          className="flex items-center justify-center gap-2 border border-slate-200 bg-white hover:border-slate-400 disabled:opacity-60 text-slate-700 px-5 py-3 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${crawling ? "animate-spin" : ""}`} />
          {crawling ? "Đang cập nhật..." : "Cập nhật dữ liệu"}
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
                  ? "bg-blue-600 text-white border-blue-600"
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
              className="text-slate-600 hover:text-blue-600 underline underline-offset-4 decoration-slate-300 hover:decoration-blue-400 transition-colors cursor-pointer"
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

      {/* Results: flat list / master-detail layout */}
      {!loading && jobs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left panel: job list */}
          <div className="lg:col-span-5 space-y-3">
            <p className="text-xs text-slate-400 mb-2">{jobs.length} kết quả</p>
            <div className="space-y-3 lg:max-h-[85vh] lg:overflow-y-auto lg:pr-2 scrollbar-thin">
              {jobs.map((job) => {
                const saved = savedIds.has(job.id);
                const active = selectedJob?.id === job.id;
                return (
                  <div
                    key={job.id}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        window.location.href = `/jobs/${job.id}`;
                      } else {
                        selectJob(job);
                      }
                    }}
                    className={clsx(
                      "p-5 rounded-2xl border transition-all cursor-pointer bg-white flex flex-col gap-3 hover:border-slate-300 hover:shadow-sm",
                      active
                        ? "border-blue-600 ring-1 ring-blue-500 bg-blue-50/10"
                        : "border-slate-200/60"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <CompanyAvatar logo={job.company_logo_url} name={job.company} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm hover:underline line-clamp-1">
                          {job.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{job.company}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1 text-[10px]">
                      <span className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-600 font-medium">
                        {SOURCE_LABELS[job.source] || job.source}
                      </span>
                      {job.is_remote && (
                        <span className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 rounded-md font-medium">
                          Remote
                        </span>
                      )}
                      {job.location && (
                        <span className="text-slate-400 font-medium flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" /> {job.location.split(" · ")[0]}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <span className="text-xs font-semibold text-slate-700">
                        {formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_negotiable)}
                      </span>
                      
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => saveJob(job)}
                          disabled={saved}
                          title={saved ? "Đã lưu" : "Lưu việc làm"}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                            saved
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-blue-600"
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-white" : ""}`} />
                        </button>
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-900 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: job detail (desktop only) */}
          <div className="hidden lg:block lg:col-span-7 sticky top-0 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm lg:max-h-[85vh] lg:overflow-y-auto scrollbar-thin">
            {selectedJob ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
                  <div className="flex items-start gap-4">
                    <CompanyAvatar logo={selectedJob.company_logo_url} name={selectedJob.company} />
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 leading-snug">{selectedJob.title}</h2>
                      <p className="text-sm font-medium text-slate-600 mt-1">{selectedJob.company}</p>
                      <div className="flex flex-wrap gap-2.5 mt-2.5 text-xs text-slate-500 font-body">
                        {selectedJob.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{selectedJob.location}</span>}
                        <span className="font-semibold text-slate-800">{formatSalary(selectedJob.salary_min, selectedJob.salary_max, selectedJob.salary_currency, selectedJob.salary_negotiable)}</span>
                        {selectedJob.employment_type && <span>{selectedJob.employment_type}</span>}
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-slate-50 border border-slate-200/50 rounded-xl text-xs font-semibold text-slate-600">
                    {SOURCE_LABELS[selectedJob.source] || selectedJob.source}
                  </span>
                </div>

                {/* Operations bar */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => evaluateJob(selectedJob.id)}
                    disabled={loadingEval}
                    className="inline-flex items-center gap-2 bg-[#001E36] hover:bg-[#002D52] disabled:opacity-60 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    {loadingEval ? "Đang đánh giá AI..." : "Đánh giá độ phù hợp AI"}
                  </button>
                  <Link
                    href={`/jobs/${selectedJob.id}/tailor`}
                    className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> Sửa CV cho vị trí này
                  </Link>
                  <button
                    onClick={() => saveJob(selectedJob)}
                    disabled={savedIds.has(selectedJob.id)}
                    className="border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                  >
                    {savedIds.has(selectedJob.id) ? "Đã lưu vào tracker" : "Lưu vào tracker"}
                  </button>
                  <a
                    href={selectedJob.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Xem bản gốc
                  </a>
                </div>

                {/* AI Evaluation */}
                {evaluation && (
                  <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" /> Kết quả đánh giá AI
                      </h3>
                      <div className={clsx(
                        "px-3 py-1 rounded-lg border font-bold text-xs",
                        evaluation.overall_score >= 75
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : evaluation.overall_score >= 50
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {evaluation.overall_score}/100 · {evaluation.verdict}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600 font-medium">Kỹ năng kỹ thuật</span>
                          <span className="font-bold text-slate-900">{evaluation.technical_skills.score}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-blue-600" style={{ width: `${evaluation.technical_skills.score}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600 font-medium">Kinh nghiệm</span>
                          <span className="font-bold text-slate-900">{evaluation.experience_match.score}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-blue-600" style={{ width: `${evaluation.experience_match.score}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                      <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50">
                        <p className="font-bold text-emerald-800 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Điểm mạnh</p>
                        <ul className="space-y-1 text-xs text-emerald-700">
                          {evaluation.strengths.slice(0, 3).map((s, i) => <li key={i}>· {s}</li>)}
                        </ul>
                      </div>
                      <div className="bg-red-50/50 rounded-xl p-3 border border-red-100/50">
                        <p className="font-bold text-red-800 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Khoảng cách</p>
                        <ul className="space-y-1 text-xs text-red-700">
                          {evaluation.gaps.slice(0, 3).map((g, i) => <li key={i}>· {g}</li>)}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-blue-50/40 rounded-xl p-3.5 border border-blue-100/50 text-xs text-blue-800">
                      <p className="font-bold text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5" /> Khuyến nghị</p>
                      <p className="leading-relaxed">{evaluation.recommendation}</p>
                    </div>
                  </div>
                )}

                {/* Job Description & Requirements */}
                <div className="space-y-5">
                  {selectedJob.description && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Mô tả công việc</h3>
                      <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedJob.description}</div>
                    </div>
                  )}

                  {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Yêu cầu công việc</h3>
                      <ul className="space-y-2">
                        {selectedJob.requirements.map((r, i) => (
                          <li key={i} className="text-sm text-slate-700 flex gap-2">
                            <span className="text-blue-500 shrink-0 font-bold">·</span>{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedJob.skills_required && selectedJob.skills_required.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Kỹ năng yêu cầu</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.skills_required.map((s) => (
                          <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Phúc lợi</h3>
                      <ul className="space-y-2">
                        {selectedJob.benefits.map((b, i) => (
                          <li key={i} className="text-xs text-slate-600 flex gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />{b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-400">
                <Briefcase className="w-10 h-10 mb-3 text-slate-300" />
                <p className="font-semibold text-slate-600">Chọn một tin tuyển dụng</p>
                <p className="text-xs text-slate-400 mt-1">Chi tiết công việc và đánh giá AI sẽ hiển thị ở đây.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
