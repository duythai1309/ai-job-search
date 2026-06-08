"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { JobPosting, SOURCE_LABELS, formatSalary } from "@/lib/types";
import toast from "react-hot-toast";
import { Search, MapPin, Bookmark, ExternalLink, Briefcase } from "lucide-react";

const SOURCES = [
  { id: "vietnamworks", label: "VietnamWorks", color: "bg-red-100 text-red-700" },
  { id: "topcv", label: "TopCV", color: "bg-blue-100 text-blue-700" },
  { id: "itviec", label: "ITviec", color: "bg-violet-100 text-violet-700" },
  { id: "careerviet", label: "CareerViet", color: "bg-emerald-100 text-emerald-700" },
];

const SOURCE_BADGE: Record<string, string> = {
  vietnamworks: "bg-red-100 text-red-700",
  topcv: "bg-blue-100 text-blue-700",
  itviec: "bg-violet-100 text-violet-700",
  careerviet: "bg-emerald-100 text-emerald-700",
  jobsgo: "bg-orange-100 text-orange-700",
};

const QUICK_SEARCHES = ["Frontend Developer", "Data Analyst", "Product Manager", "Backend Developer", "UX Designer"];

export default function JobsPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q?: string) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) {
      toast.error("Vui lòng nhập từ khóa tìm kiếm");
      return;
    }
    if (q) setQuery(q);
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ q: searchQuery, location, sources: selectedSources.join(","), limit: "30" });
      const result = await api.get<{ jobs: JobPosting[] }>(`/jobs/search?${params}`);
      setJobs(result.jobs || []);
      if (result.jobs.length === 0) toast("Không tìm thấy việc làm phù hợp", { icon: "🔍" });
    } catch (e: any) {
      toast.error(e.message || "Có lỗi khi tìm kiếm");
    } finally {
      setLoading(false);
    }
  }, [query, location, selectedSources]);

  function toggleSource(id: string) {
    setSelectedSources((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }

  async function saveJob(job: JobPosting) {
    try {
      await api.post("/applications", { job_posting_id: job.id, company_name: job.company, role_title: job.title, source_url: job.url, status: "bookmarked" });
      toast.success("Đã lưu việc làm");
    } catch {
      toast.error("Không thể lưu việc làm");
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tìm kiếm việc làm</h1>
        <p className="text-slate-500 mt-1 text-sm font-body">Tổng hợp từ VietnamWorks, TopCV, ITviec và CareerViet</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-100 mb-5">
        <div className="flex gap-3 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tên công việc, kỹ năng, công ty..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-body"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Địa điểm..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              className="w-44 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-body"
            />
          </div>
          <button
            onClick={() => search()}
            disabled={loading}
            className="bg-primary-800 hover:bg-primary-900 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer"
          >
            {loading ? "Đang tìm..." : "Tìm kiếm"}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="text-xs text-slate-400 font-body">Nguồn:</span>
          {SOURCES.map((s) => (
            <button
              key={s.id}
              onClick={() => toggleSource(s.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                selectedSources.includes(s.id) ? s.color + " ring-1 ring-current" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s.label}
            </button>
          ))}
          {selectedSources.length > 0 && (
            <button onClick={() => setSelectedSources([])} className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">Xóa lọc</button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-body">Gợi ý:</span>
          {QUICK_SEARCHES.map((q) => (
            <button key={q} onClick={() => search(q)} className="text-xs text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1 rounded-lg font-medium transition-all duration-150 cursor-pointer">
              {q}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse h-28" />
          ))}
        </div>
      )}

      {!loading && searched && jobs.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-slate-600">Không tìm thấy kết quả</p>
          <p className="text-sm mt-1 font-body">Thử từ khóa khác hoặc thay đổi nguồn tìm kiếm</p>
        </div>
      )}

      {!loading && !searched && (
        <div className="text-center py-16 text-slate-400">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-slate-600">Nhập từ khóa để bắt đầu tìm kiếm</p>
          <p className="text-sm mt-1 font-body">Ví dụ: "Frontend Developer", "Data Analyst", "Marketing Manager"</p>
        </div>
      )}

      <div className="space-y-3">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-primary-700 transition-all duration-200 rounded-l-2xl" />
            <div className="flex items-start gap-4">
              {job.company_logo_url && (
                <img src={job.company_logo_url} alt={job.company} className="w-11 h-11 rounded-xl object-contain border border-slate-100 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/jobs/${job.id}`} className="font-semibold text-slate-900 hover:text-primary-700 transition-colors line-clamp-1 text-sm">
                      {job.title}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5 font-body">{job.company}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${SOURCE_BADGE[job.source] || "bg-slate-100 text-slate-600"}`}>
                      {SOURCE_LABELS[job.source] || job.source}
                    </span>
                    {job.is_remote && <span className="text-xs px-2 py-0.5 rounded-md bg-teal-100 text-teal-700 font-medium">Remote</span>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500 font-body">
                  {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                  <span>{formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_negotiable)}</span>
                  {job.employment_type && <span>{job.employment_type}</span>}
                </div>

                {job.skills_required.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {job.skills_required.slice(0, 5).map((skill) => (
                      <span key={skill} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-body">{skill}</span>
                    ))}
                    {job.skills_required.length > 5 && <span className="text-xs text-slate-400 font-body">+{job.skills_required.length - 5}</span>}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-50">
              <Link href={`/jobs/${job.id}`} className="flex-1 text-center text-xs font-semibold text-primary-700 hover:text-primary-900 transition-colors font-body">
                Xem chi tiết & đánh giá AI
              </Link>
              <button onClick={() => saveJob(job)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition-all duration-150 cursor-pointer">
                <Bookmark className="w-3.5 h-3.5" /> Lưu
              </button>
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-800 text-white text-xs font-semibold hover:bg-primary-900 transition-all duration-150">
                <ExternalLink className="w-3.5 h-3.5" /> Ứng tuyển
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
