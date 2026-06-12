"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { CV } from "@/lib/types";
import toast from "react-hot-toast";
import { FileText, Plus, Download, Trash2, Target, Building2 } from "lucide-react";

export default function CVListPage() {
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.get<CV[]>("/cv/").then(setCvs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function createBlankCV() {
    setCreating(true);
    try {
      const cv = await api.post<CV>("/cv/", {
        title: "CV mới",
        is_master: false,
        sections: [
          { id: "profile", type: "custom", title: "Mục tiêu nghề nghiệp", content: { text: "" }, sort_order: 0 },
          { id: "exp", type: "experience", title: "Kinh nghiệm làm việc", content: [], sort_order: 1 },
          { id: "edu", type: "education", title: "Học vấn", content: [], sort_order: 2 },
          { id: "skills", type: "skills", title: "Kỹ năng", content: [], sort_order: 3 },
        ],
      });
      toast.success("Đã tạo CV mới");
      window.location.href = `/cv/${cv.id}`;
    } catch {
      toast.error("Không tạo được CV");
    } finally {
      setCreating(false);
    }
  }

  async function deleteCv(id: string) {
    if (!confirm("Xóa CV này?")) return;
    await api.delete(`/cv/${id}`);
    setCvs((prev) => prev.filter((c) => c.id !== id));
    toast.success("Đã xóa CV");
  }

  return (
    <div className="px-8 lg:px-12 py-10 max-w-screen-2xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">CV của tôi</h1>
          <p className="text-slate-400 mt-1.5 text-sm">Quản lý và tạo CV thông minh với AI</p>
        </div>
        <button
          onClick={createBlankCV}
          disabled={creating}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {creating ? "Đang tạo..." : "Tạo CV mới"}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl h-48 animate-pulse" />
          ))}
        </div>
      ) : cvs.length === 0 ? (
        <div className="text-center py-28 border border-dashed border-slate-200 rounded-2xl">
          <FileText className="w-6 h-6 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Chưa có CV nào</p>
          <p className="text-sm text-slate-400 mt-1 mb-6">
            Tạo CV đầu tiên của bạn và để AI giúp cải thiện
          </p>
          <button
            onClick={createBlankCV}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
          >
            Tạo CV ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {cvs.map((cv) => (
            <div
              key={cv.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-slate-300 transition-colors group flex flex-col"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-slate-600" />
                </div>
                {cv.is_master && (
                  <span className="text-[11px] border border-slate-900 text-slate-900 px-2.5 py-1 rounded-full font-semibold">
                    CV chính
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-slate-900 line-clamp-1">{cv.title}</h3>
              <div className="mt-1.5 space-y-1 text-sm text-slate-500">
                {cv.target_role && (
                  <p className="flex items-center gap-1.5 line-clamp-1">
                    <Target className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {cv.target_role}
                  </p>
                )}
                {cv.target_company && (
                  <p className="flex items-center gap-1.5 line-clamp-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {cv.target_company}
                  </p>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-3 mb-5">
                Cập nhật {new Date(cv.updated_at).toLocaleDateString("vi-VN")}
              </p>

              <div className="flex gap-2 mt-auto">
                <Link
                  href={`/cv/${cv.id}`}
                  className="flex-1 text-center text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl transition-colors"
                >
                  Chỉnh sửa
                </Link>
                <button
                  onClick={() => api.downloadPdf(cv.id)}
                  className="w-9 flex items-center justify-center border border-slate-200 rounded-xl hover:border-slate-400 transition-colors text-slate-500 hover:text-slate-900 cursor-pointer"
                  title="Tải PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteCv(cv.id)}
                  className="w-9 flex items-center justify-center border border-slate-200 rounded-xl hover:border-red-200 hover:bg-red-50 transition-colors text-slate-400 hover:text-red-500 cursor-pointer"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
