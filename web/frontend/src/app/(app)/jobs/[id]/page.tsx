"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { JobPosting, FitEvaluation, SOURCE_LABELS, formatSalary } from "@/lib/types";
import toast from "react-hot-toast";
import { ArrowLeft, MapPin, Sparkles, CheckCircle2, AlertCircle, Lightbulb, ExternalLink } from "lucide-react";

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-accent-500" : "bg-red-400";
  const textColor = score >= 75 ? "text-emerald-700" : score >= 50 ? "text-accent-700" : "text-red-600";
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-700 font-medium font-body">{label}</span>
        <span className={`font-bold ${textColor}`}>{score}/100</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
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
      await api.post("/applications", { job_posting_id: job.id, company_name: job.company, role_title: job.title, source_url: job.url, status: "applied", fit_score: evaluation?.overall_score, fit_evaluation: evaluation });
      toast.success("Đã thêm vào danh sách ứng tuyển");
      router.push("/applications");
    } catch {
      toast.error("Không thể lưu đơn ứng tuyển");
    } finally {
      setSaving(false);
    }
  }

  const verdictStyle = evaluation
    ? evaluation.overall_score >= 75
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : evaluation.overall_score >= 50
      ? "bg-accent-100 text-accent-700 border-accent-200"
      : "bg-red-100 text-red-700 border-red-200"
    : "";

  if (loadingJob) return <div className="p-8 animate-pulse"><div className="h-64 bg-slate-100 rounded-2xl" /></div>;
  if (!job) return <div className="p-8 text-center text-slate-400">Không tìm thấy việc làm</div>;

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors font-body">
        <ArrowLeft className="w-4 h-4" /> Quay lại tìm kiếm
      </Link>

      <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100 mb-5">
        <div className="flex items-start gap-4">
          {job.company_logo_url && (
            <img src={job.company_logo_url} alt={job.company} className="w-14 h-14 rounded-xl object-contain border border-slate-100 shrink-0" />
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{job.title}</h1>
            <p className="text-slate-600 mt-0.5 font-body">{job.company}</p>
            <div className="flex flex-wrap gap-3 mt-2.5 text-xs text-slate-500 font-body">
              {job.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>}
              <span>{formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_negotiable)}</span>
              {job.employment_type && <span>{job.employment_type}</span>}
              <span className="px-2 py-0.5 bg-slate-100 rounded-md">{SOURCE_LABELS[job.source] || job.source}</span>
              {job.is_remote && <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-md">Remote</span>}
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 mt-5">
          <button onClick={evaluate} disabled={loadingEval} className="inline-flex items-center gap-2 bg-primary-800 hover:bg-primary-900 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer">
            <Sparkles className="w-4 h-4" /> {loadingEval ? "Đang phân tích..." : "Đánh giá độ phù hợp"}
          </button>
          <button onClick={apply} disabled={saving} className="border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer">
            {saving ? "Đang lưu..." : "Lưu vào tracker"}
          </button>
          <a href={job.url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150">
            <ExternalLink className="w-4 h-4" /> Xem bản gốc
          </a>
        </div>
      </div>

      {evaluation && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100 mb-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-900 text-base">Kết quả đánh giá AI</h2>
            <div className={`px-4 py-1.5 rounded-xl border font-bold text-sm ${verdictStyle}`}>
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
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <h3 className="font-bold text-emerald-800 text-xs mb-2.5 uppercase tracking-wide flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Điểm mạnh</h3>
              <ul className="space-y-1.5">
                {evaluation.strengths.map((s, i) => <li key={i} className="text-emerald-700 text-sm font-body flex gap-1.5"><span className="shrink-0">·</span>{s}</li>)}
              </ul>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <h3 className="font-bold text-red-800 text-xs mb-2.5 uppercase tracking-wide flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Khoảng cách</h3>
              <ul className="space-y-1.5">
                {evaluation.gaps.map((g, i) => <li key={i} className="text-red-700 text-sm font-body flex gap-1.5"><span className="shrink-0">·</span>{g}</li>)}
              </ul>
            </div>
          </div>

          <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
            <h3 className="font-bold text-primary-800 text-xs mb-1.5 uppercase tracking-wide flex items-center gap-1.5"><Lightbulb className="w-4 h-4" /> Khuyến nghị</h3>
            <p className="text-primary-800 text-sm font-body">{evaluation.recommendation}</p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex gap-4">
            <Link href="/cv" className="text-sm text-primary-700 hover:text-primary-900 font-semibold font-body transition-colors">Tạo CV cho vị trí này →</Link>
            <Link href={`/chat?context=job&id=${job.id}`} className="text-sm text-primary-700 hover:text-primary-900 font-semibold font-body transition-colors">Hỏi AI về chiến lược ứng tuyển →</Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-4">
          {job.description && (
            <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
              <h2 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">Mô tả công việc</h2>
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-body">{job.description}</div>
            </div>
          )}
          {job.requirements.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
              <h2 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">Yêu cầu</h2>
              <ul className="space-y-2">
                {job.requirements.map((r, i) => (
                  <li key={i} className="text-sm text-slate-700 flex gap-2 font-body">
                    <span className="text-primary-500 shrink-0 font-bold">·</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="space-y-4">
          {job.skills_required.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-100">
              <h2 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wide">Kỹ năng cần có</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills_required.map((s) => (
                  <span key={s} className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg font-medium font-body">{s}</span>
                ))}
              </div>
            </div>
          )}
          {job.benefits.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-100">
              <h2 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wide">Phúc lợi</h2>
              <ul className="space-y-2">
                {job.benefits.map((b, i) => (
                  <li key={i} className="text-xs text-slate-600 flex gap-1.5 font-body">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{b}
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
