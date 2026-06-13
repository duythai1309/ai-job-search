import Link from "next/link";
import { ClipboardList, ArrowRight } from "lucide-react";

export default function ApplicationsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d95332]">Safe state</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[#173c31]">Ứng tuyển</h1>
      <p className="mt-2 text-sm text-[#365347]/65">
        Backend hiện tại chưa mở endpoint quản lý applications, nên trang này chỉ hiển thị trạng thái an toàn.
      </p>

      <div className="mt-8 rounded-[1.5rem] border border-dashed border-[#1c2923]/15 bg-white/70 p-10 text-center">
        <ClipboardList className="mx-auto h-10 w-10 text-[#365347]/30" />
        <p className="mt-4 text-base font-semibold text-[#173c31]">Chưa có tracker ứng tuyển được nối backend.</p>
        <p className="mt-2 text-sm leading-6 text-[#365347]/62">
          Bắt đầu từ việc upload CV và chấm fit score để xem các đề xuất phù hợp.
        </p>
        <Link
          href="/cv-upload"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#173c31] px-5 py-3 text-sm font-bold text-white"
        >
          Đi tới upload CV
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
