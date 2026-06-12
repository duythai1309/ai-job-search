import { createClient } from "./supabase";

export interface CVSection {
  id: string;
  title: string;
  content_preview: string;
  score: number;
  issues: string[];
  suggestions: string[];
}

export interface CVAnalysisResult {
  name: string;
  overall_score: number;
  summary_message: string;
  top_priorities: string[];
  sections: CVSection[];
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) return { Authorization: `Bearer ${token}` };

    // Fallback: refreshSession forces the client to rehydrate from cookies/storage
    const { data: refreshed } = await supabase.auth.refreshSession();
    const refreshedToken = refreshed?.session?.access_token;
    return refreshedToken ? { Authorization: `Bearer ${refreshedToken}` } : {};
  } catch (error) {
    console.warn("[v0] Auth header error:", error instanceof Error ? error.message : String(error));
    return {};
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...(options.headers as Record<string, string> || {}),
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "Có lỗi xảy ra");
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),

  async streamChat(body: {
    session_id?: string;
    message: string;
    context_type?: string;
    context_id?: string;
  }): Promise<{ reader: ReadableStreamDefaultReader<Uint8Array>; sessionId: string }> {
    const authHeader = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/chat/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Chat error");
    const sessionId = res.headers.get("X-Session-Id") || "";
    return { reader: res.body!.getReader(), sessionId };
  },

  async uploadCv(file: File): Promise<CVAnalysisResult> {
    const authHeader = await getAuthHeader();
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE_URL}/onboarding/parse-cv`, {
      method: "POST",
      headers: authHeader,
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(error.detail || "Lỗi phân tích CV");
    }
    return res.json();
  },

  async downloadPdf(cvId: string): Promise<void> {
    const authHeader = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/cv/${cvId}/pdf`, { headers: authHeader });
    if (!res.ok) throw new Error("PDF error");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cv-${cvId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
