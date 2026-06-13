import { createClient } from "./supabase";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

type ApiErrorShape = {
  code?: string;
  message?: string;
  request_id?: string;
  details?: unknown;
  detail?: string;
};

type ApiEnvelope<T> = {
  data?: T;
  meta?: unknown;
  error?: ApiErrorShape;
};

const CV_IDS_KEY = "vica:cvIds";
const APPLICATIONS_KEY = "vica:applications";
const PROFILE_KEY = "vica:profile";

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

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

function buildUrl(path: string, query?: Record<string, string | number | undefined>) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${BASE_URL}${normalizedPath}`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const error = payload as ApiErrorShape;
  return error.message || error.detail || fallback;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const hasJson = contentType.includes("application/json");
  const payload = hasJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const fallback = `${response.status} ${response.statusText}`.trim();
    throw new Error(extractErrorMessage(payload, fallback));
  }

  if (payload && typeof payload === "object" && "error" in payload && (payload as ApiEnvelope<T>).error) {
    throw new Error(extractErrorMessage((payload as ApiEnvelope<T>).error, "Request failed"));
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }

  return payload as T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(buildUrl(path).toString(), {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string> | undefined),
    },
  });
  return parseResponse<T>(response);
}

async function requestJson<T>(
  path: string,
  options: RequestInit & { query?: Record<string, string | number | undefined> } = {}
): Promise<T> {
  const { query, body, headers, ...rest } = options;
  const authHeaders = await getAuthHeaders();
  const jsonHeaders: Record<string, string> =
    body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {};
  const response = await fetch(buildUrl(path, query).toString(), {
    ...rest,
    body,
    headers: {
      ...authHeaders,
      ...jsonHeaders,
      ...(headers as Record<string, string> | undefined),
    },
  });
  return parseResponse<T>(response);
}

function readLocalJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalJson<T>(key: string, value: T): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

function rememberCvId(cvId: string): void {
  const ids = readLocalJson<string[]>(CV_IDS_KEY, []);
  writeLocalJson(CV_IDS_KEY, [cvId, ...ids.filter((id) => id !== cvId)]);
  if (typeof window !== "undefined") {
    window.localStorage.setItem("vica:lastCvId", cvId);
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    requestJson<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    requestJson<T>(path, {
      method: "PATCH",
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    requestJson<T>(path, {
      method: "PUT",
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => requestJson<T>(path, { method: "DELETE" }),

  health: async () => requestJson<{ status: string }>("/health"),

  uploadCvRecord: async <T = unknown>(file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const record = await requestJson<T>("/cvs", {
      method: "POST",
      body: formData,
    });
    const cvId = (record as { id?: string })?.id;
    if (cvId) rememberCvId(cvId);
    return record;
  },

  uploadCv: async (file: File): Promise<CVAnalysisResult> => {
    const record = await api.uploadCvRecord<{ id: string; filename?: string; summary?: string }>(file);
    const analysis = await api.analyzeCv<Partial<CVAnalysisResult>>(record.id);
    return {
      name: analysis.name || record.filename || file.name,
      overall_score: analysis.overall_score ?? 0,
      summary_message: analysis.summary_message || record.summary || "CV đã được tải lên và phân tích.",
      top_priorities: analysis.top_priorities || [],
      sections: analysis.sections || [],
    };
  },

  getCv: async <T = unknown>(cvId: string) => requestJson<T>(`/cvs/${cvId}`),

  deleteCv: async (cvId: string) => {
    await requestJson<void>(`/cvs/${cvId}`, { method: "DELETE" });
    const ids = readLocalJson<string[]>(CV_IDS_KEY, []).filter((id) => id !== cvId);
    writeLocalJson(CV_IDS_KEY, ids);
  },

  listCvs: async <T = unknown>() => {
    const ids = readLocalJson<string[]>(CV_IDS_KEY, []);
    const records = await Promise.all(
      ids.map((id) => requestJson<T>(`/cvs/${id}`).catch(() => null))
    );
    return records.filter((record) => record !== null) as T[];
  },

  analyzeCv: async <T = unknown>(cvId: string) =>
    requestJson<T>("/cv-analyses", {
      method: "POST",
      body: JSON.stringify({ cv_id: cvId }),
    }),

  listJobs: async <T = unknown>(query?: {
    query?: string;
    location?: string;
    level?: string;
    page?: number;
    page_size?: number;
  }) =>
    requestJson<T>("/jobs", {
      query: {
        query: query?.query,
        location: query?.location,
        level: query?.level,
        page: query?.page,
        page_size: query?.page_size,
      },
    }),

  getJob: async <T = unknown>(jobId: string) => requestJson<T>(`/jobs/${jobId}`),

  fitScore: async <T = unknown>(cvId: string, jobId: string) =>
    requestJson<T>("/fit-scores", {
      method: "POST",
      body: JSON.stringify({ cv_id: cvId, job_id: jobId }),
    }),

  recommendations: async <T = unknown>(cvId: string, jobId: string) =>
    requestJson<T>("/recommendations", {
      method: "POST",
      body: JSON.stringify({ cv_id: cvId, job_id: jobId }),
    }),

  tracker: {
    list: async <T = unknown>() => readLocalJson<T[]>(APPLICATIONS_KEY, []),
    add: async <T extends object>(application: T & { id?: string }) => {
      const stored = readLocalJson<T[]>(APPLICATIONS_KEY, []);
      const next = {
        ...application,
        id: application.id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      writeLocalJson(APPLICATIONS_KEY, [next, ...stored]);
      return next;
    },
    update: async <T extends { id: string }>(id: string, patch: Partial<T>) => {
      const stored = readLocalJson<T[]>(APPLICATIONS_KEY, []);
      const next = stored.map((item) =>
        item.id === id ? { ...item, ...patch, updated_at: new Date().toISOString() } : item
      );
      writeLocalJson(APPLICATIONS_KEY, next);
    },
    delete: async <T extends { id: string }>(id: string) => {
      const stored = readLocalJson<T[]>(APPLICATIONS_KEY, []);
      writeLocalJson(APPLICATIONS_KEY, stored.filter((item) => item.id !== id));
    },
  },

  profile: {
    get: async <T = unknown>() => readLocalJson<Partial<T>>(PROFILE_KEY, {}),
    save: async <T = unknown>(profile: Partial<T>) => {
      writeLocalJson(PROFILE_KEY, profile);
      return profile;
    },
  },

  downloadPdf: async (_cvId: string): Promise<void> => {
    throw new Error("Backend MVP hiện chưa hỗ trợ xuất PDF.");
  },

  streamChat: async (
    _body?: {
      session_id?: string;
      message: string;
      context_type?: string;
      context_id?: string;
    }
  ): Promise<{ reader: ReadableStreamDefaultReader<Uint8Array>; sessionId: string }> => {
    throw new Error("Chat streaming is not connected in this frontend build.");
  },
};
