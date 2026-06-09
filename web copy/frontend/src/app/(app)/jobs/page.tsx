"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { JobPosting, SOURCE_LABELS, formatSalary } from "@/lib/types";
import toast from "react-hot-toast";

const SOURCES = [
  { id: "vietnamworks", label: "VietnamWorks", color: "bg-red-100 text-red-700" },
  { id: "topcv", label: "TopCV", color: "bg-blue-100 text-blue-700" },
  { id: "itviec", label: "ITviec", color: "bg-purple-100 text-purple-700" },
  { id: "careerviet", label: "CareerViet", color: "bg-green-100 text-green-700" },
];

const SOURCE_BADGE: Record<string, string> = {
  vietnamworks: "bg-red-100 text-red-700",
  topcv: "bg-blue-100 text-blue-700",
  itviec: "bg-purple-100 text-purple-700",
  careerviet: "bg-green-100 text-green-700",
  jobsgo: "bg-orange-100 text-orange-700",
};

export default function JobsPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async () => {
    if (!query.trim()) {
      toast.error("Vui lòng nhập từ khóa tìm kiếm");
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({
        q: query,
        location,
        sources: selectedSources.join(","),
        limit: "30",
      });
      const result = await api.get<{ jobs: JobPosting[] }>(`/jobs/search?${params}`);
      setJobs(result.jobs || []);
      if (result.jobs.length === 0) {
        toast("Không tìm thấy việc làm phù hợp", { icon: "🔍" });
      }
    } catch (e: any) {
      toast.error(e.message || "Có lỗi khi tìm kiếm");
    } finally {
      setLoading(false);
    }
  }, [query, location, selectedSources]);

  function toggleSource(id: string) {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function saveJob(job: JobPosting) {
    try {
      await api.post(`/applications`, {
        job_posting_id: job.id,
        company_name: job.company,
        role_title: job.title,
        source_url: job.url,
        status: "bookmarked",
      });
      toast.success("Đã lưu việc làm");
    } catch {
      toast.error("Không thể lưu việc làm");
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tìm kiếm việc làm</h1>
        <p className="text-gray-500 mt-1">Tổng hợp từ VietnamWorks, TopCV, ITviec và CareerViet</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Tên công việc, kỹ năng, công ty..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            type="text"
            placeholder="Địa điểm (Hà Nội, HCM...)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            className="w-48 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={search}
            disabled={loading}
            className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-medium transition"
          >
            {loading ? "Đang tìm..." : "Tìm kiếm"}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Nguồn:</span>
          {SOURCES.map((s) => (
            <button
              key={s.id}
              onClick={() => toggleSource(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedSources.includes(s.id)
                  ? s.color + " ring-2 ring-offset-1 ring-current"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s.label}
            </button>
          ))}
          {selectedSources.length > 0 && (
            <button
              onClick={() => setSelectedSources([])}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse h-28" />
          ))}
        </div>
      )}

      {!loading && searched && jobs.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🔍</div>
          <p className="font-medium">Không tìm thấy kết quả</p>
          <p className="text-sm mt-1">Thử từ khóa khác hoặc thay đổi nguồn tìm kiếm</p>
        </div>
      )}

      {!loading && !searched && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">💼</div>
          <p className="font-medium">Nhập từ khóa để bắt đầu tìm kiếm</p>
          <p className="text-sm mt-1">Ví dụ: "Frontend Developer", "Data Analyst", "Marketing Manager"</p>
        </div>
      )}

      <div className="space-y-3">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group"
          >
            <div className="flex items-start gap-4">
              {job.company_logo_url && (
                <img
                  src={job.company_logo_url}
                  alt={job.company}
                  className="w-12 h-12 rounded-xl object-contain border border-gray-100 shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-semibold text-gray-900 hover:text-brand-600 transition line-clamp-1 group-hover:text-brand-600"
                    >
                      {job.title}
                    </Link>
                    <p className="text-sm text-gray-600 mt-0.5">{job.company}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${SOURCE_BADGE[job.source] || "bg-gray-100 text-gray-600"}`}>
                      {SOURCE_LABELS[job.source] || job.source}
                    </span>
                    {job.is_remote && (
                      <span className="text-xs px-2 py-1 rounded-lg bg-teal-100 text-teal-700 font-medium">Remote</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                  {job.location && <span>📍 {job.location}</span>}
                  <span>💰 {formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_negotiable)}</span>
                  {job.employment_type && <span>⏰ {job.employment_type}</span>}
                  {job.experience_years_min !== undefined && job.experience_years_min !== null && (
                    <span>🎓 {job.experience_years_min}+ năm kinh nghiệm</span>
                  )}
                </div>

                {job.skills_required.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {job.skills_required.slice(0, 5).map((skill) => (
                      <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                        {skill}
                      </span>
                    ))}
                    {job.skills_required.length > 5 && (
                      <span className="text-xs text-gray-400">+{job.skills_required.length - 5}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
              <Link
                href={`/jobs/${job.id}`}
                className="flex-1 text-center text-sm font-medium text-brand-600 hover:text-brand-700 transition"
              >
                Xem chi tiết & đánh giá phù hợp →
              </Link>
              <button
                onClick={() => saveJob(job)}
                className="px-4 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Lưu
              </button>
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition"
              >
                Ứng tuyển
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
