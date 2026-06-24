"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Application, STATUS_LABELS } from "@/lib/types";
import toast from "react-hot-toast";
import clsx from "clsx";
import { ClipboardList, LayoutGrid, List, ExternalLink, Trash2, GripVertical } from "lucide-react";

const STATUSES = ["bookmarked", "applied", "interview", "offer", "rejected"] as const;

// Aligned with the dashboard pipeline palette for a consistent status language.
const STATUS_DOT: Record<string, string> = {
  bookmarked: "bg-blue-300",
  applied:    "bg-blue-600",
  interview:  "bg-amber-500",
  offer:      "bg-emerald-500",
  rejected:   "bg-rose-400",
  withdrawn:  "bg-slate-300",
};

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="mt-2.5 flex items-center gap-2">
      <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${score}%` }} />
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
  draggingId,
  onStartDrag,
  onEndDrag,
  onMoveCard,
  onStatusChange,
  onDelete,
}: {
  status: string;
  apps: Application[];
  draggingId: string | null;
  onStartDrag: (id: string) => void;
  onEndDrag: () => void;
  onMoveCard: (id: string, status: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const label = STATUS_LABELS[status] || status;
  const [isOver, setIsOver] = useState(false);
  const dragging = draggingId != null;

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsOver(false);
    const id = e.dataTransfer.getData("text/plain");
    if (id) onMoveCard(id, status);
  }

  return (
    <div
      className="flex flex-col min-w-0"
      onDragOver={(e) => { if (dragging) { e.preventDefault(); setIsOver(true); } }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsOver(false); }}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className={clsx(
        "flex items-center gap-2 px-1 pb-2 border-b mb-2",
        apps.length > 0 ? "border-slate-200" : "border-slate-100"
      )}>
        <span className={clsx("w-2 h-2 rounded-full shrink-0", STATUS_DOT[status])} />
        <span className={clsx("text-xs font-semibold flex-1", apps.length > 0 ? "text-slate-700" : "text-slate-400")}>{label}</span>
        <span className="text-xs text-slate-400 tabular-nums">{apps.length}</span>
      </div>

      {/* Cards / drop zone — only reserves space while dragging so empty
          columns stay compact when there are few applications. */}
      <div
        className={clsx(
          "space-y-2.5 rounded-xl transition-colors p-1 -m-1",
          dragging && "min-h-[64px]",
          isOver && "bg-blue-50 ring-2 ring-blue-300 ring-inset"
        )}
      >
        {apps.map((app) => (
          <div
            key={app.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", app.id);
              e.dataTransfer.effectAllowed = "move";
              onStartDrag(app.id);
            }}
            onDragEnd={onEndDrag}
            className={clsx(
              "group bg-white rounded-xl border border-slate-200 p-3.5 transition-all cursor-grab active:cursor-grabbing",
              draggingId === app.id ? "opacity-40 border-slate-400 shadow-sm" : "hover:border-slate-300 hover:shadow-sm"
            )}
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
              <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                onClick={(e) => e.stopPropagation()}
                draggable={false}
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
                  draggable={false}
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

        {apps.length === 0 && dragging && (
          <div
            className={clsx(
              "py-8 text-center text-xs border border-dashed rounded-xl transition-colors",
              isOver ? "border-blue-400 text-blue-500" : "border-slate-200 text-slate-400"
            )}
          >
            Thả vào đây
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
  const [draggingId, setDraggingId] = useState<string | null>(null);

  async function load() {
    try {
      const data = await api.get<Application[]>("/applications/");
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

  function moveCard(id: string, status: string) {
    setDraggingId(null);
    const app = apps.find((a) => a.id === id);
    if (!app || app.status === status) return;
    updateStatus(id, status);
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
    <div className="max-w-screen-2xl">
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
              view === "kanban" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Kanban
          </button>
          <button
            onClick={() => setView("table")}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              view === "table" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <List className="w-3.5 h-3.5" /> Bảng
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-5 gap-4 max-w-6xl">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-3 animate-pulse min-w-0">
              <div className="h-4 bg-slate-100 rounded w-2/3" />
              <div className="h-28 bg-slate-100 rounded-xl" />
              <div className="h-28 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-blue-200 bg-blue-50/40 rounded-2xl px-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-6 h-6 text-blue-600" />
          </div>
          <p className="font-semibold text-slate-700">Bắt đầu theo dõi hành trình ứng tuyển</p>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Lưu việc làm bạn quan tâm vào đây để quản lý từ lúc nộp đến khi nhận offer.
          </p>
          <a
            href="/jobs"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            Khám phá việc làm
          </a>
        </div>
      ) : view === "kanban" ? (
        <div className="overflow-x-auto pb-4 scrollbar-thin">
          <div className="grid grid-cols-5 gap-4 items-start min-w-[1200px] pb-2">
            {STATUSES.map((s) => (
              <KanbanColumn
                key={s}
                status={s}
                apps={byStatus[s]}
                draggingId={draggingId}
                onStartDrag={setDraggingId}
                onEndDrag={() => setDraggingId(null)}
                onMoveCard={moveCard}
                onStatusChange={updateStatus}
                onDelete={deleteApp}
              />
            ))}
          </div>
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
