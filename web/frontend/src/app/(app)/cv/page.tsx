"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { CV } from "@/lib/types";
import toast from "react-hot-toast";

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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CV của tôi</h1>
          <p className="text-gray-500 mt-1">Quản lý và tạo CV thông minh với AI</p>
        </div>
        <button
          onClick={createBlankCV}
          disabled={creating}
          className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition"
        >
          {creating ? "Đang tạo..." : "+ Tạo CV mới"}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />
          ))}
        </div>
      ) : cvs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📄</div>
          <h3 className="font-semibold text-gray-600 text-lg mb-2">Chưa có CV nào</h3>
          <p className="text-sm mb-6">Tạo CV đầu tiên của bạn và để AI giúp cải thiện</p>
          <button
            onClick={createBlankCV}
            className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl font-medium transition"
          >
            Tạo CV ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cvs.map((cv) => (
            <div key={cv.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-xl">
                  📄
                </div>
                {cv.is_master && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-lg font-medium">
                    CV chính
                  </span>
                )}
              </div>

              <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{cv.title}</h3>
              {cv.target_role && (
                <p className="text-sm text-gray-500 mb-1">🎯 {cv.target_role}</p>
              )}
              {cv.target_company && (
                <p className="text-sm text-gray-500 mb-3">🏢 {cv.target_company}</p>
              )}

              <p className="text-xs text-gray-400 mb-4">
                Cập nhật: {new Date(cv.updated_at).toLocaleDateString("vi-VN")}
              </p>

              <div className="flex gap-2">
                <Link
                  href={`/cv/${cv.id}`}
                  className="flex-1 text-center text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white py-2 rounded-lg transition"
                >
                  Chỉnh sửa
                </Link>
                <button
                  onClick={() => api.downloadPdf(cv.id)}
                  className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-600"
                  title="Tải PDF"
                >
                  ⬇
                </button>
                <button
                  onClick={() => deleteCv(cv.id)}
                  className="px-3 py-2 border border-red-100 rounded-lg hover:bg-red-50 transition text-red-400"
                  title="Xóa"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
