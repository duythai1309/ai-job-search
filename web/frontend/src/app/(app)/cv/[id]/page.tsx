"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FileText, ArrowRight } from "lucide-react";

import { api } from "@/lib/api";

type CvRecord = {
  id: string;
  filename?: string;
  summary?: string;
  sections?: Array<{ title?: string; content?: string }>;
  created_at?: string;
};

export default function CvDetailPage() {
  const params = useParams<{ id: string }>();
  const [cv, setCv] = useState<CvRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .getCv<CvRecord>(params.id)
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
  }, [params.id]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-10"><div className="h-40 animate-pulse rounded-[1.5rem] bg-white/70" /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d95332]">CV detail</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[#173c31]">CV #{params.id}</h1>
      <p className="mt-2 text-sm text-[#365347]/65">
        Trang này đọc dữ liệu từ backend mới. Nếu cần phân tích sâu hơn, đi tiếp sang route CV analysis.
      </p>

      <div className="mt-8 rounded-[1.5rem] border border-[#1c2923]/10 bg-white/80 p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef4eb] text-[#24543f]">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-[#173c31]">{cv?.filename || "CV đã lưu"}</p>
            <p className="text-sm text-[#365347]/62">
              {cv?.created_at ? new Date(cv.created_at).toLocaleString("vi-VN") : "Chưa có thời gian tạo"}
            </p>
          </div>
        </div>

        <p className="mt-5 text-sm leading-6 text-[#365347]">{cv?.summary || "Backend chưa trả về summary chi tiết."}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={`/cv-analysis?cv_id=${params.id}`} className="inline-flex items-center gap-2 rounded-xl bg-[#173c31] px-4 py-2.5 text-sm font-bold text-white">
            Phân tích CV
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/cv-upload" className="inline-flex items-center gap-2 rounded-xl border border-[#1c2923]/12 bg-white px-4 py-2.5 text-sm font-semibold text-[#24543f]">
            Tải CV khác lên
          </Link>
        </div>
      </div>

      {cv?.sections?.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {cv.sections.map((section, index) => (
            <div key={index} className="rounded-[1.25rem] border border-[#1c2923]/10 bg-white/75 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#24543f]">{section.title || "Section"}</p>
              <p className="mt-2 text-sm leading-6 text-[#365347]">{section.content || "Không có nội dung chi tiết."}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
