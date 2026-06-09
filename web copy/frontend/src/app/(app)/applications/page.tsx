"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Application, STATUS_LABELS, STATUS_COLORS } from "@/lib/types";
import toast from "react-hot-toast";
import clsx from "clsx";

const STATUSES = ["bookmarked", "applied", "interview", "offer", "rejected", "withdrawn"] as const;

function KanbanColumn({
  status,
  apps,
  onStatusChange,
}: {
  status: string;
  apps: Application[];
  onStatusChange: (id: string, status: string) => void;
}) {
  const label = STATUS_LABELS[status] || status;
  const colorClass = STATUS_COLORS[status] || "bg-gray-100 text-gray-600";

  return (
    <div className="bg-gray-50 rounded-2xl p-4 min-w-[230px] flex-1">
      <div className={clsx("inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold mb-4", colorClass)}>
        {label}
        <span className="bg-white/60 rounded-full w-5 h-5 flex items-center justify-center text-xs">
          {apps.length}
        </span>
      </div>

      <div className="space-y-3">
        {apps.map((app) => (
          <div key={app.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
              {app.role_title || app.job_postings?.title || "—"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {app.company_name || app.job_postings?.company || "—"}
            </p>

            {app.fit_score && (
              <div className="mt-2 flex items-center gap-1.5">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={clsx(
                      "h-full rounded-full",
                      app.fit_score >= 75 ? "bg-green-500" : app.fit_score >= 50 ? "bg-yellow-400" : "bg-red-400"
                    )}
                    style={{ width: `${app.fit_score}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{app.fit_score}%</span>
              </div>
            )}

            {app.applied_at && (
              <p className="text-xs text-gray-400 mt-2">
                Ứng tuyển: {new Date(app.applied_at).toLocaleDateString("vi-VN")}
              </p>
            )}

            <div className="mt-3">
              <select
                value={app.status}
                onChange={(e) => onStatusChange(app.id, e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            {app.source_url && (
              <a
                href={app.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-600 hover:underline mt-2 inline-block"
              >
                Xem bài đăng ↗
              </a>
            )}
          </div>
        ))}

        {apps.length === 0 && (
          <div className="text-center py-6 text-gray-300 text-xs">Không có</div>
        )}
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "table">("kanban");

  async function load() {
    try {
      const data = await api.get<Application[]>("/applications");
      setApps(data);
    } catch {
      toast.error("Không tải được danh sách ứng tuyển");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) {
    try {
      await api.patch(`/applications/${id}`, { status });
      setApps((prev) => prev.map((a) => a.id === id ? { ...a, status: status as Application["status"] } : a));
      toast.success("Đã cập nhật trạng thái");
    } catch {
      toast.error("Không cập nhật được");
    }
  }

  async function deleteApp(id: string) {
    if (!confirm("Xóa đơn ứng tuyển này?")) return;
    await api.delete(`/applications/${id}`);
    setApps((prev) => prev.filter((a) => a.id !== id));
    toast.success("Đã xóa");
  }

  const byStatus = STATUSES.reduce((acc, s) => {
    acc[s] = apps.filter((a) => a.status === s);
    return acc;
  }, {} as Record<string, Application[]>);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Theo dõi ứng tuyển</h1>
          <p className="text-gray-500 mt-1">{apps.length} đơn ứng tuyển</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("kanban")}
            className={clsx("px-4 py-2 rounded-lg text-sm font-medium transition", view === "kanban" ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
          >
            Kanban
          </button>
          <button
            onClick={() => setView("table")}
            className={clsx("px-4 py-2 rounded-lg text-sm font-medium transition", view === "table" ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
          >
            Bảng
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-4 min-w-[230px] h-64 animate-pulse" />
          ))}
        </div>
      ) : view === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((s) => (
            <KanbanColumn key={s} status={s} apps={byStatus[s]} onStatusChange={updateStatus} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Vị trí", "Công ty", "Trạng thái", "Độ phù hợp", "Ngày ứng tuyển", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => (
                <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {app.role_title || app.job_postings?.title || "—"}
                  </td>
                  <td className="px-5 py-4 text-gray-600">{app.company_name || app.job_postings?.company || "—"}</td>
                  <td className="px-5 py-4">
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value)}
                      className={clsx("px-2.5 py-1 rounded-lg text-xs font-medium border-0 focus:ring-1 focus:ring-brand-500 cursor-pointer", STATUS_COLORS[app.status])}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    {app.fit_score ? (
                      <span className={clsx("font-semibold", app.fit_score >= 75 ? "text-green-600" : app.fit_score >= 50 ? "text-yellow-600" : "text-red-500")}>
                        {app.fit_score}%
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {app.applied_at ? new Date(app.applied_at).toLocaleDateString("vi-VN") : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => deleteApp(app.id)} className="text-gray-300 hover:text-red-500 transition text-xs">
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {apps.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">📋</div>
              <p className="font-medium">Chưa có đơn ứng tuyển nào</p>
              <p className="text-sm mt-1">Tìm việc và lưu vào tracker để bắt đầu</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
