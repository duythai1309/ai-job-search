"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, CVAnalysisResult } from "@/lib/api";
import { CV } from "@/lib/types";
import toast from "react-hot-toast";
import CvReviewEditor, { EditedCvSection } from "@/components/ui/cv-review-editor";

export default function CVListPage() {
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "analyzing" | "review">("idle");
  const [analysis, setAnalysis] = useState<CVAnalysisResult | null>(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const uploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<CV[]>("/cv/").then(setCvs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Build a CV by uploading a file — reuses the same upload → AI review → save
  // flow as onboarding (the polished CvReviewEditor), instead of a separate UI.
  async function handleUpload(file: File) {
    const allowed = [".pdf", ".doc", ".docx", ".txt"];
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!allowed.includes(ext)) {
      toast.error("Chỉ hỗ trợ file PDF, DOC, DOCX hoặc TXT");
      return;
    }
    setUploadFileName(file.name);
    setUploadState("analyzing");
    try {
      const result = await api.uploadCv(file);
      setAnalysis(result);
      setUploadState("review");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Có lỗi khi phân tích CV");
      setUploadState("idle");
    }
  }

  async function saveUploadedCv(edited: EditedCvSection[]) {
    const summary =
      edited.find((s) => /mục tiêu|summary|tóm tắt|objective|profile/i.test(s.title))?.lines.join(" ") || "";
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
      const cv = await api.post<CV>("/cv/", {
        title: analysis?.name ? `CV — ${analysis.name}` : "CV của tôi",
        target_role: analysis?.headline || undefined,
        profile_statement: summary,
        sections,
        is_master: false,
      });
      toast.success("Đã tạo CV từ file tải lên");
      window.location.href = `/cv/${cv.id}`;
    } catch {
      toast.error("Chưa lưu được CV");
    }
  }

  async function createBlankCV() {
    setCreating(true);
    try {
      const cv = await api.post<CV>("/cv/", {
        title: "CV mới",
        is_master: false,
        sections: [
          { id: "profile", type: "custom", title: "Mục tiêu nghề nghiệp", content: { text: "" }, sort_order: 0 },
          { id: "exp", type: "experience", title: "Kinh nghiệm làm việc", content: [], sort_order: 1 },
          { id: "edu", type: "education", title: "Học vấn", content: [], sort_order: 2 },
          { id: "skills", type: "skills", title: "Kỹ năng", content: [], sort_order: 3 },
        ],
      });
      toast.success("Đã tạo CV mới");
      window.location.href = `/cv/${cv.id}`;
    } catch {
      toast.error("Không tạo được CV");
    } finally {
      setCreating(false);
    }
  }

  async function deleteCv(id: string) {
    if (!confirm("Xóa CV này?")) return;
    await api.delete(`/cv/${id}`);
    setCvs((prev) => prev.filter((c) => c.id !== id));
    toast.success("Đã xóa CV");
  }

  if (uploadState === "review" && analysis) {
    return (
      <CvReviewEditor
        analysis={analysis}
        fileName={uploadFileName}
        finishLabel="Lưu CV"
        onFinish={saveUploadedCv}
        onReupload={() => {
          setAnalysis(null);
          setUploadFileName("");
          setUploadState("idle");
        }}
      />
    );
  }

  if (uploadState === "analyzing") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 animate-pulse" />
        <p className="font-semibold text-slate-900">AI đang phân tích CV của bạn…</p>
        <p className="text-sm text-slate-400">{uploadFileName} · thường mất 10–20 giây</p>
      </div>
    );
  }

  return (
    <div className="px-8 lg:px-12 py-10 max-w-screen-2xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">CV của tôi</h1>
          <p className="text-slate-400 mt-1.5 text-sm">Quản lý và tạo CV thông minh với AI</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => uploadInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
          >
            Tải CV lên
          </button>
          <button
            onClick={createBlankCV}
            disabled={creating}
            className="border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
          >
            {creating ? "Đang tạo…" : "Tạo CV trống"}
          </button>
        </div>
      </div>
      <input
        ref={uploadInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUpload(f);
          e.target.value = "";
        }}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl h-48 animate-pulse" />
          ))}
        </div>
      ) : cvs.length === 0 ? (
        <div className="text-center py-28 border border-dashed border-slate-200 rounded-2xl">
          <p className="font-semibold text-slate-700">Chưa có CV nào</p>
          <p className="text-sm text-slate-400 mt-1 mb-6">
            Tạo CV đầu tiên của bạn và để AI giúp cải thiện
          </p>
          <div className="flex items-center justify-center gap-2.5">
            <button
              onClick={() => uploadInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
            >
              Tải CV lên
            </button>
            <button
              onClick={createBlankCV}
              className="border border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
            >
              Tạo CV trống
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {cvs.map((cv) => (
            <div
              key={cv.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-slate-300 transition-colors flex flex-col"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <h3 className="font-semibold text-slate-900 line-clamp-2 leading-snug">{cv.title}</h3>
                {cv.is_master && (
                  <span className="shrink-0 text-[11px] border border-blue-200 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold">
                    CV chính
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-sm">
                {cv.target_role && (
                  <p className="line-clamp-1 text-slate-600">
                    <span className="text-slate-400">Vị trí</span>&nbsp;&nbsp;{cv.target_role}
                  </p>
                )}
                {cv.target_company && (
                  <p className="line-clamp-1 text-slate-600">
                    <span className="text-slate-400">Công ty</span>&nbsp;&nbsp;{cv.target_company}
                  </p>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-3 mb-5">
                Cập nhật {new Date(cv.updated_at).toLocaleDateString("vi-VN")}
              </p>

              <div className="flex items-center gap-4 mt-auto pt-4 border-t border-slate-100">
                <Link
                  href={`/cv/${cv.id}`}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Chỉnh sửa
                </Link>
                <button
                  onClick={() => api.downloadPdf(cv.id)}
                  className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Xuất PDF
                </button>
                <button
                  onClick={() => deleteCv(cv.id)}
                  className="text-sm font-medium text-slate-400 hover:text-red-600 transition-colors cursor-pointer ml-auto"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
