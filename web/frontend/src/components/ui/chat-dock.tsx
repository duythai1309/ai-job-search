"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X, Sparkles } from "lucide-react";
import clsx from "clsx";
import { api } from "@/lib/api";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";

export const CHAT_PANEL_WIDTH = 420;

interface Msg {
  id: string;
  role: "user" | "ai";
  content: string;
}

interface PageContext {
  type: string;
  id?: string;
  label: string;
  prompts: string[];
}

function pageContext(pathname: string): PageContext {
  const jobDetail = pathname.match(/^\/jobs\/([^/]+)$/);
  if (jobDetail) {
    return {
      type: "job",
      id: jobDetail[1],
      label: "Việc làm này",
      prompts: ["Tôi có phù hợp với việc này không?", "Chiến lược ứng tuyển vị trí này"],
    };
  }
  const cvDetail = pathname.match(/^\/cv\/([^/]+)$/);
  if (cvDetail) {
    return {
      type: "cv",
      id: cvDetail[1],
      label: "CV này",
      prompts: ["CV này cần cải thiện gì?", "Viết lại mục tiêu nghề nghiệp giúp tôi"],
    };
  }
  if (pathname.startsWith("/jobs")) {
    return {
      type: "jobs",
      label: "Tìm việc",
      prompts: ["Gợi ý từ khóa phù hợp với tôi", "Vị trí nào đang tuyển nhiều nhất?"],
    };
  }
  if (pathname.startsWith("/applications")) {
    return {
      type: "applications",
      label: "Ứng tuyển",
      prompts: ["Tôi nên ưu tiên đơn nào trước?", "Cách follow-up sau khi ứng tuyển"],
    };
  }
  if (pathname.startsWith("/cv")) {
    return {
      type: "cv",
      label: "CV Builder",
      prompts: ["Làm thế nào để viết CV ấn tượng?", "CV của tôi cần cải thiện gì?"],
    };
  }
  if (pathname.startsWith("/analytics")) {
    return {
      type: "market",
      label: "Thị trường",
      prompts: ["Kỹ năng nào đang hot nhất?", "Mức lương trung bình vị trí của tôi?"],
    };
  }
  if (pathname.startsWith("/dashboard")) {
    return {
      type: "dashboard",
      label: "Tổng quan",
      prompts: ["Tôi nên làm gì tiếp theo?", "Đánh giá tiến độ tìm việc của tôi"],
    };
  }
  return {
    type: "general",
    label: "Trợ lý AI",
    prompts: ["Tư vấn chiến lược tìm việc cho tôi", "Chuẩn bị phỏng vấn như thế nào?"],
  };
}

export default function ChatDock({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const endRef = useRef<HTMLDivElement>(null);

  const ctx = pageContext(pathname);

  // New page context = fresh conversation grounded in that page
  useEffect(() => {
    setMessages([]);
    setSessionId(undefined);
  }, [ctx.type, ctx.id]);

  useEffect(() => {
    const handler = () => onOpenChange(true);
    window.addEventListener("vica:open-chat", handler);
    return () => window.removeEventListener("vica:open-chat", handler);
  }, [onOpenChange]);

  // Esc closes the panel
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || streaming) return;
      setStreaming(true);
      setMessages((m) => [
        ...m,
        { id: Date.now().toString(), role: "user", content: message },
        { id: "streaming", role: "ai", content: "" },
      ]);
      try {
        const { reader, sessionId: sid } = await api.streamChat({
          session_id: sessionId,
          message,
          context_type: ctx.type,
          context_id: ctx.id,
        });
        if (!sessionId && sid) setSessionId(sid);
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
    },
    [streaming, sessionId, ctx.type, ctx.id]
  );

  return (
    <>
      {/* Side panel — stays mounted, slides in/out */}
      <aside
        aria-hidden={!open}
        className={clsx(
          "fixed top-0 right-0 h-full z-50 bg-white border-l border-slate-200/70 flex flex-col",
          "w-[420px] max-w-[100vw] transition-transform duration-300 ease-out",
          open ? "translate-x-0 shadow-[-8px_0_32px_rgba(15,23,42,0.06)]" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 leading-tight">Vica AI</p>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                Đang xem: {ctx.label}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-2">
              <p className="text-sm font-semibold text-slate-900">
                Hỏi về {ctx.label.toLowerCase()}
              </p>
              <p className="text-xs text-slate-400 mt-1 mb-8 leading-relaxed max-w-[260px]">
                Tôi nắm được ngữ cảnh trang bạn đang xem và trả lời dựa trên đó.
              </p>
              <div className="w-full space-y-2">
                {ctx.prompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="w-full text-left text-[13px] text-slate-600 border border-slate-200 hover:border-slate-400 hover:text-slate-900 rounded-xl px-4 py-3 transition-colors cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={clsx("flex", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={clsx(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-slate-900 text-white rounded-br-sm"
                      : "bg-slate-100 text-slate-800 rounded-bl-sm"
                  )}
                >
                  {msg.content || (
                    <span className="flex gap-1 py-1">
                      {[0, 150, 300].map((d) => (
                        <span
                          key={d}
                          className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce inline-block"
                          style={{ animationDelay: `${d}ms` }}
                        />
                      ))}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-200/70 shrink-0">
          <PromptInputBox
            simple
            isLoading={streaming}
            placeholder={`Hỏi về ${ctx.label.toLowerCase()}...`}
            onSend={(m) => send(m)}
          />
        </div>
      </aside>

      {/* Floating button — fades out while the panel is open */}
      <button
        onClick={() => onOpenChange(true)}
        tabIndex={open ? -1 : 0}
        className={clsx(
          "fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-slate-900 hover:bg-slate-800 text-white",
          "flex items-center justify-center shadow-lg hover:shadow-xl cursor-pointer",
          "transition-all duration-300 ease-out",
          open ? "opacity-0 scale-75 pointer-events-none" : "opacity-100 scale-100"
        )}
        title="Hỏi Vica AI"
      >
        <MessageSquare className="w-5 h-5" />
      </button>
    </>
  );
}
