import { createClient } from "./supabase";
import {
  CVAnalysisPayload,
  FitScoreResult,
  RecommendationResult,
  extractErrorMessage,
  normalizeJob,
  normalizeJobList,
  validateCvAnalysis,
  validateFitScore,
  validateRecommendations,
} from "./contracts";
import { JobPosting } from "./types";
import { buildStorageKey, ScopedStorageResource } from "./storage";

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

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const hasJson = contentType.includes("application/json");
  const payload = hasJson
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

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

async function getStorageUserKey(): Promise<string> {
  try {
    const { data } = await createClient().auth.getSession();
    return data.session?.user.id || "demo-user";
  } catch {
    return "demo-user";
  }
}

async function scopedKey(resource: ScopedStorageResource): Promise<string> {
  return buildStorageKey(await getStorageUserKey(), resource);
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

async function rememberCvId(cvId: string): Promise<void> {
  const idsKey = await scopedKey("cvIds");
  const lastCvIdKey = await scopedKey("lastCvId");
  const ids = readLocalJson<string[]>(idsKey, []);
  writeLocalJson(idsKey, [cvId, ...ids.filter((id) => id !== cvId)]);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(lastCvIdKey, cvId);
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
    if (cvId) await rememberCvId(cvId);
    return record;
  },

  uploadCv: async (file: File): Promise<CVAnalysisResult> => {
    const record = await api.uploadCvRecord<{ id: string; filename?: string; summary?: string }>(file);
    const analysis = await api.analyzeCv(record.id);
    return {
      name: analysis.name || record.filename || file.name,
      overall_score: analysis.overall_score ?? 0,
      summary_message: analysis.summary_message || record.summary || "CV đã được tải lên và phân tích.",
      top_priorities: analysis.top_priorities || [],
      sections: analysis.sections.map((section, index) => ({
        id: section.id || `section-${index}`,
        title: section.title || `Mục ${index + 1}`,
        content_preview: section.content_preview || "",
        score: section.score ?? 0,
        issues: section.issues,
        suggestions: section.suggestions,
      })),
    };
  },

  getCv: async <T = unknown>(cvId: string) => requestJson<T>(`/cvs/${cvId}`),

  deleteCv: async (cvId: string) => {
    await requestJson<void>(`/cvs/${cvId}`, { method: "DELETE" });
    const idsKey = await scopedKey("cvIds");
    const ids = readLocalJson<string[]>(idsKey, []).filter((id) => id !== cvId);
    writeLocalJson(idsKey, ids);
  },

  listCvs: async <T = unknown>() => {
    const ids = readLocalJson<string[]>(await scopedKey("cvIds"), []);
    const records = await Promise.all(
      ids.map((id) => requestJson<T>(`/cvs/${id}`).catch(() => null))
    );
    return records.filter((record) => record !== null) as T[];
  },

  analyzeCv: async (cvId: string): Promise<CVAnalysisPayload> =>
    validateCvAnalysis(await requestJson<unknown>("/cv-analyses", {
      method: "POST",
      body: JSON.stringify({ cv_id: cvId }),
    })),

  listJobs: async (query?: {
    query?: string;
    location?: string;
    level?: string;
    page?: number;
    page_size?: number;
  }): Promise<JobPosting[]> =>
    normalizeJobList(await requestJson<unknown>("/jobs", {
      query: {
        query: query?.query,
        location: query?.location,
        level: query?.level,
        page: query?.page,
        page_size: query?.page_size,
      },
    })),

  getJob: async (jobId: string): Promise<JobPosting> =>
    normalizeJob(await requestJson<unknown>(`/jobs/${jobId}`)),

  fitScore: async (cvId: string, jobId: string): Promise<FitScoreResult> =>
    validateFitScore(await requestJson<unknown>("/fit-scores", {
      method: "POST",
      body: JSON.stringify({ cv_id: cvId, job_id: jobId }),
    })),

  recommendations: async (cvId: string, jobId: string): Promise<RecommendationResult> =>
    validateRecommendations(await requestJson<unknown>("/recommendations", {
      method: "POST",
      body: JSON.stringify({ cv_id: cvId, job_id: jobId }),
    })),

  getLastCvId: async () => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(await scopedKey("lastCvId"));
  },

  tracker: {
    list: async <T = unknown>() =>
      readLocalJson<T[]>(await scopedKey("applications"), []),
    add: async <T extends object>(application: T & { id?: string }) => {
      const key = await scopedKey("applications");
      const stored = readLocalJson<T[]>(key, []);
      const next = {
        ...application,
        id: application.id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      writeLocalJson(key, [next, ...stored]);
      return next;
    },
    update: async <T extends { id: string }>(id: string, patch: Partial<T>) => {
      const key = await scopedKey("applications");
      const stored = readLocalJson<T[]>(key, []);
      const next = stored.map((item) =>
        item.id === id ? { ...item, ...patch, updated_at: new Date().toISOString() } : item
      );
      writeLocalJson(key, next);
    },
    delete: async <T extends { id: string }>(id: string) => {
      const key = await scopedKey("applications");
      const stored = readLocalJson<T[]>(key, []);
      writeLocalJson(key, stored.filter((item) => item.id !== id));
    },
  },

  savedJobs: {
    list: async () => readLocalJson<string[]>(await scopedKey("savedJobs"), []),
    add: async (jobId: string) => {
      const key = await scopedKey("savedJobs");
      const saved = readLocalJson<string[]>(key, []);
      writeLocalJson(key, [jobId, ...saved.filter((id) => id !== jobId)]);
    },
  },

  profile: {
    get: async <T = unknown>() =>
      readLocalJson<Partial<T>>(await scopedKey("profile"), {}),
    save: async <T = unknown>(profile: Partial<T>) => {
      writeLocalJson(await scopedKey("profile"), profile);
      return profile;
    },
  },

  downloadPdf: async (_cvId: string): Promise<void> => {
    throw new Error("Backend MVP hiện chưa hỗ trợ xuất PDF.");
  },

};
