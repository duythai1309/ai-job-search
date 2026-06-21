"use client";

import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Lightbulb,
  Wand2, Pencil, X, FileText, Briefcase, Loader2, RotateCcw,
} from "lucide-react";
import clsx from "clsx";
import type { CVAnalysisResult, CVReviewItem, CVSection } from "@/lib/api";

/* ---------------------------------- Types --------------------------------- */

type ItemStatus = "weak" | "fixed" | "ok";

/** Plain serialisable form of the edited CV handed back on finish. */
export interface EditedCvSection {
  id: string;
  title: string;
  subtitle?: string;
  lines: string[];
}

interface EditItem extends CVReviewItem {
  original: string;
  status: ItemStatus;
}

interface EditSection {
  id: string;
  title: string;
  subtitle?: string;
  score: number;
  items: EditItem[];
}

const ease = [0.22, 1, 0.36, 1] as const;

/* --------------------------- Build editable state -------------------------- */

function toEditSections(sections: CVSection[]): EditSection[] {
  return sections.map((s, si) => {
    // Fall back to content_preview as a single item if backend gave no items.
    const rawItems: CVReviewItem[] =
      s.items && s.items.length > 0
        ? s.items
        : [{ id: `${s.id}-0`, text: s.content_preview || "", weak: s.issues.length > 0, issue: s.issues[0], suggestion: s.suggestions[0] }];
    return {
      id: s.id || `sec-${si}`,
      title: s.title,
      subtitle: s.subtitle,
      score: s.score,
      items: rawItems.map((it, ii) => ({
        ...it,
        id: it.id || `${s.id}-${ii}`,
        original: it.text,
        status: it.weak ? "weak" : "ok",
      })),
    };
  });
}

function scoreTone(score: number) {
  if (score >= 8) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 5) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
}

/** Short labels like "Soft skills:", "Tools:" are rendered as sub-headings. */
function isHeadingText(text: string) {
  const t = (text || "").trim();
  return t.length > 0 && t.length <= 45 && t.endsWith(":");
}

/* -------------------------------- Component -------------------------------- */

export default function CvReviewEditor({
  analysis,
  fileName,
  onFinish,
  onReupload,
  jobContext,
  finishLabel = "Bắt đầu tìm việc",
}: {
  analysis: CVAnalysisResult;
  fileName?: string;
  onFinish: (edited: EditedCvSection[]) => void | Promise<void>;
  onReupload?: () => void;
  jobContext?: { title: string; company: string };
  finishLabel?: string;
}) {
  const [sections, setSections] = useState<EditSection[]>(() => toEditSections(analysis.sections));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  async function handleFinish() {
    if (finishing) return;
    const edited: EditedCvSection[] = sections.map((s) => ({
      id: s.id,
      title: s.title,
      subtitle: s.subtitle,
      lines: s.items.map((it) => it.text).filter((t) => t.trim().length > 0),
    }));
    try {
      setFinishing(true);
      await onFinish(edited);
    } finally {
      setFinishing(false);
    }
  }

  const allItems = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  const flagged = allItems.filter((i) => i.status === "weak" || i.status === "fixed");
  const fixedCount = allItems.filter((i) => i.status === "fixed").length;
  const totalFlagged = flagged.length;
  const remaining = totalFlagged - fixedCount;
  const progress = totalFlagged ? Math.round((fixedCount / totalFlagged) * 100) : 100;

  const selected = allItems.find((i) => i.id === selectedId) || null;

  function updateItem(id: string, patch: Partial<EditItem>) {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
      }))
    );
  }

  function selectItem(id: string) {
    setSelectedId(id);
    requestAnimationFrame(() => {
      itemRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function applySuggestion(item: EditItem) {
    if (!item.suggestion) return;
    updateItem(item.id, { text: item.suggestion, status: "fixed" });
  }

  function onEditText(item: EditItem, text: string) {
    const changed = text.trim() !== item.original.trim() && text.trim().length > 0;
    updateItem(item.id, {
      text,
      status: changed ? "fixed" : item.status === "fixed" ? "weak" : item.status === "ok" ? "ok" : "weak",
    });
  }

  return (
    <div className="h-screen flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <header className="h-16 border-b border-slate-200/70 flex items-center justify-between px-6 sm:px-8 shrink-0 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-bold text-slate-900 text-xl tracking-tight">Vica</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 text-sm truncate flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 shrink-0" /> {fileName || "CV của bạn"}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {onReupload && (
            <button
              onClick={onReupload}
              disabled={finishing}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-50 text-sm font-medium px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> <span className="hidden sm:inline">Tải lại CV</span>
            </button>
          )}
          <div className={clsx("hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-bold", scoreTone(analysis.overall_score / 10))}>
            <Sparkles className="w-3.5 h-3.5" /> {analysis.overall_score}/100
          </div>
          <button
            onClick={handleFinish}
            disabled={finishing}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            {finishing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {finishing ? "Đang lưu..." : finishLabel}
            {!finishing && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Job context banner */}
      {jobContext && (
        <div className="bg-slate-900 text-white px-6 sm:px-8 py-2.5 flex items-center justify-center gap-2 shrink-0">
          <Briefcase className="w-3.5 h-3.5 text-white/70" />
          <span className="text-xs">
            Đang tinh chỉnh CV cho vị trí{" "}
            <span className="font-semibold">{jobContext.title}</span> · {jobContext.company}
          </span>
        </div>
      )}

      {/* Hint bar */}
      <div className="bg-white border-b border-slate-200/70 px-6 sm:px-8 py-2.5 text-center shrink-0">
        <span className="text-xs text-slate-500">
          {jobContext ? (
            <>Vùng <span className="text-amber-600 font-medium">được tô vàng</span> là chỗ chưa khớp với vị trí này · Bấm để xem gợi ý và <span className="text-slate-900 font-medium">sửa trực tiếp</span></>
          ) : (
            <>Vùng <span className="text-amber-600 font-medium">được tô vàng</span> là điểm cần cải thiện · Bấm vào để xem gợi ý và <span className="text-slate-900 font-medium">sửa trực tiếp</span></>
          )}
        </span>
      </div>

      {/* Body: document + inspector */}
      <div className="flex-1 grid lg:grid-cols-[1fr_400px] overflow-hidden">
        {/* ── Left: CV document ── */}
        <div className="overflow-y-auto px-4 sm:px-8 py-8 scrollbar-thin">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10">
            {/* CV header */}
            <div className="pb-6 border-b border-slate-100">
              <h1 className="text-[26px] font-bold text-slate-900 tracking-tight leading-tight">{analysis.name || "Họ và tên"}</h1>
              {analysis.headline && <p className="text-slate-500 mt-1 text-[15px]">{analysis.headline}</p>}
              {analysis.contacts && analysis.contacts.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3 text-xs text-slate-400">
                  {analysis.contacts.map((c, i) => (
                    <span key={i} className="flex items-center gap-2">
                      {i > 0 && <span className="text-slate-300">·</span>}{c}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Sections */}
            {sections.map((section) => (
              <div key={section.id} className="mt-8">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                  <h2 className="text-xs font-bold text-slate-600 uppercase tracking-[0.15em]">{section.title}</h2>
                  <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-md border", scoreTone(section.score))}>
                    {section.score}/10
                  </span>
                </div>
                {section.subtitle && (
                  <p className="text-sm font-semibold text-slate-900 mb-1.5">{section.subtitle}</p>
                )}

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isSel = item.id === selectedId;
                    const heading = isHeadingText(item.text);
                    return (
                      <div
                        key={item.id}
                        ref={(el) => { itemRefs.current[item.id] = el; }}
                      >
                        {isSel ? (
                          /* Inline editor */
                          <div className="rounded-xl border-2 border-slate-900 bg-white p-3 shadow-sm my-1">
                            <textarea
                              autoFocus
                              value={item.text}
                              onChange={(e) => onEditText(item, e.target.value)}
                              rows={Math.max(2, Math.ceil((item.text.length || 1) / 64))}
                              className="w-full resize-none text-sm text-slate-800 leading-relaxed outline-none"
                            />
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                              <span className="text-[11px] text-slate-400">Đang chỉnh sửa — thay đổi được lưu tự động</span>
                              <button
                                onClick={() => setSelectedId(null)}
                                className="text-[11px] font-semibold text-slate-900 hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Xong
                              </button>
                            </div>
                          </div>
                        ) : heading ? (
                          <p className="text-[13px] font-semibold text-slate-800 mt-3 first:mt-1">{item.text}</p>
                        ) : (
                          <button
                            onClick={() => selectItem(item.id)}
                            className={clsx(
                              "group w-full text-left flex items-start gap-2.5 text-[13.5px] leading-relaxed transition-colors cursor-pointer rounded-md py-1.5 pr-2",
                              item.status === "weak" && "bg-amber-50/70 border-l-2 border-amber-400 pl-3 hover:bg-amber-50",
                              item.status === "fixed" && "bg-emerald-50/70 border-l-2 border-emerald-400 pl-3 hover:bg-emerald-50",
                              item.status === "ok" && "pl-3 hover:bg-slate-50"
                            )}
                          >
                            {item.status === "weak" ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-1" />
                            ) : item.status === "fixed" ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-1" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mt-2" />
                            )}
                            <span className="flex-1 text-slate-700">
                              {item.text || <span className="text-slate-300 italic">(trống)</span>}
                            </span>
                            <Pencil className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 shrink-0 mt-1 transition-opacity" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: inspector ── */}
        <div className="border-t lg:border-t-0 lg:border-l border-slate-200/70 bg-white overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.25, ease }}
                className="p-6"
              >
                <div className="flex items-center justify-between mb-5">
                  <span className={clsx(
                    "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border",
                    selected.status === "fixed" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"
                  )}>
                    {selected.status === "fixed" ? <><CheckCircle2 className="w-3.5 h-3.5" /> Đã cải thiện</> : <><AlertTriangle className="w-3.5 h-3.5" /> Điểm cần sửa</>}
                  </span>
                  <button onClick={() => setSelectedId(null)} className="text-slate-300 hover:text-slate-700 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {selected.issue && (
                  <div className="mb-5">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Vấn đề</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{selected.issue}</p>
                  </div>
                )}

                {/* Before / after */}
                <div className="mb-4">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Bản hiện tại</p>
                  <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3 leading-relaxed">{selected.text}</p>
                </div>

                {selected.suggestion && (
                  <div className="mb-5">
                    <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5" /> Gợi ý của AI
                    </p>
                    <p className="text-sm text-slate-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3 leading-relaxed">{selected.suggestion}</p>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {selected.suggestion && selected.text.trim() !== selected.suggestion.trim() && (
                    <button
                      onClick={() => applySuggestion(selected)}
                      className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                    >
                      <Wand2 className="w-4 h-4" /> Áp dụng gợi ý
                    </button>
                  )}
                  <button
                    onClick={() => selectItem(selected.id)}
                    className="flex items-center justify-center gap-2 border border-slate-200 hover:border-slate-400 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" /> Tự chỉnh sửa
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="overview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-6"
              >
                {/* Score + summary */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shrink-0">
                    <span className="text-xl font-bold leading-none">{analysis.overall_score}</span>
                    <span className="text-[9px] text-white/60 mt-0.5">/100</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{analysis.summary_message}</p>
                </div>

                {/* Progress */}
                <div className="border-y border-slate-200 py-4 my-5">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-semibold text-slate-900">Tiến độ cải thiện</span>
                    <span className="text-slate-500">{fixedCount}/{totalFlagged} đã sửa</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-emerald-500 rounded-full"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4, ease }}
                    />
                  </div>
                  {remaining > 0 ? (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Còn {remaining} điểm cần khắc phục
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Tuyệt vời! Bạn đã xử lý hết điểm yếu
                    </p>
                  )}
                </div>

                {/* Weak items quick links */}
                {flagged.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Các điểm cần sửa</p>
                    <div className="space-y-2">
                      {flagged.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => selectItem(item.id)}
                          className={clsx(
                            "w-full text-left text-[13px] rounded-xl px-3 py-2.5 border transition-colors cursor-pointer flex items-start gap-2",
                            item.status === "fixed"
                              ? "bg-emerald-50 border-emerald-200 text-slate-500 line-through decoration-emerald-400"
                              : "border-slate-200 hover:border-slate-400 text-slate-700"
                          )}
                        >
                          {item.status === "fixed"
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            : <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />}
                          <span className="flex-1 line-clamp-2">{item.issue || item.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top priorities */}
                {analysis.top_priorities?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Ưu tiên hàng đầu</p>
                    <ol className="space-y-2">
                      {analysis.top_priorities.map((p, i) => (
                        <li key={i} className="flex gap-2.5 text-[13px] text-slate-700">
                          <span className="text-xs font-mono text-slate-400 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
