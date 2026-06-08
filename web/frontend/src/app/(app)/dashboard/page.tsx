"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { api } from "@/lib/api";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/types";

interface Stats {
  total: number;
  by_status: Record<string, number>;
  active: number;
  success_rate: number;
  jobs_explored: number;
  cvs_created: number;
  avg_fit_score: number | null;
}

const STATUS_CHART_COLORS: Record<string, string> = {
  bookmarked: "#94a3b8",
  applied: "#60a5fa",
  interview: "#fb923c",
  offer: "#4ade80",
  rejected: "#f87171",
  withdrawn: "#d1d5db",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [activity, appStats] = await Promise.all([
          api.get<{ jobs_explored: number; cvs_created: number; avg_fit_score: number | null }>("/analytics/user/activity"),
          api.get<{ total: number; by_status: Record<string, number>; active: number; success_rate: number }>("/applications/stats"),
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
    { label: "Tổng đơn ứng tuyển", value: stats?.total ?? "—", icon: "📋", color: "bg-blue-50 text-blue-600" },
    { label: "Đang tiến hành", value: stats?.active ?? "—", icon: "⚡", color: "bg-orange-50 text-orange-600" },
    { label: "Việc đã khám phá", value: stats?.jobs_explored ?? "—", icon: "🔍", color: "bg-purple-50 text-purple-600" },
    { label: "CV đã tạo", value: stats?.cvs_created ?? "—", icon: "📄", color: "bg-green-50 text-green-600" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
        <p className="text-gray-500 mt-1">Theo dõi tiến trình tìm việc của bạn</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {metrics.map((m) => (
              <div key={m.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-lg ${m.color} mb-3`}>
                  {m.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900">{m.value}</div>
                <div className="text-sm text-gray-500 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-4">Pipeline ứng tuyển</h2>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.key} fill={STATUS_CHART_COLORS[entry.key] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [value, name]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-sm">Chưa có đơn ứng tuyển nào</p>
                    <Link href="/jobs" className="text-brand-600 text-sm hover:underline mt-1 inline-block">
                      Tìm việc ngay →
                    </Link>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {statusData.map((d) => (
                  <div key={d.key} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_CHART_COLORS[d.key] }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-4">Bắt đầu nhanh</h2>
              <div className="space-y-3">
                {[
                  { href: "/jobs", icon: "🔍", label: "Tìm kiếm việc làm mới", desc: "Tổng hợp từ 4 cổng VN" },
                  { href: "/cv", icon: "📄", label: "Tạo CV mới", desc: "AI phân tích và gợi ý" },
                  { href: "/chat", icon: "💬", label: "Hỏi AI tư vấn", desc: "Chiến lược tìm việc" },
                  { href: "/analytics", icon: "📈", label: "Xem thị trường", desc: "Kỹ năng & mức lương hot" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition group"
                  >
                    <div className="text-2xl">{item.icon}</div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 group-hover:text-brand-600 transition">{item.label}</div>
                      <div className="text-xs text-gray-400">{item.desc}</div>
                    </div>
                    <div className="ml-auto text-gray-300 group-hover:text-brand-400 transition">→</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {stats?.avg_fit_score && (
            <div className="bg-gradient-to-r from-brand-500 to-indigo-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Điểm phù hợp trung bình</h3>
                  <p className="text-white/70 text-sm mt-1">Dựa trên {stats.total} lần đánh giá AI</p>
                </div>
                <div className="text-5xl font-bold">{stats.avg_fit_score}%</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
