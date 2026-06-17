"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, CVAnalysisResult } from "@/lib/api";
import { JobPosting } from "@/lib/types";
import toast from "react-hot-toast";
import { Sparkles } from "lucide-react";
import CvReviewEditor, { EditedCvSection } from "@/components/ui/cv-review-editor";

export default function TailorCvPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [analysis, setAnalysis] = useState<CVAnalysisResult | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [jobData, tailored] = await Promise.all([
          api.get<JobPosting>(`/jobs/${id}`),
          api.post<CVAnalysisResult>("/cv/tailor", { job_posting_id: id }),
        ]);
        setJob(jobData);
        setAnalysis(tailored);
      } catch {
        setError(true);
        toast.error("Không thể phân tích CV cho vị trí này");
      }
    }
    load();
  }, [id]);

  async function saveTailoredCv(edited: EditedCvSection[]) {
    if (!job) return;
    const profileStatement =
      edited.find((s) => /mục tiêu|summary|tóm tắt/i.test(s.title))?.lines[0] || "";
    const sections = edited
      .filter((s) => s.lines.length > 0)
      .map((s, i) => ({
        id: s.id,
        type: "custom",
        title: s.title,
        content: { text: s.lines.join("\n") },
        sort_order: i,
      }));
    try {
      const cv = await api.post<{ id: string }>("/cv/", {
        title: `CV — ${job.title} @ ${job.company}`,
        target_role: job.title,
        target_company: job.company,
        profile_statement: profileStatement,
        sections,
        is_master: false,
      });
      toast.success("Đã lưu CV tinh chỉnh cho vị trí này");
      router.push(`/cv/${cv.id}`);
    } catch {
      toast.error("Không lưu được CV");
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-6">
        <p className="font-semibold text-slate-900">Không thể tải dữ liệu</p>
        <button
          onClick={() => router.push(`/jobs/${id}`)}
          className="text-sm text-slate-500 hover:text-slate-900 underline underline-offset-4"
        >
          Quay lại việc làm
        </button>
      </div>
    );
  }

  if (!analysis || !job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#FAFAFA]">
        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center animate-pulse">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-slate-900 text-base">
            AI đang đối chiếu CV của bạn với vị trí...
          </p>
          <p className="text-slate-400 text-sm mt-1">Tìm những chỗ cần tinh chỉnh để khớp job</p>
        </div>
        <div className="w-52 h-1 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full w-2/3 bg-slate-900 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <CvReviewEditor
      analysis={analysis}
      fileName="CV của bạn"
      jobContext={{ title: job.title, company: job.company }}
      finishLabel="Lưu CV cho vị trí này"
      onFinish={saveTailoredCv}
    />
  );
}
