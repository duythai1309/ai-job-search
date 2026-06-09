"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { JobPosting, FitEvaluation, SOURCE_LABELS, formatSalary } from "@/lib/types";
import toast from "react-hot-toast";
import clsx from "clsx";

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 75 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-400";
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-600 font-semibold">{score}/100</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [evaluation, setEvaluation] = useState<FitEvaluation | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [loadingEval, setLoadingEval] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<JobPosting>(`/jobs/${id}`)
      .then(setJob)
      .catch(() => toast.error("Không tải được thông tin việc làm"))
      .finally(() => setLoadingJob(false));
  }, [id]);

  async function evaluate() {
    setLoadingEval(true);
    try {
      const result = await api.post<FitEvaluation>(`/jobs/${id}/evaluate-fit`);
      setEvaluation(result);
    } catch (e: any) {
      toast.error(e.message || "Có lỗi khi đánh giá");
    } finally {
      setLoadingEval(false);
    }
  }

  async function apply() {
    if (!job) return;
    setSaving(true);
    try {
      await api.post("/applications", {
        job_posting_id: job.id,
        company_name: job.company,
        role_title: job.title,
        source_url: job.url,
        status: "applied",
        fit_score: evaluation?.overall_score,
        fit_evaluation: evaluation,
      });
      toast.success("Đã thêm vào danh sách ứng tuyển");
      router.push("/applications");
    } catch {
      toast.error("Không thể lưu đơn ứng tuyển");
    } finally {
      setSaving(false);
    }
  }

  const verdictColor = evaluation
    ? evaluation.overall_score >= 75
      ? "bg-green-100 text-green-700 border-green-200"
      : evaluation.overall_score >= 50
      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
      : "bg-red-100 text-red-700 border-red-200"
    : "";

  if (loadingJob) {
    return <div className="p-8 animate-pulse"><div className="h-64 bg-gray-100 rounded-2xl" /></div>;
  }
  if (!job) {
    return <div className="p-8 text-center text-gray-400">Không tìm thấy việc làm</div>;
  }

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/jobs" className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block">
        ← Quay lại tìm kiếm
      </Link>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-start gap-4">
          {job.company_logo_url && (
            <img src={job.company_logo_url} alt={job.company} className="w-16 h-16 rounded-xl object-contain border border-gray-100" />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-lg text-gray-600 mt-1">{job.company}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500">
              {job.location && <span>📍 {job.location}</span>}
              <span>💰 {formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_negotiable)}</span>
              {job.employment_type && <span>⏰ {job.employment_type}</span>}
              <span className="capitalize px-2 py-0.5 bg-gray-100 rounded-lg text-xs">
                {SOURCE_LABELS[job.source] || job.source}
              </span>
              {job.is_remote && <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-lg text-xs">Remote</span>}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={evaluate}
            disabled={loadingEval}
            className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition"
          >
            {loadingEval ? "Đang phân tích..." : "🤖 Đánh giá độ phù hợp"}
          </button>
          <button
            onClick={apply}
            disabled={saving}
            className="border border-brand-500 text-brand-600 hover:bg-brand-50 px-5 py-2.5 rounded-xl font-medium text-sm transition"
          >
            {saving ? "Đang lưu..." : "Lưu vào tracker"}
          </button>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto border border-gray-200 text-gray-600 hover:bg-gray-50 px-5 py-2.5 rounded-xl font-medium text-sm transition"
          >
            Xem bản gốc ↗
          </a>
        </div>
      </div>

      {evaluation && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 text-lg">Kết quả đánh giá AI</h2>
            <div className={clsx("px-4 py-1.5 rounded-xl border font-semibold text-sm", verdictColor)}>
              {evaluation.overall_score}/100 · {evaluation.verdict}
            </div>
          </div>

          <div className="mb-5">
            <ScoreBar score={evaluation.technical_skills.score} label="Kỹ năng kỹ thuật" />
            <ScoreBar score={evaluation.experience_match.score} label="Kinh nghiệm" />
            <ScoreBar score={evaluation.cultural_fit.score} label="Văn hóa & hành vi" />
            <ScoreBar score={evaluation.career_alignment.score} label="Định hướng nghề nghiệp" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 rounded-xl p-4">
              <h3 className="font-semibold text-green-800 text-sm mb-2">✅ Điểm mạnh</h3>
              <ul className="space-y-1">
                {evaluation.strengths.map((s, i) => (
                  <li key={i} className="text-green-700 text-sm">· {s}</li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <h3 className="font-semibold text-red-800 text-sm mb-2">⚠️ Khoảng cách</h3>
              <ul className="space-y-1">
                {evaluation.gaps.map((g, i) => (
                  <li key={i} className="text-red-700 text-sm">· {g}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="font-semibold text-blue-800 text-sm mb-1">💡 Khuyến nghị</h3>
            <p className="text-blue-700 text-sm">{evaluation.recommendation}</p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
            <Link
              href={`/cv`}
              className="text-sm text-brand-600 hover:underline"
            >
              Tạo CV cho vị trí này →
            </Link>
            <Link
              href={`/chat?context=job&id=${job.id}`}
              className="text-sm text-brand-600 hover:underline"
            >
              Hỏi AI về chiến lược ứng tuyển →
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-5">
          {job.description && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4">Mô tả công việc</h2>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</div>
            </div>
          )}

          {job.requirements.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4">Yêu cầu</h2>
              <ul className="space-y-2">
                {job.requirements.map((r, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-brand-400 shrink-0">·</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {job.skills_required.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-3 text-sm">Kỹ năng cần có</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills_required.map((s) => (
                  <span key={s} className="text-xs bg-brand-50 text-brand-700 px-3 py-1.5 rounded-lg font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}

          {job.benefits.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-3 text-sm">Phúc lợi</h2>
              <ul className="space-y-1.5">
                {job.benefits.map((b, i) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                    <span className="text-green-500">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
