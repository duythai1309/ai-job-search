"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2, ArrowRight } from "lucide-react";

import { api } from "@/lib/api";

export default function CvUploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [storedCvId, setStoredCvId] = useState<string | null>(null);

  useEffect(() => {
    setStoredCvId(window.localStorage.getItem("vica:lastCvId"));
  }, []);

  async function uploadSelectedFile() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);
    try {
      const result = await api.uploadCv(file);
      const cvId = (result as { id?: string; data?: { id?: string } }).id ?? (result as { data?: { id?: string } }).data?.id;
      if (cvId && typeof window !== "undefined") {
        window.localStorage.setItem("vica:lastCvId", cvId);
        setMessage(`Đã upload CV ${cvId}`);
        router.push(`/cv-analysis?cv_id=${cvId}`);
        return;
      }
      setMessage("Đã upload CV, nhưng backend chưa trả về id.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d95332]">Step 01 / Intake</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[#173c31]">Upload CV</h1>
      <p className="mt-2 text-sm text-[#365347]/65">Bước đầu để backend trích xuất CV và tạo phân tích.</p>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.5rem] border border-[#1c2923]/10 bg-white/80 p-6">
          <input ref={inputRef} className="sr-only" type="file" accept=".pdf,application/pdf" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="grid min-h-80 w-full place-items-center rounded-[1.35rem] border border-dashed border-[#24543f]/25 bg-[#faf8f2] text-center transition hover:border-[#24543f]"
          >
            <span>
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#173c31] text-white">
                <Upload className="h-7 w-7" />
              </span>
              <span className="mt-6 block text-2xl font-extrabold tracking-[-0.04em] text-[#173c31]">
                {fileName || "Chọn file PDF"}
              </span>
              <span className="mt-2 block text-sm leading-6 text-[#365347]/65">
                PDF text-based là định dạng ổn nhất cho MVP hiện tại.
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => void uploadSelectedFile()}
            disabled={loading || !fileName}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#173c31] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? "Đang upload..." : "Upload CV"}
            <ArrowRight className="h-4 w-4" />
          </button>

          {message && (
            <div className="mt-4 rounded-2xl border border-[#1c2923]/10 bg-white px-4 py-3 text-sm text-[#365347]">
              {message}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[1.5rem] bg-[#173c31] p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f6b49e]">What happens next</p>
            <ul className="mt-5 space-y-4 text-sm text-white/78">
              <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#dcebdd]" />Backend trích xuất CV.</li>
              <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#dcebdd]" />Chuyển sang phân tích CV.</li>
              <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#dcebdd]" />Lưu cv_id để dùng cho fit score.</li>
            </ul>
          </div>

          <div className="rounded-[1.5rem] border border-[#1c2923]/10 bg-white/80 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#24543f]">CV gần nhất</p>
            <p className="mt-3 text-sm text-[#365347]/65">{storedCvId ? `Đã lưu: ${storedCvId}` : "Chưa có CV nào được lưu trong trình duyệt."}</p>
            <Link href="/cv-analysis" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#d95332]">
              Mở phân tích CV
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
