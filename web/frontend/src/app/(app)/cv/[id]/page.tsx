"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { CV, CVSection, CVSuggestion } from "@/lib/types";
import toast from "react-hot-toast";
import clsx from "clsx";

const SUGGESTION_TYPE_LABELS: Record<string, string> = {
  weakness: "Điểm yếu",
  keyword: "Thiếu từ khóa",
  reframe: "Cách diễn đạt",
  add: "Bổ sung",
  remove: "Loại bỏ",
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

/** Plain editable text of a section, or null when it is structured (from profile). */
function sectionText(section: CVSection): string | null {
  const c = section.content as { text?: unknown } | string | null;
  if (typeof c === "string") return c;
  if (c && typeof c === "object" && typeof c.text === "string") return c.text;
  return null;
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
  const [analyzed, setAnalyzed] = useState(false);
  const [rail, setRail] = useState<"content" | "ai">("content");
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

  async function refreshPreview() {
    try {
      const refreshed = await api.get<CV>(`/cv/${id}`);
      setCv(refreshed);
      setPreviewHtml(refreshed.html_content || "");
    } catch { /* silent */ }
  }

  async function analyze() {
    setRail("ai");
    setAnalyzing(true);
    setAnalyzed(true);
    setSuggestions([]); // clear stale; new ones stream in below
    let count = 0;
    try {
      await api.streamAnalyzeCv(id, jobId || undefined, (s) => {
        count += 1;
        setSuggestions((prev) => [...prev, s as unknown as CVSuggestion]);
      });
      if (count > 0) toast.success(`Tìm thấy ${count} gợi ý cải thiện`);
      else toast("CV của bạn khá ổn — chưa có gợi ý nào nổi bật.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Có lỗi khi phân tích");
    } finally {
      setAnalyzing(false);
    }
  }

  // Apply one (possibly user-edited) suggestion: replace the original text with
  // the reviewed text inside the CV, persist, and refresh — nothing is written
  // without an explicit click.
  async function applyOne(sug: CVSuggestion) {
    if (!cv) return;
    const replacement = (drafts[sug.id] ?? sug.suggested_text ?? "").trim();
    const original = (sug.original_text ?? "").trim();
    if (!replacement) { toast.error("Nội dung chỉnh sửa đang trống"); return; }
    if (!original) { toast.error("Gợi ý này không có đoạn gốc để thay thế"); return; }
    setApplyingId(sug.id);
    try {
      const done = { v: false };
      const nextSections = deepReplaceFirst(cv.sections, original, replacement, done) as CV["sections"];
      let nextStatement = cv.profile_statement;
      if (!done.v && cv.profile_statement && cv.profile_statement.includes(original)) {
        nextStatement = cv.profile_statement.replace(original, replacement);
        done.v = true;
      }
      if (!done.v) { toast.error("Không tìm thấy đoạn gốc trong CV để thay thế"); return; }
      await api.patch(`/cv/${id}`, { sections: nextSections, profile_statement: nextStatement });
      await api.post(`/cv/${id}/suggestions/apply`, { suggestion_ids: [sug.id] });
      await refreshPreview();
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

  // Field edits (title / role / summary) — update locally, persist, re-render.
  async function updateField(field: keyof CV, value: string) {
    if (!cv) return;
    setCv({ ...cv, [field]: value } as CV);
    try {
      await api.patch(`/cv/${id}`, { [field]: value });
      if (field === "profile_statement" || field === "target_role") await refreshPreview();
    } catch { /* silent */ }
  }

  // Edit a custom section's text, persist the whole sections array, re-render.
  async function saveSection(sectionId: string, text: string) {
    if (!cv) return;
    const nextSections = cv.sections.map((s) =>
      s.id === sectionId
        ? { ...s, content: { ...(typeof s.content === "object" && s.content ? s.content : {}), text } }
        : s
    );
    setCv({ ...cv, sections: nextSections });
    try {
      await api.patch(`/cv/${id}`, { sections: nextSections });
      await refreshPreview();
    } catch {
      toast.error("Không lưu được mục này");
    }
  }

  if (loadingCv) {
    return <div className="p-8"><div className="h-[80vh] bg-slate-100 rounded-2xl animate-pulse" /></div>;
  }
  if (!cv) return <div className="p-8 text-slate-400">Không tìm thấy CV</div>;

  const editableSections = [...cv.sections].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return (
    <div className="flex flex-col h-full bg-[#F4F4F5]">
      {/* Toolbar */}
      <div className="border-b border-slate-200/70 bg-white px-6 py-3 flex items-center justify-between shrink-0">
        <input
          value={cv.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="text-base font-semibold text-slate-900 tracking-tight bg-transparent outline-none rounded px-1 -ml-1 hover:bg-slate-50 focus:bg-slate-50 max-w-md"
        />
        <div className="flex gap-2.5">
          <button
            onClick={() => (rail === "ai" ? setRail("content") : (analyzed ? setRail("ai") : analyze()))}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
              rail === "ai" ? "bg-blue-600 text-white hover:bg-blue-700" : "border border-slate-200 text-slate-700 hover:bg-slate-50"
            )}
          >
            Gợi ý AI{suggestions.length > 0 ? ` (${suggestions.length})` : ""}
          </button>
          <button
            onClick={() => api.downloadPdf(id)}
            className="border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Xuất PDF
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* CV paper — the canonical LaTeX/Harvard render (matches the PDF) */}
        <div className="flex-1 overflow-y-auto flex justify-center p-8">
          {previewHtml ? (
            <iframe
              title="CV"
              srcDoc={previewHtml}
              className="w-full max-w-[820px] h-[1160px] bg-white border border-slate-200 rounded-lg shadow-sm shrink-0"
            />
          ) : (
            <div className="text-slate-400 py-20">Chưa có nội dung CV</div>
          )}
        </div>

        {/* Right rail — edit content / AI suggestions */}
        <aside className="w-[380px] border-l border-slate-200/70 bg-white flex flex-col shrink-0">
          <div className="flex p-1.5 m-3 mb-0 bg-slate-100 rounded-xl text-sm font-medium">
            {([["content", "Nội dung"], ["ai", "Gợi ý AI"]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setRail(key)}
                className={clsx(
                  "flex-1 py-1.5 rounded-lg transition-colors cursor-pointer",
                  rail === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {rail === "content" ? (
              <>
                <Field label="Vị trí mục tiêu" value={cv.target_role || ""} placeholder="Frontend Developer, Data Analyst…"
                  onSave={(v) => updateField("target_role", v)} />
                <Field label="Công ty mục tiêu" value={cv.target_company || ""} placeholder="Tên công ty…"
                  onSave={(v) => updateField("target_company", v)} />
                <Field label="Mục tiêu nghề nghiệp" value={cv.profile_statement || ""} textarea
                  placeholder="Mô tả ngắn gọn mục tiêu và điểm mạnh…"
                  onSave={(v) => updateField("profile_statement", v)} />

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Các mục trong CV</p>
                  <div className="space-y-4">
                    {editableSections.map((s) => {
                      const text = sectionText(s);
                      return (
                        <div key={s.id}>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">{s.title}</label>
                          {text === null ? (
                            <p className="text-[13px] text-slate-400 bg-slate-50 border border-slate-100 rounded-lg p-2.5 leading-relaxed">
                              Lấy từ hồ sơ — chỉnh trong <a href="/profile" className="underline hover:text-slate-700">Hồ sơ</a>.
                            </p>
                          ) : (
                            <SectionEditor initial={text} onSave={(v) => saveSection(s.id, v)} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <p className="text-[12px] text-slate-400 leading-relaxed pt-1">
                  Mọi thay đổi tự lưu và cập nhật ngay trên bản CV bên trái.
                </p>
              </>
            ) : (
              <>
                <button
                  onClick={analyze}
                  disabled={analyzing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  {analyzing ? "Đang phân tích…" : analyzed ? "Phân tích lại" : "Phân tích CV với AI"}
                </button>

                {suggestions.length === 0 ? (
                  <p className="text-[13px] text-slate-400 leading-relaxed text-center pt-4">
                    {analyzing
                      ? "AI đang rà soát từng mục…"
                      : analyzed
                        ? "Chưa có gợi ý nổi bật — CV của bạn khá ổn."
                        : "Nhấn nút trên để AI rà soát CV và đề xuất chỉnh sửa theo chuẩn STAR. Bạn xem và sửa từng gợi ý trước khi áp dụng."}
                  </p>
                ) : (
                  <div className="space-y-3.5">
                    {suggestions.map((sug) => {
                      const draft = drafts[sug.id] ?? sug.suggested_text ?? "";
                      const busy = applyingId === sug.id;
                      return (
                        <div key={sug.id} className="border border-slate-200 rounded-xl p-3.5 bg-white">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700">
                              {SUGGESTION_TYPE_LABELS[sug.suggestion_type] || sug.suggestion_type}
                            </span>
                            {sug.section && <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{sug.section}</span>}
                          </div>
                          {sug.reason && <p className="text-[12px] text-slate-500 mb-2 leading-relaxed">{sug.reason}</p>}
                          {sug.original_text && (
                            <p className="text-[12px] text-slate-400 line-through bg-slate-50 border border-slate-100 rounded-lg p-2 leading-relaxed mb-2">
                              {sug.original_text}
                            </p>
                          )}
                          <textarea
                            value={draft}
                            onChange={(e) => setDrafts((prev) => ({ ...prev, [sug.id]: e.target.value }))}
                            rows={Math.max(2, Math.ceil((draft.length || 1) / 48))}
                            className="w-full resize-none border border-emerald-200 bg-emerald-50/40 rounded-lg p-2 text-[12.5px] text-slate-800 leading-relaxed outline-none focus:ring-2 focus:ring-emerald-300 mb-2"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => applyOne(sug)}
                              disabled={busy || !draft.trim()}
                              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[13px] font-semibold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              {busy ? "Đang áp dụng…" : "Áp dụng"}
                            </button>
                            <button
                              onClick={() => dismissOne(sug.id)}
                              disabled={busy}
                              className="text-slate-500 hover:text-slate-900 disabled:opacity-50 text-[13px] font-medium px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              Bỏ qua
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

/** A labelled input/textarea that commits on blur. */
function Field({
  label, value, placeholder, textarea, onSave,
}: {
  label: string; value: string; placeholder?: string; textarea?: boolean; onSave: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  const commit = () => { if (draft !== value) onSave(draft); };
  const cls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300";
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      {textarea ? (
        <textarea value={draft} placeholder={placeholder} rows={4} onChange={(e) => setDraft(e.target.value)} onBlur={commit} className={clsx(cls, "resize-none leading-relaxed")} />
      ) : (
        <input value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} onBlur={commit} className={cls} />
      )}
    </div>
  );
}

/** Multiline section text editor that commits on blur. */
function SectionEditor({ initial, onSave }: { initial: string; onSave: (v: string) => void }) {
  const [draft, setDraft] = useState(initial);
  useEffect(() => { setDraft(initial); }, [initial]);
  return (
    <textarea
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { if (draft !== initial) onSave(draft); }}
      rows={Math.max(3, Math.min(12, draft.split("\n").length + 1))}
      className="w-full resize-none border border-slate-200 rounded-lg p-2.5 text-[13px] text-slate-800 leading-relaxed outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
    />
  );
}
