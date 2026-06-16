"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { CV, CVSuggestion } from "@/lib/types";
import toast from "react-hot-toast";
import clsx from "clsx";

const SUGGESTION_TYPE_LABELS: Record<string, string> = {
  weakness: "Điểm yếu",
  keyword: "Thiếu từ khóa",
  reframe: "Cách diễn đạt",
  add: "Bổ sung",
  remove: "Loại bỏ",
};

const SUGGESTION_TYPE_COLORS: Record<string, string> = {
  weakness: "bg-red-50 border-red-200 text-red-700",
  keyword: "bg-yellow-50 border-yellow-200 text-yellow-700",
  reframe: "bg-blue-50 border-blue-200 text-blue-700",
  add: "bg-green-50 border-green-200 text-green-700",
  remove: "bg-gray-50 border-gray-200 text-gray-600",
};

export default function CVEditorPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job");

  const [cv, setCv] = useState<CV | null>(null);
  const [suggestions, setSuggestions] = useState<CVSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [loadingCv, setLoadingCv] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "suggestions" | "preview">("editor");
  const [previewHtml, setPreviewHtml] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const cvData = await api.get<CV>(`/cv/${id}`);
        setCv(cvData);
        setPreviewHtml(cvData.html_content || "");
        const sug = await api.get<CVSuggestion[]>(`/cv/${id}/suggestions`);
        setSuggestions(sug);
      } catch {
        toast.error("Không tải được CV");
      } finally {
        setLoadingCv(false);
      }
    }
    load();
  }, [id]);

  async function analyze() {
    setAnalyzing(true);
    try {
      const params = jobId ? `?job_posting_id=${jobId}` : "";
      const result = await api.post<{ suggestions: CVSuggestion[] }>(`/cv/${id}/analyze${params}`);
      setSuggestions(result.suggestions || []);
      setActiveTab("suggestions");
      toast.success(`Tìm thấy ${result.suggestions.length} gợi ý cải thiện`);
    } catch (e: any) {
      toast.error(e.message || "Có lỗi khi phân tích");
    } finally {
      setAnalyzing(false);
    }
  }

  async function applySelected() {
    if (selectedSuggestions.size === 0) return;
    setApplying(true);
    try {
      await api.post(`/cv/${id}/suggestions/apply`, {
        suggestion_ids: Array.from(selectedSuggestions),
      });
      setSuggestions((prev) => prev.filter((s) => !selectedSuggestions.has(s.id)));
      setSelectedSuggestions(new Set());
      toast.success("Đã áp dụng các gợi ý");
      const updated = await api.get<CV>(`/cv/${id}`);
      setCv(updated);
      setPreviewHtml(updated.html_content || "");
    } catch {
      toast.error("Không áp dụng được");
    } finally {
      setApplying(false);
    }
  }

  function toggleSuggestion(id: string) {
    setSelectedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function updateField(field: string, value: string) {
    if (!cv) return;
    const updated = { ...cv, [field]: value };
    setCv(updated as CV);
    try {
      await api.patch(`/cv/${id}`, { [field]: value });
      if (field === "profile_statement" || field === "target_role") {
        const refreshed = await api.get<CV>(`/cv/${id}`);
        setPreviewHtml(refreshed.html_content || "");
      }
    } catch { /* silent */ }
  }

  if (loadingCv) {
    return <div className="p-8"><div className="h-64 bg-gray-100 rounded-2xl animate-pulse" /></div>;
  }
  if (!cv) return <div className="p-8 text-gray-400">Không tìm thấy CV</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-100 bg-white px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900">{cv.title}</h1>
          {cv.target_role && <p className="text-sm text-gray-500">{cv.target_role}</p>}
        </div>
        <div className="flex gap-3">
          <button
            onClick={analyze}
            disabled={analyzing}
            className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            {analyzing ? "Đang phân tích..." : "🤖 Phân tích AI"}
          </button>
          <button
            onClick={() => api.downloadPdf(id)}
            className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            ⬇ Xuất PDF
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-100 bg-white px-8">
        {[
          { id: "editor", label: "✏️ Chỉnh sửa" },
          { id: "suggestions", label: `💡 Gợi ý${suggestions.length > 0 ? ` (${suggestions.length})` : ""}` },
          { id: "preview", label: "👁 Xem trước" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={clsx(
              "px-5 py-3 text-sm font-medium border-b-2 transition",
              activeTab === tab.id
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {activeTab === "editor" && (
          <div className="max-w-2xl space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tiêu đề CV</label>
              <input
                value={cv.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vị trí mục tiêu</label>
              <input
                value={cv.target_role || ""}
                onChange={(e) => updateField("target_role", e.target.value)}
                placeholder="Ví dụ: Frontend Developer, Data Analyst..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Công ty mục tiêu</label>
              <input
                value={cv.target_company || ""}
                onChange={(e) => updateField("target_company", e.target.value)}
                placeholder="Tên công ty..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mục tiêu nghề nghiệp</label>
              <textarea
                value={cv.profile_statement || ""}
                onChange={(e) => updateField("profile_statement", e.target.value)}
                rows={5}
                placeholder="Mô tả ngắn gọn về mục tiêu và điểm mạnh của bạn..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-blue-700 text-sm font-medium mb-1">💡 Gợi ý</p>
              <p className="text-blue-600 text-sm">
                Dữ liệu học vấn, kinh nghiệm và kỹ năng được lấy từ hồ sơ của bạn.
                Hãy{" "}
                <a href="/profile" className="underline">cập nhật hồ sơ</a>{" "}
                để CV phản ánh đúng thông tin nhất.
              </p>
            </div>
          </div>
        )}

        {activeTab === "suggestions" && (
          <div className="max-w-2xl">
            {suggestions.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-4">💡</div>
                <h3 className="font-semibold text-gray-600 text-lg mb-2">Chưa có gợi ý nào</h3>
                <p className="text-sm mb-4">Nhấn "Phân tích AI" để nhận gợi ý cải thiện CV</p>
                <button
                  onClick={analyze}
                  disabled={analyzing}
                  className="bg-brand-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium"
                >
                  {analyzing ? "Đang phân tích..." : "Phân tích ngay"}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-600 text-sm">{suggestions.length} gợi ý · {selectedSuggestions.size} đã chọn</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedSuggestions(new Set(suggestions.map((s) => s.id)))}
                      className="text-sm text-brand-600 hover:underline"
                    >
                      Chọn tất cả
                    </button>
                    {selectedSuggestions.size > 0 && (
                      <button
                        onClick={applySelected}
                        disabled={applying}
                        className="bg-brand-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
                      >
                        {applying ? "Đang áp dụng..." : `Áp dụng (${selectedSuggestions.size})`}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {suggestions.map((sug) => (
                    <div
                      key={sug.id}
                      onClick={() => toggleSuggestion(sug.id)}
                      className={clsx(
                        "border rounded-xl p-4 cursor-pointer transition",
                        selectedSuggestions.has(sug.id)
                          ? "ring-2 ring-brand-400 " + (SUGGESTION_TYPE_COLORS[sug.suggestion_type] || "bg-gray-50 border-gray-200")
                          : SUGGESTION_TYPE_COLORS[sug.suggestion_type] || "bg-gray-50 border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={clsx(
                          "w-4 h-4 rounded flex-shrink-0 border-2",
                          selectedSuggestions.has(sug.id)
                            ? "bg-brand-500 border-brand-500"
                            : "border-gray-300 bg-white"
                        )} />
                        <span className="text-xs font-semibold uppercase tracking-wide">
                          {SUGGESTION_TYPE_LABELS[sug.suggestion_type] || sug.suggestion_type}
                        </span>
                        {sug.section && (
                          <span className="text-xs bg-white/60 px-2 py-0.5 rounded">{sug.section}</span>
                        )}
                      </div>

                      {sug.original_text && (
                        <p className="text-xs line-through text-gray-400 mb-1.5 bg-white/50 rounded p-2">
                          {sug.original_text}
                        </p>
                      )}
                      {sug.suggested_text && (
                        <p className="text-sm font-medium mb-1.5 bg-white/60 rounded p-2">
                          → {sug.suggested_text}
                        </p>
                      )}
                      {sug.reason && (
                        <p className="text-xs opacity-70">{sug.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "preview" && (
          <div className="max-w-3xl">
            {previewHtml ? (
              <div
                className="bg-white shadow-lg rounded-2xl overflow-hidden"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <div className="text-center py-16 text-gray-400">Chưa có nội dung để xem trước</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
