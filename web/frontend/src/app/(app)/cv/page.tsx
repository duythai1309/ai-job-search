import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";

export default function CvPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d95332]">Safe state</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[#173c31]">CV của tôi</h1>
      <p className="mt-2 text-sm text-[#365347]/65">
        Trang CV cũ được thay bằng luồng upload + analysis mới để khớp backend hiện tại.
      </p>

      <div className="mt-8 rounded-[1.5rem] border border-dashed border-[#1c2923]/15 bg-white/70 p-10 text-center">
        <FileText className="mx-auto h-10 w-10 text-[#365347]/30" />
        <p className="mt-4 text-base font-semibold text-[#173c31]">Hãy bắt đầu bằng upload CV.</p>
        <p className="mt-2 text-sm leading-6 text-[#365347]/62">
          Sau khi upload, bạn có thể xem phân tích, fit score và recommendations từ các route mới.
        </p>
        <Link
          href="/cv-upload"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#173c31] px-5 py-3 text-sm font-bold text-white"
        >
          Upload CV
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
