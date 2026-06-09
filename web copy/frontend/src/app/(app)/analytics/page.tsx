"use client";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"];

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
          api.get<JobSummary>("/analytics/jobs/summary").catch(() => ({ total_jobs: 0, by_source: {} })),
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
    } catch (e: any) {
      toast.error(e.message || "Không thể phân tích — cần có dữ liệu việc làm");
    } finally {
      setRefreshing(false);
    }
  }

  const sourceData = summary
    ? Object.entries(summary.by_source).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thị trường việc làm</h1>
          <p className="text-gray-500 mt-1">Phân tích xu hướng tuyển dụng Việt Nam</p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition"
        >
          {refreshing ? "Đang phân tích..." : "🔄 Cập nhật phân tích"}
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-brand-600">{summary.total_jobs.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1">Tổng việc làm đang có</div>
          </div>
          {Object.entries(summary.by_source).map(([source, count]) => (
            <div key={source} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-gray-700">{(count as number).toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-1 capitalize">{source}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : !market ? (
        <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4">📈</div>
          <h3 className="font-semibold text-gray-600 text-lg mb-2">Chưa có dữ liệu phân tích</h3>
          <p className="text-sm mb-6">
            Tìm kiếm việc làm trước để có dữ liệu, sau đó nhấn "Cập nhật phân tích"
          </p>
          <button
            onClick={refresh}
            className="bg-brand-500 text-white px-6 py-2.5 rounded-xl font-medium text-sm"
          >
            Phân tích ngay
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {market.insights && market.insights.length > 0 && (
            <div className="bg-gradient-to-r from-brand-500 to-indigo-600 rounded-2xl p-6 text-white">
              <h2 className="font-bold text-lg mb-3">💡 Nhận định thị trường</h2>
              <ul className="space-y-2">
                {market.insights.map((insight, i) => (
                  <li key={i} className="flex gap-2 text-white/90 text-sm">
                    <span className="shrink-0">→</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {market.top_skills?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-900 mb-4">🔥 Kỹ năng được tìm nhiều nhất</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={market.top_skills.slice(0, 8)} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="skill" type="category" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {market.top_sectors?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-900 mb-4">🏭 Ngành tuyển dụng nhiều nhất</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={market.top_sectors.slice(0, 6)}
                      dataKey="count"
                      nameKey="sector"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {market.top_sectors.slice(0, 6).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number, n: string) => [v, n]} />
                    <Legend formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {market.salary_ranges?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-900 mb-4">💰 Phân bổ mức lương</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={market.salary_ranges}>
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {market.top_locations?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-900 mb-4">📍 Địa điểm tuyển dụng</h2>
                <div className="space-y-2.5">
                  {market.top_locations.slice(0, 6).map((loc, i) => {
                    const max = market.top_locations[0]?.count || 1;
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{loc.location}</span>
                          <span className="text-gray-500 font-medium">{loc.count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-400 rounded-full"
                            style={{ width: `${(loc.count / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
