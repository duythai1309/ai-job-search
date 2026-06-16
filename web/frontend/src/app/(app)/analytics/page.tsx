"use client";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import {
  TrendingUp, Building2, DollarSign, MapPin,
  RefreshCw, Lightbulb, BarChart2,
} from "lucide-react";

const CHART_COLORS = ["#0f172a", "#475569", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0"];

interface MarketData {
  top_skills: { skill: string; count: number }[];
  top_sectors: { sector: string; count: number }[];
  salary_ranges: { range: string; count: number }[];
  employment_types: { type: string; count: number }[];
  top_locations: { location: string; count: number }[];
  insights: string[];
}

interface JobSummary {
  total_jobs: number;
  by_source: Record<string, number>;
}

function SectionCard({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <div className="flex items-center gap-2.5 mb-5">
        <Icon className="w-4 h-4 text-slate-400" />
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const [market, setMarket] = useState<MarketData | null>(null);
  const [summary, setSummary] = useState<JobSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [cached, sum] = await Promise.all([
          api.get<{ data?: MarketData }[]>("/analytics/market").catch(() => []),
          api
            .get<JobSummary>("/analytics/jobs/summary")
            .catch(() => ({ total_jobs: 0, by_source: {} })),
        ]);
        setSummary(sum);
        const latestData = (cached as { data?: MarketData }[]).find((c) => c.data?.top_skills);
        if (latestData?.data) setMarket(latestData.data as MarketData);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function refresh() {
    setRefreshing(true);
    try {
      const result = await api.post<MarketData>("/analytics/market/refresh");
      setMarket(result);
      toast.success("Đã cập nhật dữ liệu thị trường");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Không thể phân tích — cần có dữ liệu việc làm";
      toast.error(msg);
    } finally {
      setRefreshing(false);
    }
  }

  const sourceData = summary
    ? Object.entries(summary.by_source).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="px-8 lg:px-12 py-10 max-w-screen-2xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Thị trường</h1>
          <p className="text-slate-400 mt-1.5 text-sm">Xu hướng tuyển dụng Việt Nam theo thời gian thực</p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Đang phân tích..." : "Cập nhật phân tích"}
        </button>
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-y border-slate-200 divide-x divide-slate-200 mb-10">
          <div className="px-6 py-6 first:pl-0">
            <div className="text-3xl font-bold text-slate-900 tabular-nums">
              {summary.total_jobs.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">Tổng việc làm đang có</div>
          </div>
          {Object.entries(summary.by_source).map(([source, count]) => (
            <div key={source} className="px-6 py-6">
              <div className="text-3xl font-bold text-slate-900 tabular-nums">
                {(count as number).toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 mt-1 capitalize">{source}</div>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : !market ? (
        <div className="text-center py-28 border border-dashed border-slate-200 rounded-2xl">
          <BarChart2 className="w-6 h-6 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 text-base mb-1">Chưa có dữ liệu phân tích</h3>
          <p className="text-sm text-slate-400 mb-6">
            Tìm kiếm việc làm trước để có dữ liệu, sau đó nhấn &quot;Cập nhật phân tích&quot;
          </p>
          <button
            onClick={refresh}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Phân tích ngay
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Insights banner */}
          {market.insights && market.insights.length > 0 && (
            <div className="bg-slate-900 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2.5 mb-3">
                <Lightbulb className="w-4 h-4 text-white/70" />
                <h2 className="font-semibold">Nhận định thị trường</h2>
              </div>
              <ul className="space-y-2">
                {market.insights.map((insight, i) => (
                  <li key={i} className="flex gap-2.5 text-white/80 text-sm leading-relaxed">
                    <span className="shrink-0 text-white/40">›</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {market.top_skills?.length > 0 && (
              <SectionCard title="Kỹ năng được tìm nhiều nhất" icon={TrendingUp}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={market.top_skills.slice(0, 8)} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="skill" type="category" tick={{ fontSize: 11, fill: "#64748b" }} width={100} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                      cursor={{ fill: "#f8fafc" }}
                    />
                    <Bar dataKey="count" fill="#0f172a" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>
            )}

            {market.top_sectors?.length > 0 && (
              <SectionCard title="Ngành tuyển dụng nhiều nhất" icon={Building2}>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={market.top_sectors.slice(0, 6)}
                      dataKey="count"
                      nameKey="sector"
                      cx="50%" cy="50%"
                      outerRadius={88}
                      paddingAngle={3}
                    >
                      {market.top_sectors.slice(0, 6).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                      formatter={(v: number, n: string) => [v, n]}
                    />
                    <Legend
                      formatter={(v) => (
                        <span className="text-xs text-slate-500">{v}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </SectionCard>
            )}

            {market.salary_ranges?.length > 0 && (
              <SectionCard title="Phân bổ mức lương" icon={DollarSign}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={market.salary_ranges}>
                    <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                      cursor={{ fill: "#f8fafc" }}
                    />
                    <Bar dataKey="count" fill="#475569" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>
            )}

            {market.top_locations?.length > 0 && (
              <SectionCard title="Địa điểm tuyển dụng" icon={MapPin}>
                <div className="space-y-3">
                  {market.top_locations.slice(0, 6).map((loc, i) => {
                    const max = market.top_locations[0]?.count || 1;
                    const pct = Math.round((loc.count / max) * 100);
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-slate-700 font-medium">{loc.location}</span>
                          <span className="text-slate-400 text-xs font-medium">{loc.count.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-900 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
