// Single source of truth for the product's Data / AI / IT focus.
// Used wherever the frontend surfaces roles or industries so the scope stays
// consistent across pages (job search suggestions, market analytics, …).

export const SCOPE_LABEL = "Data · AI · IT";

/** Suggested roles shown as quick searches — all within the Data/AI/IT scope. */
export const TECH_ROLES = [
  "Data Analyst",
  "Data Engineer",
  "Data Scientist",
  "AI Engineer",
  "Machine Learning Engineer",
  "Frontend Developer",
  "Backend Developer",
  "DevOps Engineer",
];

// Keywords (EN + VI) that mark an industry/sector as within the Data/AI/IT scope.
const TECH_KEYWORDS = [
  "data", "dữ liệu", "khoa học dữ liệu",
  "ai", "a.i", "machine learning", "ml", "trí tuệ nhân tạo", "deep learning",
  "it", "công nghệ thông tin", "information technology",
  "phần mềm", "software", "lập trình", "developer", "engineer", "kỹ sư",
  "web", "mobile", "frontend", "backend", "fullstack", "full-stack",
  "devops", "cloud", "điện toán đám mây",
  "cyber", "security", "an ninh mạng", "bảo mật",
  "tester", "qa", "qc", "kiểm thử",
  "technology", "công nghệ", "analytics", "phân tích dữ liệu",
];

/** True if an industry/sector name falls within the Data/AI/IT scope. */
export function isTechScoped(name: string): boolean {
  const t = (name || "").toLowerCase();
  return TECH_KEYWORDS.some((k) => t.includes(k));
}

/**
 * Keep only items within the Data/AI/IT scope, but never return an empty list —
 * fall back to the original so charts/sections don't disappear when the source
 * data uses labels outside this keyword set.
 */
export function scopeToTech<T>(items: T[], key: (item: T) => string): T[] {
  const filtered = items.filter((i) => isTechScoped(key(i)));
  return filtered.length > 0 ? filtered : items;
}
