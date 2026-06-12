"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Application, STATUS_LABELS } from "@/lib/types";
import toast from "react-hot-toast";
import clsx from "clsx";
import { ClipboardList, LayoutGrid, List, ExternalLink, Trash2 } from "lucide-react";

const STATUSES = ["bookmarked", "applied", "interview", "offer", "rejected", "withdrawn"] as const;

const STATUS_DOT: Record<string, string> = {
  bookmarked: "bg-slate-300",
  applied:    "bg-slate-900",
  interview:  "bg-amber-400",
  offer:      "bg-emerald-500",
  rejected:   "bg-red-400",
  withdrawn:  "bg-slate-200",
};

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="mt-2.5 flex items-center gap-2">
      <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${score}%` }} />
      </div>
      <span className="text-[11px] font-semibold text-slate-600 tabular-nums">{score}%</span>
    </div>
  );
}

function CompanyInitials({ name }: { name: string }) {
  const init = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
      {init || "?"}
    </div>
  );
}

function KanbanColumn({
  status,
  apps,
  onStatusChange,
  onDelete,
}: {
  status: string;
  apps: Application[];
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const label = STATUS_LABELS[status] || status;

  return (
    <div className="min-w-[230px] flex-1 flex flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2 px-1 pb-3 border-b border-slate-200 mb-3">
        <span className={clsx("w-2 h-2 rounded-full shrink-0", STATUS_DOT[status])} />
        <span className="text-xs font-semibold text-slate-700 flex-1">{label}</span>
        <span className="text-xs text-slate-400 tabular-nums">{apps.length}</span>
      </div>

      {/* Cards */}
      <div className="space-y-2.5 flex-1">
        {apps.map((app) => (
          <div
            key={app.id}
            className="bg-white rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start gap-2.5 mb-1">
              <CompanyInitials name={app.company_name || app.job_postings?.company || "?"} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-xs leading-tight line-clamp-1">
                  {app.role_title || app.job_postings?.title || "—"}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {app.company_name || app.job_postings?.company || "—"}
                </p>
              </div>
            </div>

            {app.fit_score != null && <ScoreBar score={app.fit_score} />}

            {app.applied_at && (
              <p className="text-[11px] text-slate-300 mt-2">
                {new Date(app.applied_at).toLocaleDateString("vi-VN")}
              </p>
            )}

            <div className="flex items-center gap-1.5 mt-3">
              <select
                value={app.status}
                onChange={(e) => onStatusChange(app.id, e.target.value)}
                className="flex-1 text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-slate-400 cursor-pointer bg-white text-slate-700"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              {app.source_url && (
                <a
                  href={app.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-400 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <button
                onClick={() => onDelete(app.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-300 hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {apps.length === 0 && (
          <div className="py-8 text-center text-slate-300 text-xs border border-dashed border-slate-200 rounded-xl">
            Trống
          </div>
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
      setApps((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: status as Application["status"] } : a))
      );
      toast.success("Đã cập nhật");
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
    <div className="px-8 lg:px-12 py-10 max-w-screen-2xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Ứng tuyển</h1>
          <p className="text-slate-400 mt-1.5 text-sm">
            {apps.length > 0 ? `${apps.length} đơn đang theo dõi` : "Quản lý toàn bộ hành trình ứng tuyển"}
          </p>
        </div>
        <div className="flex items-center gap-1 border border-slate-200 p-1 rounded-xl bg-white">
          <button
            onClick={() => setView("kanban")}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              view === "kanban" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Kanban
          </button>
          <button
            onClick={() => setView("table")}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              view === "table" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <List className="w-3.5 h-3.5" /> Bảng
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex gap-6 overflow-x-auto">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="min-w-[230px] flex-1 space-y-3 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-2/3" />
              <div className="h-28 bg-slate-100 rounded-xl" />
              <div className="h-28 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-28 border border-dashed border-slate-200 rounded-2xl">
          <ClipboardList className="w-6 h-6 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Chưa có đơn ứng tuyển nào</p>
          <p className="text-sm text-slate-400 mt-1">
            Tìm việc và lưu vào tracker để bắt đầu theo dõi
          </p>
        </div>
      ) : view === "kanban" ? (
        <div className="flex gap-6 overflow-x-auto pb-4">
          {STATUSES.map((s) => (
            <KanbanColumn
              key={s}
              status={s}
              apps={byStatus[s]}
              onStatusChange={updateStatus}
              onDelete={deleteApp}
            />
          ))}
        </div>
      ) : (
        <div className="border-y border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {["Vị trí", "Công ty", "Trạng thái", "Độ phù hợp", "Ngày ứng tuyển", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide first:pl-1"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => (
                <tr key={app.id} className="border-b border-slate-200 last:border-b-0 hover:bg-white transition-colors">
                  <td className="px-5 py-4 font-medium text-slate-900 text-sm first:pl-1">
                    {app.role_title || app.job_postings?.title || "—"}
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-sm">
                    {app.company_name || app.job_postings?.company || "—"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="inline-flex items-center gap-2">
                      <span className={clsx("w-2 h-2 rounded-full", STATUS_DOT[app.status])} />
                      <select
                        value={app.status}
                        onChange={(e) => updateStatus(app.id, e.target.value)}
                        className="text-xs font-medium text-slate-700 bg-transparent border-0 outline-none focus:ring-0 cursor-pointer"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {app.fit_score != null ? (
                      <span className="text-sm font-semibold text-slate-900 tabular-nums">
                        {app.fit_score}%
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-sm">
                    {app.applied_at ? new Date(app.applied_at).toLocaleDateString("vi-VN") : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {app.source_url && (
                        <a
                          href={app.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-300 hover:text-slate-900 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => deleteApp(app.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
