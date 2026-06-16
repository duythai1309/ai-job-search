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

  const tabs = [
    { id: "basic", label: "👤 Thông tin cơ bản" },
    { id: "skills", label: "🔧 Kỹ năng" },
    { id: "experience", label: "💼 Kinh nghiệm" },
    { id: "education", label: "🎓 Học vấn" },
  ];

  if (loading) {
    return <div className="p-8"><div className="h-64 bg-gray-100 rounded-2xl animate-pulse" /></div>;
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hồ sơ của tôi</h1>
        <p className="text-gray-500 mt-1">Thông tin hồ sơ được dùng để đánh giá phù hợp và tạo CV</p>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "basic" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          {[
            { key: "full_name", label: "Họ và tên", placeholder: "Nguyễn Văn A" },
            { key: "location", label: "Địa điểm", placeholder: "TP. Hồ Chí Minh" },
            { key: "phone", label: "Số điện thoại", placeholder: "0912 345 678" },
            { key: "linkedin_url", label: "LinkedIn URL", placeholder: "https://linkedin.com/in/..." },
            { key: "github_url", label: "GitHub URL", placeholder: "https://github.com/..." },
            { key: "portfolio_url", label: "Portfolio URL", placeholder: "https://..." },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
              <input
                value={(profile as any)[field.key] || ""}
                onChange={(e) => setProfile((prev) => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái hiện tại</label>
            <select
              value={profile.current_status || "unemployed"}
              onChange={(e) => setProfile((prev) => ({ ...prev, current_status: e.target.value as any }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="employed">Đang đi làm</option>
              <option value="unemployed">Đang tìm việc</option>
              <option value="freelance">Freelance</option>
              <option value="student">Sinh viên</option>
            </select>
          </div>

          <button
            onClick={saveBasic}
            disabled={saving}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white py-3 rounded-xl font-medium transition"
          >
            {saving ? "Đang lưu..." : "Lưu thông tin"}
          </button>
        </div>
      )}

      {activeTab === "skills" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Kỹ năng của tôi</h2>

          <div className="flex gap-2 mb-5">
            <input
              value={newSkill.name}
              onChange={(e) => setNewSkill((prev) => ({ ...prev, name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addSkill()}
              placeholder="Tên kỹ năng..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <select
              value={newSkill.category}
              onChange={(e) => setNewSkill((prev) => ({ ...prev, category: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              {SKILL_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <select
              value={newSkill.level}
              onChange={(e) => setNewSkill((prev) => ({ ...prev, level: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              {SKILL_LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
            <button
              onClick={addSkill}
              disabled={addingSkill || !newSkill.name.trim()}
              className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
            >
              Thêm
            </button>
          </div>

          {SKILL_CATEGORIES.map((cat) => {
            const catSkills = (profile.skills || []).filter((s) => s.category === cat.id);
            if (catSkills.length === 0) return null;
            return (
              <div key={cat.id} className="mb-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{cat.label}</h3>
                <div className="flex flex-wrap gap-2">
                  {catSkills.map((skill) => (
                    <div key={skill.id} className="flex items-center gap-1.5 bg-brand-50 text-brand-700 px-3 py-1.5 rounded-lg text-sm">
                      {skill.name}
                      {skill.level && <span className="text-brand-400 text-xs">· {skill.level}</span>}
                      <button
                        onClick={() => deleteSkill(skill.id)}
                        className="text-brand-300 hover:text-red-500 transition ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {(profile.skills || []).length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">Chưa có kỹ năng nào. Thêm kỹ năng để AI có thể đánh giá phù hợp chính xác hơn.</p>
          )}
        </div>
      )}

      {(activeTab === "experience" || activeTab === "education") && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center py-12">
          <div className="text-4xl mb-3">{activeTab === "experience" ? "💼" : "🎓"}</div>
          <h3 className="font-semibold text-gray-700 mb-2">
            {activeTab === "experience" ? "Kinh nghiệm làm việc" : "Học vấn"}
          </h3>
          <p className="text-gray-500 text-sm">
            Tính năng chỉnh sửa trực tiếp đang phát triển.
            <br />Hiện tại dữ liệu được đồng bộ từ CV của bạn.
          </p>
        </div>
      )}
    </div>
  );
}
