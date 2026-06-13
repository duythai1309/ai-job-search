"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

import { api } from "@/lib/api";

type CvRecord = {
  id: string;
  filename?: string;
  summary?: string;
  extracted_text?: string;
};

type AnalysisResult = {
  cv_id?: string;
  overall_score?: number;
  summary_message?: string;
  top_priorities?: string[];
  sections?: Array<{ title?: string; status?: string; detail?: string }>;
};

function getStoredCvId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("vica:lastCvId");
}

export default function CvAnalysisPage() {
  const [storedCvId, setStoredCvId] = useState<string | null>(null);
  const [queryCvId, setQueryCvId] = useState<string | null>(null);
  const [cv, setCv] = useState<CvRecord | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStoredCvId(getStoredCvId());
    setQueryCvId(new URLSearchParams(window.location.search).get("cv_id"));
  }, []);

  const cvId = queryCvId ?? storedCvId;
  const ready = useMemo(() => Boolean(cvId), [cvId]);

  useEffect(() => {
    if (!cvId) return;
    let alive = true;
    setLoading(true);
    api
      .getCv<CvRecord>(cvId)
      .then((result) => {
        if (alive) setCv(result);
      })
      .catch(() => {
        if (alive) setCv(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [cvId]);

  async function runAnalysis() {
    if (!cvId) return;
    setRunning(true);
    setError(null);
    try {
      const result = await api.analyzeCv<AnalysisResult>(cvId);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể phân tích CV.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d95332]">Step 02 / Analysis</p>
      <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-[#173c31]">Phân tích CV</h1>
          <p className="mt-2 text-sm text-[#365347]/65">Backend sẽ trả về summary, priorities và các section đã trích xuất.</p>
        </div>
        <Link href="/cv-upload" className="inline-flex items-center gap-2 rounded-xl border border-[#1c2923]/12 bg-white px-4 py-2.5 text-sm font-semibold text-[#24543f]">
          Upload CV khác
        </Link>
      </div>

      {!ready && (
        <div className="mt-8 rounded-[1.5rem] border border-dashed border-[#1c2923]/15 bg-white/70 p-10 text-center">
          <p className="text-base font-semibold text-[#173c31]">Chưa có CV để phân tích.</p>
          <p className="mt-2 text-sm text-[#365347]/62">Tải CV lên trước, hoặc truyền `cv_id` trên URL.</p>
          <Link href="/cv-upload" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#173c31] px-5 py-3 text-sm font-bold text-white">
            Upload ngay
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {ready && (
        <>
          <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[1.5rem] border border-[#1c2923]/10 bg-white/80 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#24543f]">CV snapshot</p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-[#173c31]">{cv?.filename || cvId}</h2>
              <p className="mt-3 text-sm leading-6 text-[#365347]">{cv?.summary || "Chưa có summary từ backend."}</p>

              <button
                type="button"
                onClick={() => void runAnalysis()}
                disabled={running}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#173c31] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {running ? "Đang phân tích..." : "Chạy phân tích"}
              </button>

              {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
            </div>

            <div className="rounded-[1.5rem] border border-[#1c2923]/10 bg-white/80 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d95332]">Kết quả</p>
              <div className="mt-4 text-5xl font-extrabold tracking-[-0.06em] text-[#173c31]">
                {analysis?.overall_score ?? "—"}
              </div>
              <p className="mt-2 text-sm text-[#365347]/65">{analysis?.summary_message || "Chưa chạy phân tích."}</p>

              {analysis?.top_priorities?.length ? (
                <div className="mt-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#24543f]">Ưu tiên hàng đầu</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {analysis.top_priorities.map((item) => (
                      <span key={item} className="rounded-lg bg-[#dcebdd] px-2.5 py-1.5 text-xs font-semibold text-[#24543f]">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {analysis?.sections?.length ? (
            <section className="mt-6 grid gap-4 md:grid-cols-2">
              {analysis.sections.map((section, index) => (
                <div key={index} className="rounded-[1.25rem] border border-[#1c2923]/10 bg-white/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-[#173c31]">{section.title || "Section"}</p>
                    <span className="rounded-full bg-[#f2f0e9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#365347]/60">
                      {section.status || "info"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#365347]">{section.detail || "Không có chi tiết."}</p>
                </div>
              ))}
            </section>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-[#1c2923]/15 bg-white/70 p-8 text-center text-sm text-[#365347]/60">
              Nhấn “Chạy phân tích” để nhận kết quả.
            </div>
          )}

          <div className="mt-6 flex items-center gap-2 text-xs text-[#365347]/55">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>CV id: {cvId}</span>
          </div>
        </>
      )}
    </div>
  );
}
