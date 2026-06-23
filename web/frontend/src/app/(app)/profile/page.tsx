"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Profile, Skill } from "@/lib/types";
import toast from "react-hot-toast";

const SKILL_CATEGORIES = [
  { id: "primary", label: "Kỹ năng chính" },
  { id: "secondary", label: "Kỹ năng phụ" },
  { id: "domain", label: "Chuyên môn" },
  { id: "tool", label: "Công cụ" },
];

const SKILL_LEVELS = [
  { id: "expert", label: "Chuyên gia" },
  { id: "advanced", label: "Nâng cao" },
  { id: "intermediate", label: "Trung cấp" },
  { id: "beginner", label: "Cơ bản" },
];

const LEVEL_LABEL: Record<string, string> = Object.fromEntries(
  SKILL_LEVELS.map((l) => [l.id, l.label])
);

const STATUS_OPTIONS = [
  { id: "employed", label: "Đang đi làm" },
  { id: "unemployed", label: "Đang tìm việc" },
  { id: "freelance", label: "Freelance" },
  { id: "student", label: "Sinh viên" },
];

const INPUT_CLASS =
  "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-colors";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [newSkill, setNewSkill] = useState({ name: "", category: "primary", level: "intermediate" });
  const [addingSkill, setAddingSkill] = useState(false);

  useEffect(() => {
    api.get<Profile>("/profile/").then(setProfile).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function saveBasic() {
    setSaving(true);
    try {
      await api.patch("/profile/", {
        full_name: profile.full_name,
        location: profile.location,
        phone: profile.phone,
        linkedin_url: profile.linkedin_url,
        github_url: profile.github_url,
        portfolio_url: profile.portfolio_url,
        current_status: profile.current_status,
        target_roles: profile.target_roles,
        target_locations: profile.target_locations,
      });
      toast.success("Đã lưu hồ sơ");
    } catch {
      toast.error("Không thể lưu");
    } finally {
      setSaving(false);
    }
  }

  async function addSkill() {
    if (!newSkill.name.trim()) return;
    setAddingSkill(true);
    try {
      const skill = await api.post<Skill>("/profile/skills", newSkill);
      setProfile((prev) => ({ ...prev, skills: [...(prev.skills || []), skill] }));
      setNewSkill({ name: "", category: "primary", level: "intermediate" });
      toast.success("Đã thêm kỹ năng");
    } catch {
      toast.error("Không thêm được kỹ năng");
    } finally {
      setAddingSkill(false);
    }
  }

  async function deleteSkill(skillId: string) {
    await api.delete(`/profile/skills/${skillId}`);
    setProfile((prev) => ({ ...prev, skills: (prev.skills || []).filter((s) => s.id !== skillId) }));
  }

  function field(key: keyof Profile, label: string, placeholder: string) {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
        <input
          value={(profile as Record<string, string>)[key as string] || ""}
          onChange={(e) => setProfile((prev) => ({ ...prev, [key]: e.target.value }))}
          placeholder={placeholder}
          className={INPUT_CLASS}
        />
      </div>
    );
  }

  const tabs = [
    { id: "basic", label: "Thông tin cơ bản" },
    { id: "skills", label: "Kỹ năng" },
    { id: "experience", label: "Kinh nghiệm" },
    { id: "education", label: "Học vấn" },
  ];

  if (loading) {
    return (
      <div className="px-8 py-10 max-w-3xl">
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  // Surface what's still missing so users know what to fill and why it matters.
  const checklist: { label: string; done: boolean; tab: string }[] = [
    { label: "Họ và tên", done: !!profile.full_name, tab: "basic" },
    { label: "Địa điểm", done: !!profile.location, tab: "basic" },
    { label: "Số điện thoại", done: !!profile.phone, tab: "basic" },
    { label: "LinkedIn", done: !!profile.linkedin_url, tab: "basic" },
    { label: "Kỹ năng", done: (profile.skills || []).length > 0, tab: "skills" },
  ];
  const missing = checklist.filter((c) => !c.done);
  const completeness = Math.round(((checklist.length - missing.length) / checklist.length) * 100);

  return (
    <div className="px-8 py-10 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Hồ sơ của tôi</h1>
        <p className="text-slate-500 mt-1.5 text-sm leading-relaxed max-w-xl">
          Đây là thông tin Vica AI dùng để <span className="font-medium text-slate-700">đánh giá độ phù hợp với việc làm</span> và{" "}
          <span className="font-medium text-slate-700">tự động điền vào CV</span>. Càng đầy đủ, gợi ý càng chính xác.
        </p>
      </div>

      {missing.length > 0 && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-amber-900">Hoàn thiện hồ sơ ({completeness}%)</p>
            <span className="text-xs text-amber-700">Còn {missing.length} mục</span>
          </div>
          <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${completeness}%` }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {missing.map((m) => (
              <button
                key={m.label}
                onClick={() => setActiveTab(m.tab)}
                className="text-xs font-medium text-amber-900 bg-white border border-amber-200 hover:border-amber-400 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                + {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 border-b border-slate-200/70 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "basic" && (
        <div className="rounded-2xl p-6 sm:p-8 border border-slate-200 bg-white space-y-8">
          <section className="space-y-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Thông tin</h2>
            {field("full_name", "Họ và tên", "Nguyễn Văn A")}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {field("location", "Địa điểm", "TP. Hồ Chí Minh")}
              {field("phone", "Số điện thoại", "0912 345 678")}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Trạng thái hiện tại</label>
              <select
                value={profile.current_status || "unemployed"}
                onChange={(e) => setProfile((prev) => ({ ...prev, current_status: e.target.value as Profile["current_status"] }))}
                className={INPUT_CLASS}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </section>

          <section className="space-y-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Liên kết</h2>
            {field("linkedin_url", "LinkedIn", "https://linkedin.com/in/…")}
            {field("github_url", "GitHub", "https://github.com/…")}
            {field("portfolio_url", "Portfolio", "https://…")}
          </section>

          <button
            onClick={saveBasic}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors cursor-pointer"
          >
            {saving ? "Đang lưu…" : "Lưu thông tin"}
          </button>
        </div>
      )}

      {activeTab === "skills" && (
        <div className="rounded-2xl p-6 sm:p-8 border border-slate-200 bg-white">
          <div className="flex flex-col sm:flex-row gap-2 mb-8">
            <input
              value={newSkill.name}
              onChange={(e) => setNewSkill((prev) => ({ ...prev, name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addSkill()}
              placeholder="Tên kỹ năng…"
              className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-colors"
            />
            <select
              value={newSkill.category}
              onChange={(e) => setNewSkill((prev) => ({ ...prev, category: e.target.value }))}
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-slate-400 cursor-pointer"
            >
              {SKILL_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <select
              value={newSkill.level}
              onChange={(e) => setNewSkill((prev) => ({ ...prev, level: e.target.value }))}
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-slate-400 cursor-pointer"
            >
              {SKILL_LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
            <button
              onClick={addSkill}
              disabled={addingSkill || !newSkill.name.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors cursor-pointer"
            >
              Thêm
            </button>
          </div>

          {SKILL_CATEGORIES.map((cat) => {
            const catSkills = (profile.skills || []).filter((s) => s.category === cat.id);
            if (catSkills.length === 0) return null;
            return (
              <div key={cat.id} className="mb-6 last:mb-0">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{cat.label}</h3>
                <div className="flex flex-wrap gap-2">
                  {catSkills.map((skill) => (
                    <span
                      key={skill.id}
                      className="inline-flex items-center gap-2 border border-slate-200 bg-slate-50 text-slate-700 pl-3 pr-2 py-1.5 rounded-lg text-sm"
                    >
                      {skill.name}
                      {skill.level && (
                        <span className="text-slate-400 text-xs">· {LEVEL_LABEL[skill.level] || skill.level}</span>
                      )}
                      <button
                        onClick={() => deleteSkill(skill.id)}
                        aria-label={`Xóa kỹ năng ${skill.name}`}
                        className="text-slate-300 hover:text-red-500 transition-colors leading-none text-base cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {(profile.skills || []).length === 0 && (
            <p className="text-slate-400 text-sm text-center py-10">
              Chưa có kỹ năng nào. Thêm kỹ năng để AI đánh giá độ phù hợp chính xác hơn.
            </p>
          )}
        </div>
      )}

      {activeTab === "experience" && (
        <div className="rounded-2xl p-6 sm:p-8 border border-slate-200 bg-white">
          {(profile.experience || []).length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">
              Chưa có kinh nghiệm nào. Tải CV lên để Vica tự động trích xuất kinh nghiệm của bạn.
            </p>
          ) : (
            <div className="space-y-6">
              {(profile.experience || []).map((exp) => (
                <div key={exp.id} className="border-l-2 border-slate-200 pl-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-semibold text-slate-900">{exp.job_title}</h3>
                    <span className="text-xs text-slate-400 shrink-0">
                      {[exp.start_date?.slice(0, 4), exp.is_current ? "Hiện tại" : exp.end_date?.slice(0, 4)]
                        .filter(Boolean)
                        .join(" – ")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {[exp.company, exp.location].filter(Boolean).join(" · ")}
                  </p>
                  {exp.responsibilities.length > 0 && (
                    <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-slate-600">
                      {exp.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  )}
                  {exp.technologies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {exp.technologies.map((t, i) => (
                        <span key={i} className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400 text-center mt-8 pt-6 border-t border-slate-100">
            Dữ liệu được đồng bộ từ CV của bạn. Tính năng chỉnh sửa trực tiếp đang phát triển.
          </p>
        </div>
      )}

      {activeTab === "education" && (
        <div className="rounded-2xl p-6 sm:p-8 border border-slate-200 bg-white">
          {(profile.education || []).length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">
              Chưa có học vấn nào. Tải CV lên để Vica tự động trích xuất học vấn của bạn.
            </p>
          ) : (
            <div className="space-y-6">
              {(profile.education || []).map((edu) => (
                <div key={edu.id} className="border-l-2 border-slate-200 pl-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-semibold text-slate-900">
                      {[edu.degree, edu.field].filter(Boolean).join(" – ") || edu.institution}
                    </h3>
                    <span className="text-xs text-slate-400 shrink-0">
                      {[edu.start_year, edu.end_year].filter(Boolean).join(" – ")}
                    </span>
                  </div>
                  {edu.degree || edu.field ? (
                    <p className="text-sm text-slate-500 mt-0.5">
                      {[edu.institution, edu.gpa ? `GPA: ${edu.gpa}` : null].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                  {edu.thesis && <p className="text-sm text-slate-600 mt-1">Luận văn: {edu.thesis}</p>}
                  {edu.highlights.length > 0 && (
                    <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-slate-600">
                      {edu.highlights.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400 text-center mt-8 pt-6 border-t border-slate-100">
            Dữ liệu được đồng bộ từ CV của bạn. Tính năng chỉnh sửa trực tiếp đang phát triển.
          </p>
        </div>
      )}
    </div>
  );
}
