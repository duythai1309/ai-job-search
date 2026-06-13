import Link from "next/link";
import { ArrowRight, FileText, Search, Sparkles, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const quickActions = [
    { href: "/cv-upload", label: "Tải CV lên", desc: "Bước đầu để phân tích và tạo gợi ý", icon: FileText },
    { href: "/job-matches", label: "Tìm việc phù hợp", desc: "Duyệt job và tính fit score", icon: Search },
    { href: "/cv-recommendations", label: "Xem gợi ý CV", desc: "Tạo đề xuất theo job đang chọn", icon: Sparkles },
    { href: "/analytics", label: "Xem thị trường", desc: "Trang an toàn khi chưa có dữ liệu", icon: TrendingUp },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d95332]">Overview</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[#173c31]">Bảng điều khiển</h1>
      <p className="mt-2 text-sm text-[#365347]/65">Trang tổng quan hiện chuyển hướng vào các luồng MVP an toàn của hệ thống.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {quickActions.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[1.5rem] border border-[#1c2923]/10 bg-white/80 p-5 shadow-[0_18px_60px_rgba(30,55,43,0.05)] transition hover:-translate-y-0.5 hover:border-[#24543f]/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef4eb] text-[#24543f]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-bold text-[#173c31]">{item.label}</h2>
                    <p className="mt-1 text-sm text-[#365347]/65">{item.desc}</p>
                  </div>
                </div>
                <ArrowRight className="mt-1 h-5 w-5 text-[#365347]/30 transition group-hover:translate-x-0.5 group-hover:text-[#24543f]" />
              </div>
            </Link>
          );
        })}
      </div>

      <section className="mt-8 rounded-[1.5rem] border border-dashed border-[#1c2923]/15 bg-white/65 p-6">
        <p className="text-sm font-semibold text-[#173c31]">Không có dữ liệu tổng hợp cũ.</p>
        <p className="mt-2 text-sm leading-6 text-[#365347]/65">
          Hãy đi theo luồng mới: upload CV, phân tích, chọn job, rồi sinh fit score và recommendations.
        </p>
      </section>
    </div>
  );
}
