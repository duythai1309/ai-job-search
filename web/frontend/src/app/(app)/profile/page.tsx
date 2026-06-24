"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Profile, Skill, Experience, Education } from "@/lib/types";
import toast from "react-hot-toast";
import clsx from "clsx";
import {
  User, CheckCircle2, Briefcase, GraduationCap,
  Plus, Trash2, Calendar, Award, BookOpen, MapPin, Phone,
  ChevronRight, Sparkles,
} from "lucide-react";

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
  "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-colors bg-white";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  
  // Skills form state
  const [newSkill, setNewSkill] = useState({ name: "", category: "primary", level: "intermediate" });
  const [addingSkill, setAddingSkill] = useState(false);

  // Experience form state
  const [showExpForm, setShowExpForm] = useState(false);
  const [addingExp, setAddingExp] = useState(false);
  const [expForm, setExpForm] = useState({
    job_title: "",
    company: "",
    location: "",
    start_date: "",
    end_date: "",
    is_current: false,
    responsibilitiesText: "",
    achievementsText: "",
    technologiesText: "",
  });

  // Education form state
  const [showEduForm, setShowEduForm] = useState(false);
  const [addingEdu, setAddingEdu] = useState(false);
  const [eduForm, setEduForm] = useState({
    degree: "",
    field: "",
    institution: "",
    start_year: new Date().getFullYear() - 4,
    end_year: new Date().getFullYear(),
    gpa: 3.0,
    thesis: "",
    highlightsText: "",
  });

  useEffect(() => {
    api.get<Profile>("/profile/")
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
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

  /* ------------------------------- Skills --------------------------------- */
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
    toast.success("Đã xóa kỹ năng");
  }

  /* ----------------------------- Experience -------------------------------- */
  async function handleAddExperience(e: React.FormEvent) {
    e.preventDefault();
    if (!expForm.job_title.trim() || !expForm.company.trim()) {
      toast.error("Vui lòng điền chức danh và công ty");
      return;
    }
    setAddingExp(true);
    try {
      const payload = {
        job_title: expForm.job_title,
        company: expForm.company,
        location: expForm.location,
        start_date: expForm.start_date,
        end_date: expForm.is_current ? undefined : expForm.end_date,
        is_current: expForm.is_current,
        responsibilities: expForm.responsibilitiesText.split("\n").map(t => t.trim()).filter(Boolean),
        achievements: expForm.achievementsText.split("\n").map(t => t.trim()).filter(Boolean),
        technologies: expForm.technologiesText.split(",").map(t => t.trim()).filter(Boolean),
      };
      const exp = await api.post<Experience>("/profile/experience", payload);
      setProfile((prev) => ({ ...prev, experience: [...(prev.experience || []), exp] }));
      setExpForm({
        job_title: "",
        company: "",
        location: "",
        start_date: "",
        end_date: "",
        is_current: false,
        responsibilitiesText: "",
        achievementsText: "",
        technologiesText: "",
      });
      setShowExpForm(false);
      toast.success("Đã thêm kinh nghiệm làm việc");
    } catch {
      toast.error("Không thêm được kinh nghiệm");
    } finally {
      setAddingExp(false);
    }
  }

  async function handleDeleteExperience(id: string) {
    if (!confirm("Xóa kinh nghiệm này?")) return;
    try {
      await api.delete(`/profile/experience/${id}`);
      setProfile((prev) => ({ ...prev, experience: (prev.experience || []).filter((e) => e.id !== id) }));
      toast.success("Đã xóa kinh nghiệm");
    } catch {
      toast.error("Không xóa được");
    }
  }

  /* ------------------------------ Education ------------------------------- */
  async function handleAddEducation(e: React.FormEvent) {
    e.preventDefault();
    if (!eduForm.degree.trim() || !eduForm.institution.trim()) {
      toast.error("Vui lòng điền bằng cấp và trường học");
      return;
    }
    setAddingEdu(true);
    try {
      const payload = {
        degree: eduForm.degree,
        field: eduForm.field,
        institution: eduForm.institution,
        start_year: Number(eduForm.start_year),
        end_year: Number(eduForm.end_year),
        gpa: Number(eduForm.gpa),
        thesis: eduForm.thesis || undefined,
        highlights: eduForm.highlightsText.split("\n").map(t => t.trim()).filter(Boolean),
      };
      const edu = await api.post<Education>("/profile/education", payload);
      setProfile((prev) => ({ ...prev, education: [...(prev.education || []), edu] }));
      setEduForm({
        degree: "",
        field: "",
        institution: "",
        start_year: new Date().getFullYear() - 4,
        end_year: new Date().getFullYear(),
        gpa: 3.0,
        thesis: "",
        highlightsText: "",
      });
      setShowEduForm(false);
      toast.success("Đã thêm lịch sử học vấn");
    } catch {
      toast.error("Không thêm được học vấn");
    } finally {
      setAddingEdu(false);
    }
  }

  async function handleDeleteEducation(id: string) {
    if (!confirm("Xóa lịch sử học vấn này?")) return;
    try {
      await api.delete(`/profile/education/${id}`);
      setProfile((prev) => ({ ...prev, education: (prev.education || []).filter((e) => e.id !== id) }));
      toast.success("Đã xóa lịch sử học vấn");
    } catch {
      toast.error("Không xóa được");
    }
  }

  function field(key: keyof Profile, label: string, placeholder: string) {
    return (
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
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
      <div className="max-w-3xl">
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  // Completeness list & calculation
  const checklist = [
    { id: "name", label: "Họ và tên", done: !!profile.full_name, weight: 20, tab: "basic", desc: "Giúp nhà tuyển dụng biết bạn là ai" },
    { id: "location", label: "Địa điểm", done: !!profile.location, weight: 15, tab: "basic", desc: "Tìm việc làm gần bạn" },
    { id: "phone", label: "Số điện thoại", done: !!profile.phone, weight: 15, tab: "basic", desc: "Liên hệ khi nhận lịch hẹn phỏng vấn" },
    { id: "skills", label: "Kỹ năng tuyển dụng", done: (profile.skills || []).length > 0, weight: 15, tab: "skills", desc: "AI chấm điểm kỹ năng JD" },
    { id: "experience", label: "Kinh nghiệm làm việc", done: (profile.experience || []).length > 0, weight: 20, tab: "experience", desc: "Tăng 3 lần tỷ lệ gọi phỏng vấn" },
    { id: "education", label: "Lịch sử học vấn", done: (profile.education || []).length > 0, weight: 15, tab: "education", desc: "Thuyết phục hơn với học vấn liên quan" },
  ];
  const completeness = checklist.reduce((acc, item) => acc + (item.done ? item.weight : 0), 0);
  const missingItems = checklist.filter((c) => !c.done);

  return (
    <div className="max-w-screen-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-slate-500 mt-1.5 text-sm max-w-xl">
          Quản lý thông tin học vấn, kỹ năng và kinh nghiệm. AI sẽ tự động đồng bộ vào CV của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Forms */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex gap-1 border-b border-slate-200/70 bg-white px-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setShowExpForm(false);
                  setShowEduForm(false);
                }}
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

          {/* Tab basic */}
          {activeTab === "basic" && (
            <div className="rounded-3xl p-6 sm:p-8 border border-slate-100 bg-white space-y-8 shadow-sm">
              <section className="space-y-5">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Thông tin cá nhân</h2>
                {field("full_name", "Họ và tên", "Nguyễn Văn A")}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {field("location", "Địa điểm sinh sống", "TP. Hồ Chí Minh")}
                  {field("phone", "Số điện thoại liên lạc", "0912 345 678")}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Trạng thái công việc hiện tại</label>
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
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mạng xã hội & Portfolio</h2>
                {field("linkedin_url", "Đường dẫn LinkedIn", "https://linkedin.com/in/…")}
                {field("github_url", "Đường dẫn GitHub", "https://github.com/…")}
                {field("portfolio_url", "Đường dẫn Portfolio / Website cá nhân", "https://…")}
              </section>

              <button
                onClick={saveBasic}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-sm transition-colors cursor-pointer"
              >
                {saving ? "Đang lưu thông tin…" : "Lưu thông tin cơ bản"}
              </button>
            </div>
          )}

          {/* Tab skills */}
          {activeTab === "skills" && (
            <div className="rounded-3xl p-6 sm:p-8 border border-slate-100 bg-white shadow-sm">
              <div className="flex flex-col sm:flex-row gap-2.5 mb-8">
                <input
                  value={newSkill.name}
                  onChange={(e) => setNewSkill((prev) => ({ ...prev, name: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  placeholder="Thêm kỹ năng mới (ví dụ: ReactJS, Python...)"
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-slate-400 transition-colors bg-white"
                />
                <select
                  value={newSkill.category}
                  onChange={(e) => setNewSkill((prev) => ({ ...prev, category: e.target.value }))}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none bg-white cursor-pointer"
                >
                  {SKILL_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <select
                  value={newSkill.level}
                  onChange={(e) => setNewSkill((prev) => ({ ...prev, level: e.target.value }))}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none bg-white cursor-pointer"
                >
                  {SKILL_LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
                <button
                  onClick={addSkill}
                  disabled={addingSkill || !newSkill.name.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors cursor-pointer shrink-0"
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
                          className="inline-flex items-center gap-2 border border-slate-200/60 bg-slate-50 text-slate-700 pl-3 pr-2.5 py-1.5 rounded-lg text-xs font-medium"
                        >
                          {skill.name}
                          {skill.level && (
                            <span className="text-slate-400 text-[10px] font-normal">· {LEVEL_LABEL[skill.level] || skill.level}</span>
                          )}
                          <button
                            onClick={() => deleteSkill(skill.id)}
                            aria-label={`Xóa kỹ năng ${skill.name}`}
                            className="text-slate-300 hover:text-red-500 transition-colors leading-none text-base cursor-pointer font-bold ml-1"
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
                  Chưa có kỹ năng nào. Thêm kỹ năng để Vica AI đánh giá độ tương thích chuẩn xác nhất.
                </p>
              )}
            </div>
          )}

          {/* Tab experience */}
          {activeTab === "experience" && (
            <div className="rounded-3xl p-6 sm:p-8 border border-slate-100 bg-white shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" /> Kinh nghiệm làm việc
                </h2>
                {!showExpForm && (
                  <button
                    onClick={() => setShowExpForm(true)}
                    className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm kinh nghiệm
                  </button>
                )}
              </div>

              {showExpForm && (
                <form onSubmit={handleAddExperience} className="p-5 bg-slate-50/60 rounded-2xl border border-slate-100 space-y-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Thêm kinh nghiệm mới</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Chức danh công việc *</label>
                      <input
                        type="text"
                        required
                        value={expForm.job_title}
                        onChange={(e) => setExpForm(prev => ({ ...prev, job_title: e.target.value }))}
                        placeholder="Ví dụ: Frontend Intern, Product Owner..."
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-slate-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tên công ty *</label>
                      <input
                        type="text"
                        required
                        value={expForm.company}
                        onChange={(e) => setExpForm(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Ví dụ: FPT Software, VNG..."
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-slate-400 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Địa điểm</label>
                      <input
                        type="text"
                        value={expForm.location}
                        onChange={(e) => setExpForm(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Hà Nội, TP.HCM, Remote..."
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-slate-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bắt đầu từ (MM/YYYY) *</label>
                      <input
                        type="text"
                        required
                        value={expForm.start_date}
                        onChange={(e) => setExpForm(prev => ({ ...prev, start_date: e.target.value }))}
                        placeholder="Ví dụ: 06/2024"
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-slate-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kết thúc vào (MM/YYYY)</label>
                      <input
                        type="text"
                        disabled={expForm.is_current}
                        value={expForm.is_current ? "" : expForm.end_date}
                        onChange={(e) => setExpForm(prev => ({ ...prev, end_date: e.target.value }))}
                        placeholder="Ví dụ: 12/2024"
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-slate-400 bg-white disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_current"
                      checked={expForm.is_current}
                      onChange={(e) => setExpForm(prev => ({ ...prev, is_current: e.target.checked }))}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="is_current" className="text-xs text-slate-600 select-none cursor-pointer">Tôi hiện đang làm việc ở vị trí này</label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Trách nhiệm chính (Mỗi trách nhiệm nhập 1 dòng) *</label>
                    <textarea
                      rows={3}
                      required
                      value={expForm.responsibilitiesText}
                      onChange={(e) => setExpForm(prev => ({ ...prev, responsibilitiesText: e.target.value }))}
                      placeholder="Phát triển màn hình giao diện bằng ReactJS&#10;Tối ưu hóa Lighthouse giảm 30% thời gian tải"
                      className="w-full border border-slate-200 rounded-lg p-3 text-xs focus:outline-none focus:border-slate-400 bg-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Thành tựu (Mỗi dòng 1 thành tựu)</label>
                      <textarea
                        rows={2}
                        value={expForm.achievementsText}
                        onChange={(e) => setExpForm(prev => ({ ...prev, achievementsText: e.target.value }))}
                        placeholder="Đạt danh hiệu nhân viên xuất sắc kỳ thực tập"
                        className="w-full border border-slate-200 rounded-lg p-3 text-xs focus:outline-none focus:border-slate-400 bg-white resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Công nghệ (Ngăn cách bằng dấu phẩy)</label>
                      <textarea
                        rows={2}
                        value={expForm.technologiesText}
                        onChange={(e) => setExpForm(prev => ({ ...prev, technologiesText: e.target.value }))}
                        placeholder="React, TypeScript, Tailwind CSS, Git"
                        className="w-full border border-slate-200 rounded-lg p-3 text-xs focus:outline-none focus:border-slate-400 bg-white resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={addingExp}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      {addingExp ? "Đang thêm..." : "Lưu kinh nghiệm"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowExpForm(false)}
                      className="text-slate-500 hover:text-slate-800 text-xs font-medium px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                  </div>
                </form>
              )}

              {/* Experience list */}
              <div className="space-y-4">
                {(profile.experience || []).map((exp) => (
                  <div key={exp.id} className="relative group p-5 bg-white border border-slate-200/70 rounded-2xl flex items-start gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{exp.job_title}</h4>
                          <p className="text-xs text-slate-600 mt-0.5">{exp.company} {exp.location && `· ${exp.location}`}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium font-mono flex items-center gap-1 shrink-0">
                          <Calendar className="w-3 h-3" /> {exp.start_date} – {exp.is_current ? "Hiện tại" : exp.end_date}
                        </span>
                      </div>

                      {exp.responsibilities && exp.responsibilities.length > 0 && (
                        <ul className="list-disc list-inside text-xs text-slate-500 space-y-1 mt-3">
                          {exp.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      )}
                      
                      {exp.achievements && exp.achievements.length > 0 && (
                        <div className="mt-2.5">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Thành tựu</p>
                          <ul className="list-disc list-inside text-xs text-slate-500 space-y-1 mt-1">
                            {exp.achievements.map((a, i) => <li key={i} className="text-slate-600">{a}</li>)}
                          </ul>
                        </div>
                      )}

                      {exp.technologies && exp.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {exp.technologies.map((t) => (
                            <span key={t} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteExperience(exp.id)}
                      className="absolute right-4 bottom-4 w-7 h-7 flex items-center justify-center rounded-lg border border-slate-100 text-slate-300 hover:text-red-500 hover:border-red-100 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Xóa kinh nghiệm này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {(profile.experience || []).length === 0 && !showExpForm && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Chưa có kinh nghiệm làm việc nào được lưu.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab education */}
          {activeTab === "education" && (
            <div className="rounded-3xl p-6 sm:p-8 border border-slate-100 bg-white shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" /> Lịch sử học vấn
                </h2>
                {!showEduForm && (
                  <button
                    onClick={() => setShowEduForm(true)}
                    className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm học vấn
                  </button>
                )}
              </div>

              {showEduForm && (
                <form onSubmit={handleAddEducation} className="p-5 bg-slate-50/60 rounded-2xl border border-slate-100 space-y-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Thêm thông tin học vấn</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Trường học / Học viện *</label>
                      <input
                        type="text"
                        required
                        value={eduForm.institution}
                        onChange={(e) => setEduForm(prev => ({ ...prev, institution: e.target.value }))}
                        placeholder="Ví dụ: Đại học Bách Khoa TP.HCM, VinUniversity..."
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-slate-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bằng cấp *</label>
                      <input
                        type="text"
                        required
                        value={eduForm.degree}
                        onChange={(e) => setEduForm(prev => ({ ...prev, degree: e.target.value }))}
                        placeholder="Ví dụ: Cử nhân, Kỹ sư, Thạc sĩ..."
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-slate-400 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Chuyên ngành đào tạo</label>
                      <input
                        type="text"
                        value={eduForm.field}
                        onChange={(e) => setEduForm(prev => ({ ...prev, field: e.target.value }))}
                        placeholder="Ví dụ: Khoa học Máy tính, Hệ thống thông tin..."
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-slate-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Năm bắt đầu *</label>
                      <input
                        type="number"
                        required
                        value={eduForm.start_year}
                        onChange={(e) => setEduForm(prev => ({ ...prev, start_year: Number(e.target.value) }))}
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-slate-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Năm tốt nghiệp (Dự kiến) *</label>
                      <input
                        type="number"
                        required
                        value={eduForm.end_year}
                        onChange={(e) => setEduForm(prev => ({ ...prev, end_year: Number(e.target.value) }))}
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-slate-400 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">GPA (Thang 4) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={eduForm.gpa}
                        onChange={(e) => setEduForm(prev => ({ ...prev, gpa: Number(e.target.value) }))}
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-slate-400 bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Đồ án tốt nghiệp / Luận văn</label>
                      <input
                        type="text"
                        value={eduForm.thesis}
                        onChange={(e) => setEduForm(prev => ({ ...prev, thesis: e.target.value }))}
                        placeholder="Tên đồ án nghiên cứu..."
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-slate-400 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Thành tích học tập nổi bật (Mỗi dòng 1 thành tích)</label>
                    <textarea
                      rows={2}
                      value={eduForm.highlightsText}
                      onChange={(e) => setEduForm(prev => ({ ...prev, highlightsText: e.target.value }))}
                      placeholder="Học bổng khuyến học 3 kỳ liên tiếp&#10;Giải nhất nghiên cứu khoa học cấp trường"
                      className="w-full border border-slate-200 rounded-lg p-3 text-xs focus:outline-none focus:border-slate-400 bg-white resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={addingEdu}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      {addingEdu ? "Đang thêm..." : "Lưu học vấn"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEduForm(false)}
                      className="text-slate-500 hover:text-slate-800 text-xs font-medium px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                  </div>
                </form>
              )}

              {/* Education list */}
              <div className="space-y-4">
                {(profile.education || []).map((edu) => (
                  <div key={edu.id} className="relative group p-5 bg-white border border-slate-200/70 rounded-2xl flex items-start gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{edu.degree} - {edu.field}</h4>
                          <p className="text-xs text-slate-600 mt-0.5">{edu.institution} {edu.gpa != null && `· GPA: ${edu.gpa}/4.0`}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium font-mono flex items-center gap-1 shrink-0">
                          <Calendar className="w-3 h-3" /> {edu.start_year} – {edu.end_year}
                        </span>
                      </div>

                      {edu.thesis && (
                        <p className="text-xs text-slate-600 mt-3 font-medium flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Luận văn: <span className="font-normal text-slate-500 italic">{edu.thesis}</span></span>
                        </p>
                      )}

                      {edu.highlights && edu.highlights.length > 0 && (
                        <div className="mt-2.5">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Thành tựu & hoạt động</p>
                          <ul className="list-disc list-inside text-xs text-slate-500 space-y-1 mt-1">
                            {edu.highlights.map((h, i) => <li key={i}>{h}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteEducation(edu.id)}
                      className="absolute right-4 bottom-4 w-7 h-7 flex items-center justify-center rounded-lg border border-slate-100 text-slate-300 hover:text-red-500 hover:border-red-100 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Xóa học vấn này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {(profile.education || []).length === 0 && !showEduForm && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Chưa có lịch sử học vấn nào được lưu.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Completeness Meter */}
        <div className="lg:col-span-4 sticky top-0 space-y-5">
          {/* Completeness Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
            <h2 className="text-sm font-bold text-slate-900">Độ hoàn thiện hồ sơ</h2>
            
            {/* Visual completeness bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-2xl font-black text-slate-900 tabular-nums">{completeness}%</span>
                <span className="text-xs font-semibold text-blue-600">
                  {completeness === 100 ? "Tuyệt vời!" : "Có thể cải thiện"}
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-3.5 pt-4 border-t border-slate-100">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.tab);
                    setShowExpForm(false);
                    setShowEduForm(false);
                  }}
                  className="w-full text-left flex items-start gap-3 group focus:outline-none cursor-pointer border-0 bg-transparent p-0"
                >
                  <CheckCircle2
                    className={clsx(
                      "w-4 h-4 shrink-0 mt-0.5 transition-colors",
                      item.done ? "text-emerald-500 fill-emerald-50" : "text-slate-200 group-hover:text-slate-400"
                    )}
                  />
                  <div className="min-w-0">
                    <p className={clsx(
                      "text-xs font-bold leading-none transition-colors",
                      item.done ? "text-slate-800" : "text-slate-500 group-hover:text-slate-700"
                    )}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 leading-snug">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Tip Box */}
          {missingItems.length > 0 && (
            <div className="bg-[#001E36] rounded-3xl p-5 text-white border border-white/5 shadow-md flex items-start gap-3 relative overflow-hidden">
              {/* Background ambient glow */}
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="relative z-10">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5">Gợi ý từ Vica AI</p>
                <p className="text-xs text-blue-50/80 leading-relaxed font-body">
                  Hãy bổ sung <span className="font-semibold text-white">{missingItems[0].label}</span> để tăng gấp {missingItems[0].id === "experience" ? "3" : "2"} lần khả năng gợi ý việc làm chính xác từ thuật toán AI!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
