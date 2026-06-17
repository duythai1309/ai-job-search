"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  animate,
  useInView,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  useTransform,
  useScroll,
} from "framer-motion";
import {
  Sparkles, FileText, BarChart3, MessageSquare,
  ArrowRight, CheckCircle2, MapPin, Search, ClipboardList, Globe,
} from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

/* ------------------------------ Motion helpers ----------------------------- */

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to]);

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

/* Kinetic headline — each word slides up from a clipped line */
function KineticHeadline({
  lines,
  baseDelay = 0,
}: {
  lines: { text: string; accent?: boolean }[][];
  baseDelay?: number;
}) {
  let i = 0;
  return (
    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.06] tracking-tight">
      {lines.map((words, li) => (
        <span key={li} className="block overflow-hidden pb-1 -mb-1">
          {words.map((w, wi) => {
            const delay = baseDelay + i++ * 0.07;
            return (
              <motion.span
                key={wi}
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay, ease }}
                className={`inline-block mr-[0.28em] ${
                  w.accent
                    ? "bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent"
                    : "text-white"
                }`}
              >
                {w.text}
              </motion.span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

/* ------------------------- Hero 3D floating scene -------------------------- */

function HeroScene() {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [16, 5]), { stiffness: 120, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), { stiffness: 120, damping: 18 });

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const sceneY = useTransform(scrollYProgress, [0, 1], [60, -60]);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function onMouseLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ perspective: 1500, y: sceneY }}
      className="relative mx-auto mt-16 w-full max-w-5xl px-6"
    >
      {/* Glow under the scene */}
      <div className="absolute inset-x-10 top-10 bottom-0 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 80, rotateX: 24 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1.1, delay: 0.5, ease }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative"
      >
        {/* Main dashboard card */}
        <div
          className="relative bg-white rounded-3xl border border-white/10 overflow-hidden
                     shadow-[0_60px_120px_-24px_rgba(0,0,0,0.6)]"
          style={{ transform: "translateZ(0px)" }}
        >
          {/* Window chrome */}
          <div className="h-11 px-5 flex items-center gap-2 border-b border-slate-100 bg-slate-50">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
            <span className="ml-4 text-[11px] text-slate-400 font-medium tracking-wide">vica.app / dashboard</span>
          </div>

          <div className="flex">
            {/* Mini sidebar */}
            <div className="hidden sm:flex w-14 flex-col items-center gap-1.5 py-5 border-r border-slate-100">
              <span className="text-sm font-bold text-slate-900 mb-3">V</span>
              {[BarChart3, Search, ClipboardList, FileText].map((Icon, i) => (
                <span
                  key={i}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    i === 0 ? "bg-slate-900 text-white" : "text-slate-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>
              ))}
            </div>

            {/* Dashboard body */}
            <div className="flex-1 p-6 sm:p-8">
              <p className="text-base font-bold text-slate-900 tracking-tight">Chào buổi sáng, Thái</p>
              <p className="text-xs text-slate-500 mt-0.5 mb-6">Tiến độ tìm việc của bạn tuần này</p>

              <div className="grid grid-cols-4 border-y border-slate-200 divide-x divide-slate-200 mb-6">
                {[
                  { v: "24", l: "Đơn ứng tuyển" },
                  { v: "8", l: "Đang active" },
                  { v: "3", l: "Phỏng vấn" },
                  { v: "86", l: "Điểm fit TB" },
                ].map((s) => (
                  <div key={s.l} className="py-4 px-3 sm:px-5">
                    <p className="text-lg sm:text-2xl font-bold text-slate-900">{s.v}</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {[
                  { label: "Frontend Developer · Tiki", w: "86%" },
                  { label: "Product Engineer · MoMo", w: "72%" },
                  { label: "Fullstack Intern · VNG", w: "64%" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-slate-500">{row.label}</span>
                      <span className="text-slate-900 font-semibold">{row.w}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: row.w }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Floating: AI fit score */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-10 -right-4 sm:-right-12 w-48 bg-white/95 backdrop-blur rounded-2xl border border-white/40 p-4
                     shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]"
          style={{ transform: "translateZ(100px)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </span>
            <p className="text-[11px] font-semibold text-slate-900 leading-tight">Đánh giá AI</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            86<span className="text-sm text-slate-300 font-semibold">/100</span>
          </p>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
            <div className="h-full w-[86%] bg-blue-600 rounded-full" />
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Phù hợp cao với vị trí này</p>
        </motion.div>

        {/* Floating: job row */}
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          className="absolute -bottom-8 -left-4 sm:-left-14 w-60 bg-white/95 backdrop-blur rounded-2xl border border-white/40 p-4
                     shadow-[0_32px_64px_-12px_rgba(0,0,0,0.45)]"
          style={{ transform: "translateZ(80px)" }}
        >
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
              T
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-slate-900 truncate">Frontend Developer</p>
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> TP.HCM · Remote
              </p>
            </div>
          </div>
          <div className="flex gap-1.5 mt-3">
            {["React", "TypeScript", "Next.js"].map((s) => (
              <span key={s} className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                {s}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Floating: CV chip */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
          className="absolute top-1/3 -left-3 sm:-left-20 bg-slate-900/90 backdrop-blur border border-white/10 text-white rounded-xl px-4 py-2.5
                     flex items-center gap-2 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)]"
          style={{ transform: "translateZ(120px)" }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
          <span className="text-[11px] font-semibold">CV đã tối ưu cho vị trí</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* --------------------------------- Marquee --------------------------------- */

const marqueeItems = [
  "VietnamWorks", "TopCV", "ITviec", "CareerViet",
  "Frontend Developer", "Data Analyst", "Product Manager", "UI/UX Designer",
  "Backend Engineer", "Business Analyst", "QA Engineer", "DevOps",
];

function Marquee() {
  return (
    <div
      className="relative py-7 border-t border-white/5 overflow-hidden"
      style={{ maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)" }}
    >
      <div className="flex w-max animate-marquee gap-12">
        {[...marqueeItems, ...marqueeItems].map((item, i) => (
          <span key={i} className="flex items-center gap-12 text-sm font-medium text-white/30 whitespace-nowrap">
            {item}
            <span className="w-1 h-1 rounded-full bg-white/15" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Bento features ----------------------------- */

function BentoCard({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease }}
      whileHover={{ y: -6, rotateX: 2, rotateY: -2 }}
      style={{ transformPerspective: 1000 }}
      className={`bg-white rounded-3xl border border-slate-200 p-7 lg:p-8 overflow-hidden relative
                  shadow-[0_1px_2px_rgba(15,23,42,0.04)]
                  hover:shadow-[0_32px_64px_-20px_rgba(15,23,42,0.16)] hover:border-slate-300
                  transition-[box-shadow,border-color] duration-300 ${className ?? ""}`}
    >
      {children}
    </motion.div>
  );
}

function BentoFeatures() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
      {/* AI evaluation — large card */}
      <BentoCard className="md:col-span-2">
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          <div className="flex-1">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
              <Sparkles className="w-[18px] h-[18px] text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 text-lg mb-2">AI đánh giá độ phù hợp</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              AI chấm điểm theo 4 tiêu chí và giải thích chi tiết tại sao bạn phù hợp —
              kèm khuyến nghị cải thiện cụ thể cho từng vị trí.
            </p>
          </div>
          <div className="w-full sm:w-64 bg-slate-50 rounded-2xl border border-slate-200 p-4 shrink-0">
            {[
              { label: "Kỹ năng kỹ thuật", score: 82 },
              { label: "Kinh nghiệm", score: 65 },
              { label: "Văn hóa & hành vi", score: 78 },
            ].map((item, i) => (
              <div key={item.label} className={i > 0 ? "mt-3" : ""}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="text-slate-900 font-semibold">{item.score}</span>
                </div>
                <div className="h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${item.score}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 0.3 + i * 0.12, ease }}
                    className="h-full bg-blue-600 rounded-full"
                  />
                </div>
              </div>
            ))}
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Tổng điểm</span>
              <span className="text-sm font-bold text-blue-600">86/100</span>
            </div>
          </div>
        </div>
      </BentoCard>

      {/* 4 portals */}
      <BentoCard delay={0.08}>
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
          <Globe className="w-[18px] h-[18px] text-blue-600" />
        </div>
        <h3 className="font-semibold text-slate-900 text-lg mb-2">4 cổng việc làm, 1 ô tìm kiếm</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-5">
          Tìm một lần, thấy tất cả — kết quả được gộp và khử trùng lặp.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {["VietnamWorks", "TopCV", "ITviec", "CareerViet"].map((p, i) => (
            <motion.span
              key={p}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08, ease }}
              className="text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center"
            >
              {p}
            </motion.span>
          ))}
        </div>
      </BentoCard>

      {/* Kanban */}
      <BentoCard delay={0.05}>
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
          <ClipboardList className="w-[18px] h-[18px] text-blue-600" />
        </div>
        <h3 className="font-semibold text-slate-900 text-lg mb-2">Theo dõi ứng tuyển</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-5">
          Kanban board cho toàn bộ pipeline — không bỏ sót deadline nào.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Applied", cards: 2, dot: "bg-slate-900" },
            { label: "Interview", cards: 2, dot: "bg-amber-400" },
            { label: "Offer", cards: 1, dot: "bg-emerald-500" },
          ].map((col, ci) => (
            <div key={col.label}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                <span className="text-[10px] font-semibold text-slate-500">{col.label}</span>
              </div>
              <div className="space-y-1.5">
                {Array.from({ length: col.cards }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 + (ci * 2 + i) * 0.07, ease }}
                    className="h-8 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </BentoCard>

      {/* CV builder */}
      <BentoCard delay={0.1}>
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
          <FileText className="w-[18px] h-[18px] text-blue-600" />
        </div>
        <h3 className="font-semibold text-slate-900 text-lg mb-2">CV builder thông minh</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-5">
          Xây dựng CV, nhận gợi ý cải thiện từ AI, xuất PDF chuyên nghiệp.
        </p>
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
          <div className="h-2 w-1/2 bg-slate-300 rounded-full mb-2" />
          <div className="h-1.5 w-3/4 bg-slate-200 rounded-full mb-1.5" />
          <div className="h-1.5 w-2/3 bg-slate-200 rounded-full mb-3" />
          <div className="flex gap-1.5">
            {["Đã tối ưu từ khóa", "ATS-friendly"].map((t, i) => (
              <motion.span
                key={t}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.35 + i * 0.1, ease }}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-md px-2 py-1"
              >
                <CheckCircle2 className="w-3 h-3" /> {t}
              </motion.span>
            ))}
          </div>
        </div>
      </BentoCard>

      {/* AI chat */}
      <BentoCard delay={0.12}>
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
          <MessageSquare className="w-[18px] h-[18px] text-blue-600" />
        </div>
        <h3 className="font-semibold text-slate-900 text-lg mb-2">AI đồng hành mọi trang</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-5">
          Trợ lý AI hiểu ngữ cảnh trang bạn đang xem — hỏi đáp ngay tại chỗ, không cần chuyển trang.
        </p>
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3, ease }}
            className="ml-auto w-fit max-w-[90%] bg-slate-900 text-white text-[12px] rounded-2xl rounded-br-sm px-4 py-2.5"
          >
            Tôi có phù hợp với việc này không?
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5, ease }}
            className="w-fit max-w-[90%] bg-slate-100 text-slate-700 text-[12px] rounded-2xl rounded-bl-sm px-4 py-2.5"
          >
            Rất phù hợp — kỹ năng React khớp 86%. Nên nhấn mạnh dự án gần nhất.
          </motion.div>
        </div>
      </BentoCard>
    </div>
  );
}

/* -------------------------------- How it works ----------------------------- */

const steps = [
  { num: "01", title: "Tạo hồ sơ trong 2 phút", desc: "Upload CV — AI tự động phân tích kỹ năng, kinh nghiệm và xây hồ sơ cho bạn." },
  { num: "02", title: "Tìm và đánh giá việc làm", desc: "Tìm kiếm trên 4 cổng cùng lúc, AI chấm điểm độ phù hợp từng vị trí." },
  { num: "03", title: "Ứng tuyển và theo dõi", desc: "CV được tối ưu cho từng vị trí, pipeline ứng tuyển nằm gọn trong một board." },
];

function HowItWorks() {
  return (
    <div className="grid md:grid-cols-3 gap-10 md:gap-8 relative">
      <div className="hidden md:block absolute top-7 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      {steps.map((s, i) => (
        <motion.div
          key={s.num}
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: i * 0.15, ease }}
          className="relative text-center md:px-4"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 text-white flex items-center justify-center text-sm font-bold mb-6 relative z-10 shadow-[0_12px_24px_-8px_rgba(15,23,42,0.4)]">
            {s.num}
          </div>
          <h3 className="font-semibold text-slate-900 text-lg mb-2">{s.title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
        </motion.div>
      ))}
    </div>
  );
}

/* --------------------------------- Page ------------------------------------ */

export default function LandingPage() {
  const heroRef = useRef<HTMLElement>(null);
  const spotX = useMotionValue(600);
  const spotY = useMotionValue(300);
  const spotlight = useMotionTemplate`radial-gradient(640px at ${spotX}px ${spotY}px, rgba(59,130,246,0.14), transparent 80%)`;

  function onHeroMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    spotX.set(e.clientX - rect.left);
    spotY.set(e.clientY - rect.top);
  }

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* Floating glass pill nav */}
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1
                   bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-full pl-5 pr-1.5 py-1.5
                   shadow-[0_16px_40px_-12px_rgba(0,0,0,0.45)]"
      >
        <span className="font-bold text-white text-base tracking-tight mr-3">Vica</span>
        <Link
          href="/auth/login"
          className="text-white/60 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
        >
          Đăng nhập
        </Link>
        <Link
          href="/auth/register"
          className="bg-white hover:bg-slate-100 text-slate-900 px-4 py-2 rounded-full text-sm font-semibold transition-colors"
        >
          Bắt đầu miễn phí
        </Link>
      </motion.nav>

      {/* ============================== HERO (dark) ============================== */}
      <section
        ref={heroRef}
        onMouseMove={onHeroMouseMove}
        className="relative bg-slate-950 min-h-screen flex flex-col pt-28 pb-0 overflow-hidden"
      >
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.5] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 35%, black, transparent)",
          }}
        />
        {/* Aurora blobs */}
        <div className="absolute -top-32 left-1/4 w-[480px] h-[480px] bg-blue-600/25 rounded-full blur-[120px] animate-aurora pointer-events-none" />
        <div
          className="absolute top-20 right-1/5 w-[380px] h-[380px] bg-cyan-500/15 rounded-full blur-[110px] animate-aurora pointer-events-none"
          style={{ animationDelay: "-6s" }}
        />
        <div
          className="absolute top-72 left-1/2 w-[320px] h-[320px] bg-indigo-600/20 rounded-full blur-[100px] animate-aurora pointer-events-none"
          style={{ animationDelay: "-11s" }}
        />
        {/* Mouse spotlight */}
        <motion.div className="absolute inset-0 pointer-events-none" style={{ background: spotlight }} />

        <div className="relative flex-1 flex flex-col justify-center w-full">
        <div className="max-w-4xl mx-auto text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="inline-flex items-center gap-2 border border-white/10 bg-white/5 backdrop-blur text-white/60 text-xs font-medium px-4 py-1.5 rounded-full mb-9"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
            AI đồng hành toàn bộ hành trình tìm việc
          </motion.div>

          <KineticHeadline
            baseDelay={0.15}
            lines={[
              [{ text: "Tìm" }, { text: "việc" }, { text: "thông" }, { text: "minh," }],
              [{ text: "bắt", accent: true }, { text: "đầu", accent: true }, { text: "từ", accent: true }, { text: "hôm", accent: true }, { text: "nay.", accent: true }],
            ]}
          />

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease }}
            className="text-lg text-white/50 max-w-2xl mx-auto mt-7 mb-11 leading-relaxed"
          >
            Từ tìm kiếm, đánh giá độ phù hợp AI, tạo CV đến theo dõi ứng tuyển —
            tất cả trong một nền tảng, hoàn toàn miễn phí.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.72, ease }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link
              href="/auth/register"
              className="group inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-900 px-8 py-4 rounded-2xl font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-12px_rgba(255,255,255,0.25)]"
            >
              Bắt đầu miễn phí
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 border border-white/15 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-semibold transition-colors backdrop-blur"
            >
              Đã có tài khoản
            </Link>
          </motion.div>
        </div>

          <HeroScene />
        </div>

        <Marquee />
      </section>

      {/* ============================ Stats counters ============================ */}
      <section className="px-6 sm:px-8 lg:px-12 py-20 sm:py-24 bg-white">
        <Reveal className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 border-y border-slate-200 divide-x divide-slate-200">
            <div className="py-10 px-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-1.5">
                <CountUp to={4} suffix="+" />
              </div>
              <div className="text-xs text-slate-500 font-medium">Cổng việc làm</div>
            </div>
            <div className="py-10 px-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-1.5">
                <CountUp to={10} suffix="k+" />
              </div>
              <div className="text-xs text-slate-500 font-medium">Việc làm mới / tuần</div>
            </div>
            <div className="py-10 px-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-1.5">AI</div>
              <div className="text-xs text-slate-500 font-medium">Đánh giá tự động</div>
            </div>
            <div className="py-10 px-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-1.5">
                <CountUp to={100} suffix="%" />
              </div>
              <div className="text-xs text-slate-500 font-medium">Miễn phí</div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============================ Bento features ============================ */}
      <section className="py-24 sm:py-28 px-6 sm:px-8 lg:px-12 bg-slate-50 border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="text-xs font-semibold text-blue-600 tracking-[0.2em] uppercase mb-4">Tính năng</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-3">
              Mọi thứ bạn cần để tìm việc
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              Một nền tảng duy nhất cho toàn bộ hành trình ứng tuyển của bạn
            </p>
          </Reveal>
          <BentoFeatures />
        </div>
      </section>

      {/* ============================= How it works ============================= */}
      <section className="py-28 px-6 sm:px-8 lg:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-20">
            <p className="text-xs font-semibold text-blue-600 tracking-[0.2em] uppercase mb-4">Cách hoạt động</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Ba bước đến offer đầu tiên
            </h2>
          </Reveal>
          <HowItWorks />
        </div>
      </section>

      {/* ================================= CTA ================================= */}
      <section className="relative bg-slate-950 py-36 px-6 sm:px-8 lg:px-12 overflow-hidden">
        <div className="absolute -top-24 left-1/3 w-[420px] h-[420px] bg-blue-600/25 rounded-full blur-[120px] animate-aurora pointer-events-none" />
        <div
          className="absolute bottom-0 right-1/4 w-[360px] h-[360px] bg-cyan-500/15 rounded-full blur-[110px] animate-aurora pointer-events-none"
          style={{ animationDelay: "-8s" }}
        />
        <div
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)",
          }}
        />
        <Reveal className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5 leading-tight">
            Sẵn sàng cho{" "}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              offer đầu tiên?
            </span>
          </h2>
          <p className="text-white/50 mb-10 max-w-md mx-auto leading-relaxed">
            Tạo tài khoản miễn phí và bắt đầu tìm kiếm việc làm ngay hôm nay.
          </p>
          <Link
            href="/auth/register"
            className="group inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 px-10 py-4 rounded-2xl font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-12px_rgba(255,255,255,0.25)]"
          >
            Đăng ký miễn phí
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </section>

      {/* =============================== Footer ================================ */}
      <footer className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10 flex items-center justify-between relative z-10">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-slate-900 text-base tracking-tight">Vica</span>
            <span className="text-slate-400 text-sm">· 2025</span>
          </div>
          <p className="text-slate-400 text-xs">VietnamWorks · TopCV · ITviec · CareerViet</p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease }}
          aria-hidden
          className="text-center font-bold text-slate-100 select-none pointer-events-none leading-none
                     text-[26vw] md:text-[20vw] -mb-[5vw] tracking-tight"
        >
          Vica
        </motion.div>
      </footer>
    </div>
  );
}
