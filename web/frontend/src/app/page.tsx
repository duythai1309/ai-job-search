import Link from "next/link";
import { ArrowRight, FileText, Search, Sparkles, TrendingUp } from "lucide-react";

const featureCards = [
  {
    title: "Upload CV",
    desc: "Đưa CV lên backend để trích xuất và lưu id dùng cho các bước sau.",
    href: "/cv-upload",
    icon: FileText,
  },
  {
    title: "Tìm job",
    desc: "Tìm việc từ backend /api/v1/jobs với các bộ lọc cơ bản.",
    href: "/jobs",
    icon: Search,
  },
  {
    title: "Fit score",
    desc: "Chấm mức độ phù hợp giữa CV và job bằng endpoint deterministic.",
    href: "/job-matches",
    icon: Sparkles,
  },
  {
    title: "Recommendations",
    desc: "Nhận gợi ý chỉnh CV theo job đang chọn.",
    href: "/cv-recommendations",
    icon: TrendingUp,
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <section className="overflow-hidden rounded-[2rem] bg-[#173c31] px-6 py-12 text-white sm:px-10 md:py-16 lg:px-14">
        <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#f6b49e]">
          AI job matching for students
        </p>
        <h1 className="mt-6 max-w-3xl text-5xl font-extrabold leading-[0.95] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
          Tìm việc thông minh
          <span className="block text-[#7fd6c7]">cho sinh viên Việt Nam.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
          Upload CV, xem phân tích, tìm job, chấm fit score và nhận recommendations trong một luồng thống nhất.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/cv-upload" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ef6a45] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#df5b38]">
            Bắt đầu với CV
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/jobs" className="inline-flex items-center justify-center rounded-xl border border-white/18 bg-white/8 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/14">
            Xem jobs
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {featureCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-[1.5rem] border border-[#1c2923]/10 bg-white/78 p-6 shadow-[0_18px_60px_rgba(30,55,43,0.05)] transition hover:-translate-y-0.5"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef4eb] text-[#24543f]">
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowRight className="mt-1 h-5 w-5 text-[#365347]/35 transition group-hover:translate-x-0.5 group-hover:text-[#24543f]" />
              </div>
              <h2 className="mt-8 text-2xl font-extrabold tracking-[-0.04em] text-[#173c31]">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#365347]/68">{card.desc}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
