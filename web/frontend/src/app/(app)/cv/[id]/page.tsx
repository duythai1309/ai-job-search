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

/**
 * Replace the first occurrence of `from` with `to` anywhere inside a CV section
 * tree (string fields at any depth). Drops the server-side `_layout` cache so the
 * backend re-derives the header/bullet layout from the new text.
 */
function deepReplaceFirst(node: unknown, from: string, to: string, done: { v: boolean }): unknown {
  if (done.v) return node;
  if (typeof node === "string") {
    if (node.includes(from)) { done.v = true; return node.replace(from, to); }
    return node;
  }
  if (Array.isArray(node)) return node.map((n) => deepReplaceFirst(n, from, to, done));
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(node as Record<string, unknown>)) {
      if (k === "_layout" || k === "_layout_src") continue;
      out[k] = deepReplaceFirst((node as Record<string, unknown>)[k], from, to, done);
    }
    return out;
  }
  return node;
}

export default function CVEditorPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job");

  const [cv, setCv] = useState<CV | null>(null);
  const [suggestions, setSuggestions] = useState<CVSuggestion[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [loadingCv, setLoadingCv] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
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

  // Apply one (possibly user-edited) suggestion: replace the original text with
  // the reviewed text inside the CV, persist, and refresh. The user always sees
  // and can edit the text first — nothing is written without an explicit click.
  async function applyOne(sug: CVSuggestion) {
    if (!cv) return;
    const replacement = (drafts[sug.id] ?? sug.suggested_text ?? "").trim();
    const original = (sug.original_text ?? "").trim();
    if (!replacement) {
      toast.error("Nội dung chỉnh sửa đang trống");
      return;
    }
    if (!original) {
      toast.error("Gợi ý này không có đoạn gốc để thay thế");
      return;
    }
    setApplyingId(sug.id);
    try {
      const done = { v: false };
      const nextSections = deepReplaceFirst(cv.sections, original, replacement, done) as CV["sections"];
      let nextStatement = cv.profile_statement;
      if (!done.v && cv.profile_statement && cv.profile_statement.includes(original)) {
        nextStatement = cv.profile_statement.replace(original, replacement);
        done.v = true;
      }
      if (!done.v) {
        toast.error("Không tìm thấy đoạn gốc trong CV để thay thế");
        return;
      }
      await api.patch(`/cv/${id}`, { sections: nextSections, profile_statement: nextStatement });
      await api.post(`/cv/${id}/suggestions/apply`, { suggestion_ids: [sug.id] });
      const updated = await api.get<CV>(`/cv/${id}`);
      setCv(updated);
      setPreviewHtml(updated.html_content || "");
      setSuggestions((prev) => prev.filter((s) => s.id !== sug.id));
      toast.success("Đã áp dụng vào CV");
    } catch {
      toast.error("Không áp dụng được");
    } finally {
      setApplyingId(null);
    }
  }

  function dismissOne(sugId: string) {
    setSuggestions((prev) => prev.filter((s) => s.id !== sugId));
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
      <div className="border-b border-slate-200/70 bg-white px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">{cv.title}</h1>
          {cv.target_role && <p className="text-sm text-slate-400 mt-0.5">{cv.target_role}</p>}
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={analyze}
            disabled={analyzing}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            {analyzing ? "Đang phân tích…" : "Phân tích AI"}
          </button>
          <button
            onClick={() => api.downloadPdf(id)}
            className="border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Xuất PDF
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200/70 bg-white px-8">
        {[
          { id: "editor", label: "Chỉnh sửa" },
          { id: "suggestions", label: `Gợi ý${suggestions.length > 0 ? ` (${suggestions.length})` : ""}` },
          { id: "preview", label: "Xem trước" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={clsx(
              "px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-700"
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

            <div className="border-l-2 border-slate-300 bg-slate-50 rounded-r-lg px-4 py-3">
              <p className="text-slate-700 text-sm font-medium mb-0.5">Gợi ý</p>
              <p className="text-slate-500 text-sm leading-relaxed">
                Dữ liệu học vấn, kinh nghiệm và kỹ năng được lấy từ hồ sơ của bạn.
                Hãy{" "}
                <a href="/profile" className="underline hover:text-slate-900">cập nhật hồ sơ</a>{" "}
                để CV phản ánh đúng thông tin nhất.
              </p>
            </div>
          </div>
        )}

        {activeTab === "suggestions" && (
          <div className="max-w-2xl">
            {suggestions.length === 0 ? (
              <div className="text-center py-20">
                <h3 className="font-semibold text-slate-700 text-base mb-1.5">Chưa có gợi ý nào</h3>
                <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                  Nhấn nút bên dưới để AI rà soát CV và đề xuất chỉnh sửa.
                  <br />Bạn sẽ <span className="text-slate-600 font-medium">xem và sửa từng gợi ý</span> trước khi áp dụng — không có gì bị ghi đè tự động.
                </p>
                <button
                  onClick={analyze}
                  disabled={analyzing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  {analyzing ? "Đang phân tích…" : "Phân tích CV với AI"}
                </button>
              </div>
            ) : (
              <>
                <div className="mb-5">
                  <p className="text-slate-900 text-sm font-semibold">{suggestions.length} gợi ý từ AI</p>
                  <p className="text-slate-500 text-sm mt-0.5">
                    Chỉnh sửa nội dung trong ô nếu cần, rồi nhấn <span className="font-medium text-slate-700">Áp dụng vào CV</span>. Mỗi thay đổi chỉ được lưu khi bạn bấm áp dụng.
                  </p>
                </div>

                <div className="space-y-4">
                  {suggestions.map((sug) => {
                    const draft = drafts[sug.id] ?? sug.suggested_text ?? "";
                    const busy = applyingId === sug.id;
                    return (
                      <div key={sug.id} className="border border-slate-200 rounded-xl p-4 bg-white">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={clsx(
                            "text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border",
                            SUGGESTION_TYPE_COLORS[sug.suggestion_type] || "bg-gray-50 border-gray-200 text-gray-600"
                          )}>
                            {SUGGESTION_TYPE_LABELS[sug.suggestion_type] || sug.suggestion_type}
                          </span>
                          {sug.section && (
                            <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{sug.section}</span>
                          )}
                        </div>

                        {sug.reason && (
                          <p className="text-[13px] text-slate-500 mb-3 leading-relaxed">{sug.reason}</p>
                        )}

                        {sug.original_text && (
                          <div className="mb-3">
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Bản hiện tại</p>
                            <p className="text-[13px] text-slate-400 line-through bg-slate-50 border border-slate-100 rounded-lg p-2.5 leading-relaxed">
                              {sug.original_text}
                            </p>
                          </div>
                        )}

                        <div className="mb-3">
                          <label className="block text-[11px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">
                            Đề xuất của AI — bạn có thể chỉnh tay
                          </label>
                          <textarea
                            value={draft}
                            onChange={(e) => setDrafts((prev) => ({ ...prev, [sug.id]: e.target.value }))}
                            rows={Math.max(2, Math.ceil((draft.length || 1) / 70))}
                            className="w-full resize-none border border-emerald-200 bg-emerald-50/40 rounded-lg p-2.5 text-[13px] text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => applyOne(sug)}
                            disabled={busy || !draft.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                          >
                            {busy ? "Đang áp dụng…" : "Áp dụng vào CV"}
                          </button>
                          <button
                            onClick={() => dismissOne(sug.id)}
                            disabled={busy}
                            className="text-slate-500 hover:text-slate-900 disabled:opacity-50 text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            Bỏ qua
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "preview" && (
          <div className="flex justify-center">
            {previewHtml ? (
              // Render in an iframe so the document's own (Harvard) stylesheet is
              // isolated — injecting it inline would leak its * / body rules into
              // the whole app. This also previews the real printed page.
              <iframe
                title="Xem trước CV"
                srcDoc={previewHtml}
                className="w-full max-w-[820px] h-[1120px] bg-white border border-slate-200 rounded-lg shadow-sm"
              />
            ) : (
              <div className="text-center py-20 text-slate-400">Chưa có nội dung để xem trước</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
