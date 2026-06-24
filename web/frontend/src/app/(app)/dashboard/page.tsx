"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import {
  ClipboardList, Search, FileText, MessageSquare,
  TrendingUp, ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { STATUS_LABELS } from "@/lib/types";
import { createClient } from "@/lib/supabase";

interface Stats {
  total: number;
  by_status: Record<string, number>;
  active: number;
  success_rate: number;
  jobs_explored: number;
  cvs_created: number;
  avg_fit_score: number | null;
}

// Harmonious palette: blue leads (brand), amber/emerald/rose as accents.
const STATUS_CHART_COLORS: Record<string, string> = {
  bookmarked: "#93c5fd", // blue-300
  applied:    "#2563eb", // blue-600
  interview:  "#f59e0b", // amber-500
  offer:      "#10b981", // emerald-500
  rejected:   "#fb7185", // rose-400
  withdrawn:  "#cbd5e1", // slate-300
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        const full = data.user?.user_metadata?.full_name || data.user?.email?.split("@")[0] || "";
        const parts = full.trim().split(" ").filter(Boolean);
        setFirstName(parts[parts.length - 1] || full);
      })
      .catch(() => {});

    async function load() {
      try {
        const [activity, appStats] = await Promise.all([
          api.get<{ jobs_explored: number; cvs_created: number; avg_fit_score: number | null }>(
            "/analytics/user/activity"
          ),
          api.get<{ total: number; by_status: Record<string, number>; active: number; success_rate: number }>(
            "/applications/stats"
          ),
        ]);
        setStats({ ...appStats, ...activity });
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statusData = stats
    ? Object.entries(stats.by_status)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v, key: k }))
    : [];

  const metrics = [
    { label: "Đơn ứng tuyển", value: stats?.total ?? "—" },
    { label: "Đang tiến hành", value: stats?.active ?? "—" },
    { label: "Việc đã khám phá", value: stats?.jobs_explored ?? "—" },
    { label: "CV đã tạo", value: stats?.cvs_created ?? "—" },
    {
      label: "Điểm phù hợp TB",
      value: stats?.avg_fit_score != null ? `${stats.avg_fit_score}%` : "—",
    },
  ];

  const quickActions = [
    { href: "/jobs", Icon: Search, label: "Tìm kiếm việc làm", desc: "Tổng hợp từ 4 cổng tuyển dụng VN", tint: "bg-blue-50 text-blue-600" },
    { href: "/cv", Icon: FileText, label: "Tạo hoặc chỉnh CV", desc: "AI phân tích và đề xuất cải thiện", tint: "bg-violet-50 text-violet-600" },
    { href: "/analytics", Icon: TrendingUp, label: "Xu hướng thị trường", desc: "Kỹ năng và mức lương đang hot", tint: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="max-w-screen-2xl">
      {/* Header — layered gradient hero with a warm amber accent for balance */}
      <div className="relative overflow-hidden rounded-3xl px-8 py-10 mb-10 border border-slate-200/50 shadow-md min-h-[220px] flex items-center bg-[#001E36]">
        {/* Background Campus Photo with low opacity and hover scale effect */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{
            backgroundImage: "url('/vinuni-campus.png')",
            backgroundPosition: "center 48%",
          }}
        />
        
        {/* Layered Gradient Overlay for premium feel and text contrast */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to right, #001E36 0%, #001E36 28%, rgba(0, 30, 54, 0.6) 60%, rgba(0, 30, 54, 0.1) 100%)"
          }}
        />
        
        {/* Gold stripe to anchor VinUni branding */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#DEB25E] via-[#C8953C] to-[#DEB25E]" />

        {/* Ambient glow effects */}
        <div className="absolute -top-20 -right-16 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl md:max-w-2xl text-white">
          <p className="text-xs font-semibold text-amber-400 tracking-wider uppercase mb-1.5">{greeting()}</p>
          <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight drop-shadow-sm">
            {firstName ? `${firstName}.` : "Chào mừng trở lại."}
          </h1>
          <p className="text-blue-50/90 text-sm mt-3 max-w-md leading-relaxed font-medium drop-shadow-sm">
            Theo dõi tiến độ ứng tuyển và để Vica AI gợi ý bước tiếp theo cho bạn.
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 mt-6 bg-gradient-to-r from-amber-400 to-amber-500 text-blue-950 hover:from-amber-300 hover:to-amber-400 text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-[0_4px_12px_rgba(222,178,94,0.3)] hover:shadow-none hover:translate-y-[0.5px]"
          >
            Tìm việc ngay <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>


      {/* Metrics: flat row with thin dividers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-y border-slate-200 divide-x divide-slate-200 mb-12">
        {metrics.map((m) => (
          <div key={m.label} className="px-6 py-6 first:pl-0">
            {loading ? (
              <div className="h-8 w-12 bg-slate-100 rounded animate-pulse mb-1" />
            ) : (
              <div className="text-3xl font-bold text-slate-900 tabular-nums">{m.value}</div>
            )}
            <div className="text-xs text-slate-400 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Pipeline + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
        {/* Pipeline */}
        <div>
          <h2 className="font-semibold text-slate-900">Pipeline ứng tuyển</h2>
          <p className="text-xs text-slate-400 mt-0.5 mb-6">Phân bổ theo trạng thái hiện tại</p>
          {!loading && statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%" cy="50%"
                    innerRadius={58} outerRadius={92}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_CHART_COLORS[entry.key] || "#cbd5e1"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
                {statusData.map((d) => (
                  <div key={d.key} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: STATUS_CHART_COLORS[d.key] }}
                    />
                    {d.name}
                    <span className="text-slate-400">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[220px] border border-dashed border-blue-200 bg-blue-50/40 rounded-2xl flex flex-col items-center justify-center text-center px-6">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center mb-3">
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Hành trình của bạn bắt đầu từ đây</p>
              <p className="text-xs text-slate-500 mt-1 mb-2.5">Lưu việc làm đầu tiên để theo dõi tiến độ ứng tuyển.</p>
              <Link
                href="/jobs"
                className="text-xs text-blue-700 font-semibold hover:underline inline-flex items-center gap-1"
              >
                Khám phá việc làm <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="font-semibold text-slate-900">Bắt đầu nhanh</h2>
          <p className="text-xs text-slate-400 mt-0.5 mb-6">Truy cập các tính năng phổ biến</p>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {quickActions.map(({ href, Icon, label, desc, tint }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-4 py-4 group cursor-pointer"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 group-hover:text-slate-900">{label}</div>
                  <div className="text-xs text-slate-400">{desc}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("vica:open-chat"))}
              className="w-full flex items-center gap-4 py-4 group cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
                <MessageSquare className="w-[18px] h-[18px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 group-hover:text-slate-900">Hỏi AI tư vấn</div>
                <div className="text-xs text-slate-400">Chiến lược tìm việc cá nhân hoá — ngay trên trang này</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
