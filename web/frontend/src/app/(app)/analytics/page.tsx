"use client";
import { useState } from "react";
import {
  ComposedChart, Bar, Line, BarChart, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, LabelList, Cell,
  PieChart, Pie
} from "recharts";
import {
  RefreshCw, ArrowUpRight, ArrowDownRight, Briefcase, Building2,
  Wallet, TrendingUp, Users, Clock, Cpu, Layers, MapPin, Sparkles,
  Gift
} from "lucide-react";
import toast from "react-hot-toast";

/* ─────────────────────────  DATA  ───────────────────────── */

const postingTrend = [
  { month: "07/25", postings: 2310, applicants: 38200 },
  { month: "08/25", postings: 2360, applicants: 39100 },
  { month: "09/25", postings: 2405, applicants: 40050 },
  { month: "10/25", postings: 2380, applicants: 39800 },
  { month: "11/25", postings: 2440, applicants: 41200 },
  { month: "12/25", postings: 2500, applicants: 42600 },
  { month: "01/26", postings: 2400, applicants: 41000 },
  { month: "02/26", postings: 2510, applicants: 42800 },
  { month: "03/26", postings: 2480, applicants: 43500 },
  { month: "04/26", postings: 2650, applicants: 44900 },
  { month: "05/26", postings: 2790, applicants: 46100 },
  { month: "06/26", postings: 2850, applicants: 47300 }
];

const roleDemand = [
  { role: "Backend Developer", pct: 21, count: 612 },
  { role: "Frontend Developer", pct: 18, count: 524 },
  { role: "Data Engineer", pct: 14, count: 398 },
  { role: "DevOps / SRE", pct: 12, count: 342 },
  { role: "Mobile Developer", pct: 10, count: 285 },
  { role: "Data Scientist / ML", pct: 9, count: 256 },
  { role: "QA / Tester", pct: 8, count: 228 },
  { role: "Product / BA", pct: 7, count: 205 }
];

const marketSkillsData = [
  { name: "SQL", pct: 68 },
  { name: "React / Next.js", pct: 54 },
  { name: "Python", pct: 48 },
  { name: "TypeScript", pct: 42 },
  { name: "Java", pct: 35 },
  { name: "Docker / K8s", pct: 30 },
  { name: "Git", pct: 28 },
  { name: "AWS / Cloud", pct: 25 }
];

const salaryByRole = [
  { role: "Backend Developer", junior: "14 – 20", mid: "22 – 35", senior: "38 – 60", demand: "Rất cao" },
  { role: "Data Engineer", junior: "15 – 22", mid: "25 – 38", senior: "42 – 65", demand: "Rất cao" },
  { role: "DevOps / SRE", junior: "15 – 22", mid: "26 – 40", senior: "45 – 68", demand: "Rất cao" },
  { role: "Data Scientist / ML", junior: "16 – 24", mid: "28 – 42", senior: "45 – 70", demand: "Cao" },
  { role: "Frontend Developer", junior: "12 – 18", mid: "20 – 32", senior: "35 – 55", demand: "Cao" },
  { role: "Mobile Developer", junior: "12 – 18", mid: "20 – 32", senior: "34 – 52", demand: "Trung bình" },
  { role: "QA / Automation", junior: "10 – 16", mid: "18 – 28", senior: "30 – 45", demand: "Trung bình" }
];

const salaryDistribution = [
  { range: "< 15", count: 12 },
  { range: "15–25", count: 38 },
  { range: "25–35", count: 32 },
  { range: "35–50", count: 13 },
  { range: "> 50", count: 5 }
];

const experienceDemand = [
  { level: "Fresher", value: 14 },
  { level: "Junior", value: 31 },
  { level: "Mid", value: 34 },
  { level: "Senior", value: 16 },
  { level: "Lead+", value: 5 }
];

const workModel = [
  { name: "Tại văn phòng", value: 58 },
  { name: "Hybrid", value: 31 },
  { name: "Remote", value: 11 }
];

const industryShare = [
  { name: "Dịch vụ phần mềm", value: 28 },
  { name: "Fintech / Ngân hàng số", value: 22 },
  { name: "Thương mại điện tử", value: 18 },
  { name: "Internet / Game", value: 14 },
  { name: "Viễn thông / Hạ tầng", value: 10 },
  { name: "EdTech, HealthTech…", value: 8 }
];

const locationsData = [
  { name: "TP. Hồ Chí Minh", count: 1567, percentage: 55 },
  { name: "Hà Nội", count: 998, percentage: 35 },
  { name: "Đà Nẵng", count: 171, percentage: 6 },
  { name: "Remote / Từ xa", count: 114, percentage: 4 }
];

const topCompanies = [
  { name: "FPT Software", sector: "Dịch vụ CNTT", openings: 142, trend: 12 },
  { name: "VNG Corporation", sector: "Internet / Game", openings: 98, trend: 8 },
  { name: "MoMo (M_Service)", sector: "Fintech", openings: 87, trend: 22 },
  { name: "Shopee Vietnam", sector: "E-commerce", openings: 76, trend: -4 },
  { name: "Viettel Digital", sector: "Viễn thông", openings: 64, trend: 15 },
  { name: "Tiki", sector: "E-commerce", openings: 41, trend: -9 }
];

const trendingSkills = [
  { name: "LLMs & RAG Architecture", growth: 85, reason: "Triển khai mô hình ngôn ngữ lớn, tối ưu truy xuất ngữ cảnh doanh nghiệp" },
  { name: "dbt (Data Build Tool)", growth: 60, reason: "Chuẩn hóa và quản lý luồng biến đổi dữ liệu trực tiếp trong kho SQL" },
  { name: "Playwright Framework", growth: 55, reason: "Tự động hóa kiểm thử web thế hệ mới, thay thế Selenium nhờ tốc độ vượt trội" },
  { name: "GitOps (ArgoCD/Flux)", growth: 48, reason: "Đồng bộ trạng thái hạ tầng đám mây và Kubernetes từ mã nguồn Git" },
  { name: "Next.js App Router & RSC", growth: 42, reason: "Tối ưu Server Components, cải thiện tốc độ tải và SEO cho Frontend" }
];

const benefits = [
  { name: "Bảo hiểm sức khỏe", pct: 78 },
  { name: "Làm việc linh hoạt / Hybrid", pct: 64 },
  { name: "Thưởng hiệu suất (KPI)", pct: 59 },
  { name: "Ngân sách đào tạo", pct: 47 },
  { name: "Cổ phần / ESOP", pct: 21 }
];

/* ─────────────────────────  TOKENS  ───────────────────────── */

const NAVY = "#005288";
const NAVY_DEEP = "#003F6B";
const NAVY_LIGHT = "#86B2D4";
const GOLD = "#C8953C";
const BLUES = ["#003F6B", "#005288", "#1E6EA8", "#4C8CC0", "#86B2D4", "#B9D2E6"];

const tooltipStyle = {
  borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)", padding: "8px 12px"
} as const;

const demandStyle: Record<string, string> = {
  "Rất cao": "bg-blue-100 text-blue-700",
  "Cao": "bg-blue-50 text-blue-600",
  "Trung bình": "bg-slate-100 text-slate-500"
};

const nf = new Intl.NumberFormat("vi-VN");

/* ─────────────────────────  PRIMITIVES  ───────────────────────── */

function Panel({
  title, subtitle, icon: Icon, right, children, className = "", bodyClass = "px-5 md:px-6 py-5",
}: {
  title: string; subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  right?: React.ReactNode; children: React.ReactNode;
  className?: string; bodyClass?: string;
}) {
  return (
    <section className={`bg-white border border-slate-200 rounded-2xl shadow-card flex flex-col overflow-hidden ${className}`}>
      <header className="flex items-start justify-between gap-3 px-5 md:px-6 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3 min-w-0">
          <span className="shrink-0 grid place-items-center w-9 h-9 rounded-xl bg-blue-50 text-blue-600">
            <Icon className="w-[18px] h-[18px]" />
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-[15px] leading-tight truncate">{title}</h3>
            {subtitle && <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">{subtitle}</p>}
          </div>
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </header>
      <div className={`flex-1 ${bodyClass}`}>{children}</div>
    </section>
  );
}

function Sparkline({ data, color = NAVY, id }: { data: number[]; color?: string; id: string }) {
  const d = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={d} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${id})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function Kpi({
  icon: Icon, label, value, unit, delta, dir, spark, sparkId,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; unit?: string;
  delta: string; dir: "up" | "down"; spark: number[]; sparkId: string;
}) {
  const pos = dir === "up";
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-5 hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <span className="grid place-items-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600">
          <Icon className="w-[17px] h-[17px]" />
        </span>
        <span className={`inline-flex items-center gap-0.5 text-[11.5px] font-bold tabular-nums ${pos ? "text-emerald-600" : "text-rose-500"}`}>
          {pos ? <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} /> : <ArrowDownRight className="w-3.5 h-3.5" strokeWidth={2.5} />}
          {delta}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-[26px] font-extrabold text-slate-900 tracking-tight tabular-nums leading-none">{value}</span>
        {unit && <span className="text-[12px] text-slate-400 font-medium">{unit}</span>}
      </div>
      <div className="flex items-end justify-between mt-2.5 gap-3">
        <span className="text-[11.5px] text-slate-500 font-medium leading-tight">{label}</span>
        <div className="w-[68px] h-8 shrink-0"><Sparkline data={spark} id={sparkId} /></div>
      </div>
    </div>
  );
}

/* ─────────────────────────  PAGE  ───────────────────────── */

export default function AnalyticsPage() {
  const [syncing, setSyncing] = useState(false);
  const [period, setPeriod] = useState<6 | 12>(12);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      toast.success("Đã đồng bộ dữ liệu thị trường IT & Data mới nhất từ Supabase Cloud!");
    }, 1200);
  };

  const trendData = period === 12 ? postingTrend : postingTrend.slice(-6);
  const salaryPeak = Math.max(...salaryDistribution.map((d) => d.count));
  const expPeak = Math.max(...experienceDemand.map((d) => d.value));
  const sparkPostings = postingTrend.map((d) => d.postings);
  const sparkApplicants = postingTrend.map((d) => d.applicants);

  return (
    <div className="max-w-[1320px] mx-auto min-h-screen pb-16">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 mb-7 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.16em]">Cập nhật trực tiếp · Q2/2026</span>
          </div>
          <h1 className="text-2xl md:text-[28px] font-extrabold tracking-tight text-slate-900">
            Phân tích Thị trường Việc làm Công nghệ
          </h1>
          <p className="text-slate-500 text-[13.5px] mt-1.5 max-w-2xl">
            Tổng quan nhu cầu tuyển dụng, kỹ năng, mặt bằng lương và phân bố việc làm ngành IT &amp; Data tại Việt Nam.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="inline-flex p-1 bg-slate-100 rounded-lg">
            {([6, 12] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`cursor-pointer text-[12.5px] font-semibold px-3 py-1.5 rounded-md transition-colors ${period === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                {p} tháng
              </button>
            ))}
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white
              font-semibold px-4 py-2 rounded-lg text-[13px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Đang đồng bộ…" : "Đồng bộ"}
          </button>
        </div>
      </header>

      {/* ── KPI row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <Kpi icon={Briefcase} label="Vị trí đang tuyển" value="2,850" delta="14.6%" dir="up" spark={sparkPostings} sparkId="k1" />
        <Kpi icon={Building2} label="Doanh nghiệp tuyển dụng" value="620" delta="5.2%" dir="up" spark={[510, 540, 535, 570, 600, 620]} sparkId="k2" />
        <Kpi icon={Wallet} label="Lương trung vị" value="25.5" unit="tr" delta="3.1%" dir="up" spark={[22.4, 23.1, 23.8, 24.5, 25, 25.5]} sparkId="k3" />
        <Kpi icon={TrendingUp} label="Tăng trưởng việc làm" value="+15.8" unit="%" delta="6 tháng" dir="up" spark={[8.5, 9.8, 11.2, 12.5, 14.3, 15.8]} sparkId="k4" />
        <Kpi icon={Users} label="Ứng viên / tin tuyển" value="16.6" delta="2.4%" dir="up" spark={sparkApplicants} sparkId="k5" />
        <Kpi icon={Clock} label="Thời gian tuyển TB" value="24" unit="ngày" delta="2 ngày" dir="down" spark={[29, 28, 27, 26, 25, 24]} sparkId="k6" />
      </div>

      {/* ── Trend + industry ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        <Panel
          icon={TrendingUp}
          title="Xu hướng tuyển dụng theo thời gian"
          subtitle="Số tin đăng (cột) và lượt ứng tuyển (đường) theo tháng"
          className="lg:col-span-8"
          right={
            <div className="hidden sm:flex items-center gap-4 text-[11.5px] font-medium">
              <span className="flex items-center gap-1.5 text-slate-600"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: NAVY }} />Tin đăng</span>
              <span className="flex items-center gap-1.5 text-slate-600"><span className="w-3 h-0.5 rounded-full" style={{ background: GOLD }} />Ứng tuyển</span>
            </div>
          }
        >
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ left: -8, right: 6, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={42} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={44}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n) => [nf.format(v), n === "postings" ? "Tin đăng" : "Lượt ứng tuyển"]} />
                <Bar yAxisId="left" dataKey="postings" fill={NAVY} radius={[4, 4, 0, 0]} barSize={18} />
                <Line yAxisId="right" dataKey="applicants" stroke={GOLD} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel icon={Layers} title="Cơ cấu theo nhóm ngành" subtitle="Tỉ trọng tin tuyển dụng (%)" className="lg:col-span-4">
          <div className="w-full h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={industryShare} dataKey="value" nameKey="name" innerRadius={45} outerRadius={66} paddingAngle={2} stroke="none">
                  {industryShare.map((_, i) => <Cell key={i} fill={BLUES[i]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n) => [`${v}%`, n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-2">
            {industryShare.map((d, i) => (
              <li key={i} className="flex items-center justify-between text-[12.5px]">
                <span className="flex items-center gap-2 text-slate-600 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: BLUES[i] }} />
                  <span className="truncate">{d.name}</span>
                </span>
                <span className="font-bold text-slate-900 tabular-nums shrink-0 ml-2">{d.value}%</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* ── Roles + skills ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <Panel icon={Briefcase} title="Top vị trí được tuyển nhiều nhất" subtitle="Tỉ trọng trên tổng số tin tuyển dụng (%)">
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleDemand} layout="vertical" barCategoryGap="24%" margin={{ left: 0, right: 44, top: 0, bottom: 0 }}>
                <XAxis type="number" domain={[0, 25]} hide />
                <YAxis dataKey="role" type="category" width={128} tick={{ fontSize: 12, fill: "#334155" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={tooltipStyle} formatter={(v: number, _n, p) => [`${v}% · ${nf.format(p.payload.count)} tin`, "Nhu cầu"]} />
                <Bar dataKey="pct" fill={NAVY} radius={[4, 4, 4, 4]} background={{ fill: "#f1f5f9", radius: 4 }}>
                  <LabelList dataKey="pct" position="right" formatter={(v: number) => `${v}%`} style={{ fontSize: 12, fill: "#475569", fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel icon={Cpu} title="Kỹ năng công nghệ yêu cầu nhiều nhất" subtitle="Tần suất xuất hiện trong mô tả công việc (%)">
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marketSkillsData} layout="vertical" barCategoryGap="24%" margin={{ left: 0, right: 44, top: 0, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={118} tick={{ fontSize: 12, fill: "#334155" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Tần suất"]} />
                <Bar dataKey="pct" fill={NAVY_DEEP} radius={[4, 4, 4, 4]} background={{ fill: "#f1f5f9", radius: 4 }}>
                  <LabelList dataKey="pct" position="right" formatter={(v: number) => `${v}%`} style={{ fontSize: 12, fill: "#475569", fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* ── Salary by role table ───────────────────────────── */}
      <Panel
        icon={Wallet}
        title="Mức lương theo vị trí & cấp bậc"
        subtitle="Khoảng lương tham khảo theo kinh nghiệm — đơn vị: triệu VND / tháng"
        bodyClass="px-0 py-0"
        className="mb-6"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px] min-w-[640px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200">
                <th className="text-left font-semibold px-5 md:px-6 py-3">Vị trí</th>
                <th className="text-right font-semibold px-3 py-3">Junior</th>
                <th className="text-right font-semibold px-3 py-3">Mid-level</th>
                <th className="text-right font-semibold px-3 py-3">Senior</th>
                <th className="text-right font-semibold px-5 md:px-6 py-3">Nhu cầu</th>
              </tr>
            </thead>
            <tbody>
              {salaryByRole.map((r, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 md:px-6 py-3 font-semibold text-slate-900">{r.role}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-500">{r.junior}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-700">{r.mid}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-semibold text-slate-900">{r.senior}</td>
                  <td className="px-5 md:px-6 py-3 text-right">
                    <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full ${demandStyle[r.demand]}`}>{r.demand}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ── Salary dist + experience + work model ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <Panel icon={Wallet} title="Phân bổ dải lương" subtitle="Tỉ lệ cơ hội theo dải (triệu VND)">
          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryDistribution} margin={{ left: -24, right: 6, top: 22, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="range" interval={0} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                <YAxis hide domain={[0, salaryPeak + 8]} />
                <Bar dataKey="count" barSize={38} radius={[5, 5, 0, 0]}>
                  {salaryDistribution.map((d, i) => <Cell key={i} fill={d.count === salaryPeak ? NAVY : NAVY_LIGHT} />)}
                  <LabelList dataKey="count" position="top" formatter={(v: number) => `${v}%`} style={{ fontSize: 12, fill: "#334155", fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel icon={Layers} title="Nhu cầu theo cấp bậc" subtitle="Tỉ trọng theo năm kinh nghiệm (%)">
          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={experienceDemand} margin={{ left: -24, right: 6, top: 22, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="level" interval={0} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                <YAxis hide domain={[0, expPeak + 8]} />
                <Bar dataKey="value" barSize={38} radius={[5, 5, 0, 0]}>
                  {experienceDemand.map((d, i) => <Cell key={i} fill={d.value === expPeak ? NAVY : NAVY_LIGHT} />)}
                  <LabelList dataKey="value" position="top" formatter={(v: number) => `${v}%`} style={{ fontSize: 12, fill: "#334155", fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel icon={MapPin} title="Hình thức làm việc" subtitle="Cơ cấu mô hình làm việc (%)">
          <div className="flex items-center gap-5">
            <div className="relative w-[128px] h-[128px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={workModel} dataKey="value" nameKey="name" innerRadius={44} outerRadius={62} paddingAngle={2} stroke="none">
                    {workModel.map((_, i) => <Cell key={i} fill={[NAVY, GOLD, NAVY_LIGHT][i]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n) => [`${v}%`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold text-slate-900 leading-none">{workModel[0].value}%</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Onsite</span>
              </div>
            </div>
            <ul className="flex-1 space-y-2.5">
              {workModel.map((m, i) => (
                <li key={i} className="flex items-center justify-between text-[12.5px]">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: [NAVY, GOLD, NAVY_LIGHT][i] }} />{m.name}
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums">{m.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      {/* ── Geography + top companies ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        <Panel icon={MapPin} title="Phân bố địa lý việc làm" subtitle="Tập trung theo khu vực chính" className="lg:col-span-5">
          <div className="space-y-[18px] pt-1">
            {locationsData.map((loc, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-baseline text-[13px]">
                  <span className="text-slate-800 font-semibold">{loc.name}</span>
                  <span className="text-slate-400 tabular-nums">
                    {nf.format(loc.count)} tin <span className="text-slate-900 font-bold ml-1.5">{loc.percentage}%</span>
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${loc.percentage}%`, background: NAVY }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel icon={Building2} title="Top doanh nghiệp đang tuyển" subtitle="Vị trí mở và biến động so với quý trước"
          className="lg:col-span-7" bodyClass="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px] min-w-[480px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200">
                  <th className="text-left font-semibold px-5 md:px-6 py-3">Doanh nghiệp</th>
                  <th className="text-left font-semibold px-3 py-3">Lĩnh vực</th>
                  <th className="text-right font-semibold px-3 py-3">Vị trí mở</th>
                  <th className="text-right font-semibold px-5 md:px-6 py-3">So Q1</th>
                </tr>
              </thead>
              <tbody>
                {topCompanies.map((c, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 md:px-6 py-3 font-semibold text-slate-900">{c.name}</td>
                    <td className="px-3 py-3 text-slate-500">{c.sector}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold text-slate-900">{c.openings}</td>
                    <td className="px-5 md:px-6 py-3 text-right">
                      <span className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${c.trend >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                        {c.trend >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} /> : <ArrowDownRight className="w-3.5 h-3.5" strokeWidth={2.5} />}
                        {Math.abs(c.trend)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* ── Trending tech + benefits ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
        <Panel icon={Sparkles} title="Công nghệ xu hướng" subtitle="Kỹ năng tăng trưởng quan tâm mạnh nhất so cùng kỳ" className="lg:col-span-7">
          <ul className="divide-y divide-slate-100 -mt-1">
            {trendingSkills.map((t, i) => (
              <li key={i} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="font-semibold text-slate-900 text-[14px]">
                    <span className="text-blue-200 tabular-nums mr-2">{String(i + 1).padStart(2, "0")}</span>{t.name}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[12px] font-bold text-emerald-600 tabular-nums shrink-0 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} />{t.growth}%
                  </span>
                </div>
                <p className="text-[12.5px] text-slate-500 leading-relaxed pl-7">{t.reason}</p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel icon={Gift} title="Phúc lợi phổ biến" subtitle="Tỉ lệ tin tuyển dụng có đề cập (%)" className="lg:col-span-5">
          <div className="space-y-[18px] pt-1">
            {benefits.map((b, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-baseline text-[13px]">
                  <span className="text-slate-700 font-medium">{b.name}</span>
                  <span className="text-slate-900 font-bold tabular-nums">{b.pct}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${b.pct}%`, background: i === 0 ? NAVY : NAVY_LIGHT }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 pt-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 mb-2">Phương pháp luận &amp; nguồn dữ liệu</p>
        <p className="text-[12.5px] text-slate-500 leading-relaxed max-w-3xl">
          Dữ liệu tổng hợp từ tin tuyển dụng IT &amp; Data thu thập trong 12 tháng gần nhất, chuẩn hóa qua nền tảng Supabase Cloud.
          Chỉ số tăng trưởng tính theo phương pháp so sánh cùng kỳ; khoảng lương đã loại bỏ giá trị ngoại lệ. Số liệu mang tính
          tham khảo phục vụ định hướng nghề nghiệp.
        </p>
      </footer>
    </div>
  );
}
