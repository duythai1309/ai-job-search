import { createClient } from "./supabase";

/** A single editable line/bullet of the CV with optional AI weakness flag. */
export interface CVReviewItem {
  id: string;
  text: string;
  weak?: boolean;
  header?: boolean;     // an entry title (company/project/school), not a bullet
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

// NDJSON events streamed by the progressive CV scan (see streamUploadCv).
export type CvStreamEvent =
  | ({ type: "meta" } & Omit<CVAnalysisResult, "sections">)
  | ({ type: "section" } & CVSection)
  | { type: "done" }
  | { type: "error"; message?: string };

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * Mock mode — render the whole UI with sample data, no backend needed.
 * Enable via NEXT_PUBLIC_USE_MOCK=1, or visit any page with ?mock=1
 * (persists in localStorage; ?mock=0 disables), or run
 * localStorage.setItem("vica:mock","1") in the console.
 */
function mockEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_USE_MOCK === "1") return true;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return true;
  }
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

// Read an NDJSON response stream, invoking onEvent once per complete line in
// arrival order. Used by the progressive CV scan and suggestion endpoints.
async function readNdjsonStream<T>(res: Response, onEvent: (event: T) => void): Promise<void> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const flush = (raw: string) => {
    const line = raw.trim();
    if (!line) return;
    let event: T;
    try {
      event = JSON.parse(line) as T;
    } catch {
      return; // ignore a partial/garbled line
    }
    onEvent(event); // errors here propagate to the caller
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      flush(buffer.slice(0, nl));
      buffer = buffer.slice(nl + 1);
    }
  }
  flush(buffer);
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

  // Streaming CV scan: emits NDJSON events (meta, then one per section, then
  // done) so the UI can render progressively instead of waiting for the whole
  // analysis. onEvent is called once per parsed event in arrival order.
  async streamUploadCv(file: File, onEvent: (event: CvStreamEvent) => void): Promise<void> {
    if (mockEnabled()) {
      const { mockCvAnalysis } = await import("./mock-data");
      const { sections, ...meta } = mockCvAnalysis;
      await delay(400);
      onEvent({ type: "meta", ...meta });
      for (const section of sections) {
        await delay(300);
        onEvent({ type: "section", ...section });
      }
      onEvent({ type: "done" });
      return;
    }
    const authHeader = await getAuthHeader();
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE_URL}/onboarding/parse-cv?stream=1`, {
      method: "POST",
      headers: authHeader,
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(error.detail || "Lỗi phân tích CV");
    }
    await readNdjsonStream<CvStreamEvent>(res, onEvent);
  },

  // Streaming CV suggestions: emits one suggestion per event as the model
  // produces them. onSuggestion is called per suggestion in arrival order.
  async streamAnalyzeCv(
    cvId: string,
    jobPostingId: string | undefined,
    onSuggestion: (suggestion: Record<string, unknown>) => void,
  ): Promise<void> {
    if (mockEnabled()) {
      const { mockCvSuggestions } = await import("./mock-data");
      for (const s of mockCvSuggestions) {
        await delay(250);
        onSuggestion(s as unknown as Record<string, unknown>);
      }
      return;
    }
    const authHeader = await getAuthHeader();
    const query = new URLSearchParams({ stream: "1" });
    if (jobPostingId) query.set("job_posting_id", jobPostingId);
    const res = await fetch(`${BASE_URL}/cv/${cvId}/analyze?${query.toString()}`, {
      method: "POST",
      headers: authHeader,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(error.detail || "Có lỗi khi phân tích");
    }
    await readNdjsonStream<{ type?: string; message?: string; [k: string]: unknown }>(res, (event) => {
      if (event.type === "suggestion") onSuggestion(event);
      else if (event.type === "error") throw new Error(event.message || "AI phân tích CV lỗi");
    });
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
