import { createClient } from "./supabase";

/** A single editable line/bullet of the CV with optional AI weakness flag. */
export interface CVReviewItem {
  id: string;
  text: string;
  weak?: boolean;
  issue?: string;       // why it's weak
  suggestion?: string;  // improved rewrite the user can apply
}

export interface CVSection {
  id: string;
  title: string;
  content_preview: string;
  score: number;
  issues: string[];
  suggestions: string[];
  subtitle?: string;          // e.g. "Product Manager · Tiki · 2023–Present"
  items?: CVReviewItem[];     // editable lines for the interactive review editor
}

export interface CVAnalysisResult {
  name: string;
  headline?: string;          // role title under the name
  contacts?: string[];        // email / location / links
  overall_score: number;
  summary_message: string;
  top_priorities: string[];
  sections: CVSection[];
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * Mock mode — render the whole UI with sample data, no backend needed.
 * Enable via NEXT_PUBLIC_USE_MOCK=1, or visit any page with ?mock=1
 * (persists in localStorage; ?mock=0 disables), or run
 * localStorage.setItem("vica:mock","1") in the console.
 */
function mockEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_USE_MOCK === "1") return true;
  if (typeof window === "undefined") return false;
  try {
    const flag = new URLSearchParams(window.location.search).get("mock");
    if (flag === "1") window.localStorage.setItem("vica:mock", "1");
    if (flag === "0") window.localStorage.removeItem("vica:mock");
    return window.localStorage.getItem("vica:mock") === "1";
  } catch {
    return false;
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  if (mockEnabled()) {
    const { resolveMock } = await import("./mock-data");
    const body = typeof options.body === "string" ? JSON.parse(options.body) : undefined;
    await delay(220);
    return resolveMock(options.method || "GET", path, body) as T;
  }

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
    if (mockEnabled()) {
      const { mockStreamReply } = await import("./mock-data");
      return { reader: mockStreamReply(body.message, body.context_type), sessionId: body.session_id || `mock-${Date.now()}` };
    }
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
    if (mockEnabled()) {
      const { mockCvAnalysis } = await import("./mock-data");
      await delay(1200);
      return mockCvAnalysis;
    }
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
    if (mockEnabled()) {
      const blob = new Blob([`Mock CV PDF (${cvId})`], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cv-${cvId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
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
