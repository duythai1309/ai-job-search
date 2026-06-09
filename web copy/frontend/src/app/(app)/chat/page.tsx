"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { ChatSession, ChatMessage } from "@/lib/types";
import toast from "react-hot-toast";
import clsx from "clsx";

function MessageBubble({ msg }: { msg: ChatMessage | { role: string; content: string; id: string } }) {
  const isUser = msg.role === "user";
  return (
    <div className={clsx("flex mb-4", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white text-sm shrink-0 mr-3">
          AI
        </div>
      )}
      <div
        className={clsx(
          "max-w-[70%] rounded-2xl px-4 py-3 text-sm",
          isUser
            ? "bg-brand-500 text-white rounded-br-sm"
            : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm prose-chat"
        )}
      >
        <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm shrink-0 ml-3">
          👤
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const contextType = searchParams.get("context") || "general";
  const contextId = searchParams.get("id") || undefined;

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<(ChatMessage | { role: string; content: string; id: string })[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<ChatSession[]>("/chat/sessions").then(setSessions).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadSession(sessionId: string) {
    setCurrentSessionId(sessionId);
    try {
      const msgs = await api.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`);
      setMessages(msgs);
    } catch {
      toast.error("Không tải được lịch sử chat");
    }
  }

  async function newSession() {
    setCurrentSessionId(null);
    setMessages([]);
  }

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    const aiMsg = { id: "streaming", role: "assistant", content: "" };
    setMessages((prev) => [...prev, aiMsg]);

    try {
      const { reader, sessionId } = await api.streamChat({
        session_id: currentSessionId || undefined,
        message: text,
        context_type: contextType,
        context_id: contextId,
      });

      if (!currentSessionId) {
        setCurrentSessionId(sessionId);
        const updatedSessions = await api.get<ChatSession[]>("/chat/sessions");
        setSessions(updatedSessions);
      }

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setMessages((prev) =>
          prev.map((m) => m.id === "streaming" ? { ...m, content: fullText } : m)
        );
      }

      setMessages((prev) =>
        prev.map((m) => m.id === "streaming" ? { ...m, id: Date.now().toString() } : m)
      );
    } catch {
      toast.error("Có lỗi khi gửi tin nhắn");
      setMessages((prev) => prev.filter((m) => m.id !== "streaming"));
    } finally {
      setStreaming(false);
    }
  }

  const QUICK_PROMPTS = [
    "Tư vấn chiến lược tìm việc cho tôi",
    "Làm thế nào để viết CV ấn tượng?",
    "Chuẩn bị phỏng vấn kỹ thuật như thế nào?",
    "Kỹ năng nào đang hot nhất thị trường VN?",
  ];

  return (
    <div className="flex h-full">
      <div className="w-56 border-r border-gray-100 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={newSession}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white py-2 rounded-lg text-sm font-medium transition"
          >
            + Cuộc trò chuyện mới
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => loadSession(s.id)}
              className={clsx(
                "w-full text-left px-3 py-2.5 rounded-lg text-sm transition",
                currentSessionId === s.id
                  ? "bg-brand-50 text-brand-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <div className="line-clamp-2">{s.title}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {new Date(s.created_at).toLocaleDateString("vi-VN")}
              </div>
            </button>
          ))}
          {sessions.length === 0 && (
            <p className="text-xs text-gray-400 text-center mt-4">Chưa có cuộc trò chuyện nào</p>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl mb-4">
                AI
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Trợ lý tìm việc AI</h2>
              <p className="text-gray-500 text-sm mb-8 max-w-sm">
                Hỏi bất kỳ điều gì về tìm việc, CV, phỏng vấn và chiến lược nghề nghiệp
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-lg">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => { setInput(prompt); }}
                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 hover:border-brand-300 hover:text-brand-600 text-left transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {streaming && messages[messages.length - 1]?.content === "" && (
                <div className="flex mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white text-sm mr-3">AI</div>
                  <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                    <div className="flex gap-1">
                      {[0, 150, 300].map((delay) => (
                        <div
                          key={delay}
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 p-4 bg-white">
          <div className="max-w-3xl mx-auto flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Hỏi về tìm việc, CV, phỏng vấn..."
              disabled={streaming}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
            />
            <button
              onClick={send}
              disabled={streaming || !input.trim()}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-medium text-sm transition"
            >
              {streaming ? "⏳" : "Gửi →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
