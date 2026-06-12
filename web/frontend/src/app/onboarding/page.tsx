"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { api, CVAnalysisResult, CVSection } from "@/lib/api";
import clsx from "clsx";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileText,
  Sparkles,
  Upload,
  XCircle,
} from "lucide-react";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";

type Step = "welcome" | "uploading" | "analyzing" | "review";

interface Message {
  id: string;
  role: "ai" | "user";
  content: string;
}

function scoreColor(score: number) {
  if (score >= 8) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 5) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
}

function ScoreIcon({ score }: { score: number }) {
  if (score >= 8) return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
  if (score >= 5) return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
  return <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
}

function AiAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
      <Sparkles className="w-4 h-4 text-white" />
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [analysis, setAnalysis] = useState<CVAnalysisResult | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [userName, setUserName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const prevActiveSectionRef = useRef<string | null>(null);
  const dragDepth = useRef(0);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        const full =
          data.user?.user_metadata?.full_name || data.user?.email?.split("@")[0] || "";
        const parts = full.trim().split(" ").filter(Boolean);
        setUserName(parts[parts.length - 1] || full);
      });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!analysis) return;

    const greeting: Message = {
      id: "ai-1",
      role: "ai",
      content: `Tôi đã xem qua CV của bạn rồi! ${analysis.summary_message}`,
    };

    const prioritiesText = analysis.top_priorities.map((p, i) => `${i + 1}. ${p}`).join("\n");
    const priorities: Message = {
      id: "ai-2",
      role: "ai",
      content: `3 điều cần cải thiện ngay:\n${prioritiesText}`,
    };

    const weakSections = analysis.sections.filter((s) => s.issues.length > 0).slice(0, 2);
    const guide: Message = {
      id: "ai-3",
      role: "ai",
      content:
        weakSections.length > 0
          ? `Click vào từng mục bên trái để xem chi tiết:\n${weakSections
              .map((s) => `• ${s.title} (${s.score}/10): ${s.issues[0]}`)
              .join("\n")}`
          : "CV của bạn trông khá tốt! Click vào từng mục bên trái để xem gợi ý cải thiện.",
    };

    setTimeout(() => setMessages([greeting]), 300);
    setTimeout(() => setMessages((m) => [...m, priorities]), 1100);
    setTimeout(() => setMessages((m) => [...m, guide]), 2000);
  }, [analysis]);

  useEffect(() => {
    if (!activeSection || activeSection === prevActiveSectionRef.current || !analysis) return;
    prevActiveSectionRef.current = activeSection;

    const section = analysis.sections.find((s) => s.id === activeSection);
    if (!section) return;

    const content =
      section.issues.length > 0
        ? `${section.title} — Điểm ${section.score}/10\n\nVấn đề:\n${section.issues
            .map((i) => `• ${i}`)
            .join("\n")}\n\nGợi ý:\n${section.suggestions.map((s) => `• ${s}`).join("\n")}`
        : `${section.title} — Điểm ${section.score}/10\n\nMục này trông ổn. ${section.content_preview}`;

    setMessages((m) => [
      ...m,
      { id: `section-${activeSection}-${Date.now()}`, role: "ai", content },
    ]);
  }, [activeSection, analysis]);

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

  async function sendMessage(overrideText?: string) {
    const text = (overrideText ?? chatInput).trim();
    if (!text || streaming) return;
    setChatInput("");
    setStreaming(true);

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((m) => [...m, userMsg, { id: "streaming", role: "ai", content: "" }]);

    try {
      const { reader } = await api.streamChat({
        message: text,
        context_type: "cv_onboarding",
        context_id: activeSection || undefined,
      });
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages((m) =>
          m.map((msg) => (msg.id === "streaming" ? { ...msg, content: full } : msg))
        );
      }
      setMessages((m) =>
        m.map((msg) => (msg.id === "streaming" ? { ...msg, id: Date.now().toString() } : msg))
      );
    } catch {
      setMessages((m) => m.filter((msg) => msg.id !== "streaming"));
    } finally {
      setStreaming(false);
    }
  }

  function handleWelcomeSend(message: string, files?: File[]) {
    if (files && files.length > 0) {
      handleFile(files[0]);
      return;
    }
    toast("Hãy đính kèm CV của bạn để bắt đầu phân tích nhé!", { icon: "📎" });
  }

  async function completeOnboarding() {
    const supabase = createClient();
    await supabase.auth.updateUser({ data: { onboarding_completed: true } });
    router.push("/jobs");
  }

  // ── Welcome ───────────────────────────────────────────────────
  if (step === "welcome") {
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
            <span className="text-slate-300">/ 03</span>
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
              đọc, chấm điểm và chỉ ra chính xác những gì cần cải thiện.
            </p>

            <div className="mt-12 max-w-md border-y border-slate-200 divide-y divide-slate-200">
              {[
                ["01", "Chấm điểm tổng thể", "Thang điểm 100 theo tiêu chí nhà tuyển dụng"],
                ["02", "Phân tích từng mục", "Kinh nghiệm, kỹ năng, học vấn, dự án..."],
                ["03", "Gợi ý cải thiện cụ thể", "Việc làm được ngay, không chung chung"],
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

  // ── Review ────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="h-14 border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 text-xl tracking-tight">Vica</span>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <span className="text-slate-500 text-sm">Phân tích CV</span>
        </div>
        <div className="flex items-center gap-3">
          {analysis && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-sm font-bold text-amber-700">{analysis.overall_score}/100</span>
            </div>
          )}
          <button
            onClick={completeOnboarding}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-150 cursor-pointer shadow-btn-brand hover:shadow-none"
          >
            Bắt đầu tìm việc <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: CV sections */}
        <div className="w-[54%] border-r border-slate-100 overflow-y-auto bg-slate-50/40 p-5">
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide mb-4">
            {fileName} · Click vào mục để xem chi tiết
          </p>

          {analysis && (
            <div className="space-y-2.5">
              {analysis.sections.map((section: CVSection) => {
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(isActive ? null : section.id)}
                    className={clsx(
                      "w-full text-left bg-white rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer",
                      isActive
                        ? "border-brand-300 shadow-md ring-1 ring-brand-100"
                        : "border-slate-100 hover:border-slate-200 shadow-sm hover:shadow"
                    )}
                  >
                    <div className="flex items-center justify-between p-3.5">
                      <div className="flex items-center gap-3">
                        <ScoreIcon score={section.score} />
                        <div className="text-left">
                          <div className="font-medium text-slate-900 text-sm">{section.title}</div>
                          {section.content_preview && (
                            <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                              {section.content_preview}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {section.issues.length > 0 && (
                          <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full border", scoreColor(section.score))}>
                            {section.issues.length} vấn đề
                          </span>
                        )}
                        <span className={clsx("text-xs font-bold px-2 py-1 rounded-lg border", scoreColor(section.score))}>
                          {section.score}/10
                        </span>
                      </div>
                    </div>

                    {isActive && (
                      <div className="border-t border-slate-100 px-4 pb-4 pt-3 bg-slate-50/60">
                        {section.issues.length > 0 && (
                          <div className="mb-3">
                            <p className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                              Vấn đề phát hiện
                            </p>
                            <ul className="space-y-1.5">
                              {section.issues.map((issue, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                                  <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                                  {issue}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {section.suggestions.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                              Gợi ý cải thiện
                            </p>
                            <ul className="space-y-1.5">
                              {section.suggestions.map((sug, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                                  {sug}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Chat */}
        {/* Right: Chat — dark panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#17181A]">
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={clsx("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "ai" && <AiAvatar />}
                <div
                  className={clsx(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "ai"
                      ? "bg-[#1F2023] border border-[#333333] text-gray-200 rounded-tl-sm whitespace-pre-wrap"
                      : "bg-brand-600 text-white rounded-tr-sm"
                  )}
                >
                  {msg.content || (
                    <div className="flex gap-1 py-0.5">
                      {[0, 150, 300].map((d) => (
                        <div
                          key={d}
                          className="w-1.5 h-1.5 bg-[#444] rounded-full animate-bounce"
                          style={{ animationDelay: `${d}ms` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion chips */}
          <div className="flex gap-2 px-4 pb-3 flex-wrap">
            {[
              "CV tôi thiếu gì so với thị trường?",
              "Cách cải thiện mục kinh nghiệm?",
              "Tôi nên apply vị trí nào?",
            ].map((q) => (
              <button
                key={q}
                onClick={() => { setChatInput(q); }}
                className="text-xs text-[#9CA3AF] bg-[#1F2023] hover:bg-[#2a2b2e] border border-[#333333] px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* PromptInputBox */}
          <div className="px-4 pb-4 shrink-0">
            <PromptInputBox
              isLoading={streaming}
              placeholder="Hỏi thêm về CV của bạn..."
              onSend={(message) => sendMessage(message)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
