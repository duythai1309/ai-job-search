"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { api, CVAnalysisResult } from "@/lib/api";
import clsx from "clsx";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Sparkles, Upload } from "lucide-react";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import CvReviewEditor, { EditedCvSection } from "@/components/ui/cv-review-editor";

type Step = "welcome" | "uploading" | "analyzing" | "review";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [analysis, setAnalysis] = useState<CVAnalysisResult | null>(null);
  const [userName, setUserName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        const full =
          data.user?.user_metadata?.full_name || data.user?.email?.split("@")[0] || "";
        const parts = full.trim().split(" ").filter(Boolean);
        setUserName(parts[parts.length - 1] || full);
      })
      .catch(() => {});
  }, []);

  const handleFile = useCallback(async (file: File) => {
    const allowed = [".pdf", ".doc", ".docx", ".txt"];
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!allowed.includes(ext)) {
      toast.error("Chỉ hỗ trợ file PDF, DOC, DOCX hoặc TXT");
      return;
    }
    setFileName(file.name);
    setStep("uploading");
    await new Promise((r) => setTimeout(r, 500));
    setStep("analyzing");
    try {
      const result = await api.uploadCv(file);
      setAnalysis(result);
      setStep("review");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Có lỗi khi phân tích CV";
      toast.error(msg);
      setStep("welcome");
    }
  }, []);

  function handleWelcomeSend(_message: string, files?: File[]) {
    if (files && files.length > 0) {
      handleFile(files[0]);
      return;
    }
    toast("Hãy đính kèm CV của bạn để bắt đầu phân tích nhé!", { icon: "📎" });
  }

  async function completeOnboarding() {
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({ data: { onboarding_completed: true } });
    } catch {
      /* mock/offline mode — proceed regardless */
    }
    router.push("/jobs");
  }

  // Save the edited CV (from the review step) into the DB, then finish.
  async function saveCvAndFinish(edited: EditedCvSection[]) {
    try {
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
      await api.post("/cv/", {
        title: analysis?.name ? `CV — ${analysis.name}` : "CV của tôi",
        target_role: analysis?.headline || undefined,
        profile_statement: summary,
        sections,
        is_master: true,
      });
      toast.success("Đã lưu CV vào hồ sơ của bạn");
    } catch {
      toast.error("Chưa lưu được CV — bạn có thể tạo lại trong CV Builder");
    }
    await completeOnboarding();
  }

  // ── Review (interactive highlight + inline edit) ──────────────
  if (step === "review" && analysis) {
    return (
      <CvReviewEditor
        analysis={analysis}
        fileName={fileName}
        onFinish={saveCvAndFinish}
        onReupload={() => {
          setAnalysis(null);
          setFileName("");
          setStep("welcome");
        }}
      />
    );
  }

  // ── Uploading / Analyzing ─────────────────────────────────────
  if (step === "uploading" || step === "analyzing") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#FAFAFA]">
        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center animate-pulse">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-slate-900 text-base">
            {step === "uploading" ? "Đang tải file lên..." : "AI đang phân tích CV của bạn..."}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {step === "uploading" ? fileName : "Thường mất 10–20 giây"}
          </p>
        </div>
        <div className="w-52 h-1 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={clsx(
              "h-full bg-slate-900 rounded-full transition-all duration-700",
              step === "uploading" ? "w-1/3" : "w-2/3 animate-pulse"
            )}
          />
        </div>
        <p className="text-xs text-slate-400">
          {step === "analyzing" ? "Đang đọc và chấm điểm từng mục..." : ""}
        </p>
      </div>
    );
  }

  // ── Welcome ───────────────────────────────────────────────────
  return (
    <div
      className="relative min-h-screen flex flex-col bg-[#FAFAFA]"
      onDragEnter={(e) => { e.preventDefault(); dragDepth.current += 1; setDragOver(true); }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragDepth.current = 0;
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
      }}
    >
      {/* Drag overlay */}
      {dragOver && (
        <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="border-2 border-dashed border-slate-400 bg-white rounded-3xl px-14 py-10 text-center shadow-xl">
            <p className="text-slate-900 font-semibold text-lg">Thả CV vào đây</p>
            <p className="text-slate-400 text-sm mt-1">PDF · DOC · DOCX · TXT</p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="h-16 px-6 sm:px-10 flex items-center justify-between border-b border-slate-200/70 shrink-0">
        <span className="font-bold text-slate-900 text-xl tracking-tight">Vica</span>
        <div className="hidden sm:flex items-baseline gap-1.5 text-xs font-medium tracking-widest">
          <span className="text-slate-900 font-bold">01</span>
          <span className="text-slate-300">/ 02</span>
          <span className="ml-3 text-slate-500 uppercase">Upload CV</span>
        </div>
        <button
          onClick={completeOnboarding}
          className="text-slate-400 text-sm hover:text-slate-900 transition-colors cursor-pointer"
        >
          Bỏ qua
        </button>
      </header>

      {/* Body: split layout */}
      <div className="flex-1 w-full grid lg:grid-cols-2 gap-10 lg:gap-20 items-center px-6 sm:px-10 lg:px-16 xl:px-24 py-10">
        {/* Left: headline + value props */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.12]">
            Chào {userName || "bạn"}.
            <br />
            CV tốt hơn, bắt đầu từ đây.
          </h1>
          <p className="text-slate-500 text-base mt-5 max-w-md leading-relaxed">
            Gửi CV của bạn — <span className="font-semibold text-slate-700">Vica AI</span> sẽ
            đọc, khoanh vùng điểm yếu và gợi ý sửa ngay trên CV.
          </p>

          <div className="mt-12 max-w-md border-y border-slate-200 divide-y divide-slate-200">
            {[
              ["01", "Chấm điểm tổng thể", "Thang điểm 100 theo tiêu chí nhà tuyển dụng"],
              ["02", "Khoanh vùng điểm yếu", "Tô sáng từng dòng chưa tốt trên CV của bạn"],
              ["03", "Sửa trực tiếp với gợi ý AI", "Áp dụng gợi ý hoặc tự chỉnh ngay tại chỗ"],
            ].map(([n, title, desc]) => (
              <div key={n} className="flex items-baseline gap-5 py-4">
                <span className="text-xs font-mono text-slate-400 shrink-0">{n}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: upload panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="w-full"
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
            className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 flex flex-col lg:min-h-[480px] shadow-sm hover:border-slate-300 hover:shadow transition-all cursor-pointer"
          >
            <div className="flex-1 flex flex-col items-center justify-center text-center py-14">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
                <Upload className="w-6 h-6 text-slate-600" />
              </div>
              <p className="font-semibold text-slate-900">Kéo thả CV vào đây</p>
              <p className="text-sm text-slate-400 mt-1">hoặc click để chọn file từ máy</p>
              <p className="text-xs text-slate-300 mt-5 tracking-wide">
                PDF · DOC · DOCX · TXT — tối đa 10MB
              </p>
            </div>
            <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <PromptInputBox
                simple
                accept=".pdf,.doc,.docx,.txt"
                attachTooltip="Đính kèm CV"
                placeholder="Đính kèm CV để bắt đầu..."
                onFileAdded={handleFile}
                onSend={handleWelcomeSend}
              />
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center shrink-0">
        <button
          onClick={completeOnboarding}
          className="text-xs text-slate-400 hover:text-slate-700 underline underline-offset-4 decoration-slate-300 transition-colors cursor-pointer"
        >
          Bỏ qua bước này — bạn có thể upload CV sau
        </button>
      </footer>
    </div>
  );
}
