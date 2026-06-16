/**
 * Mock data layer for UI testing without a live backend.
 *
 * Enable it in one of three ways:
 *   1. Set NEXT_PUBLIC_USE_MOCK=1 in the environment (whole deployment runs on mock).
 *   2. Visit any page with ?mock=1 once (persists in localStorage; ?mock=0 turns it off).
 *   3. Run `localStorage.setItem("vica:mock", "1")` in the browser console.
 *
 * Every request funnels through resolveMock(method, path, body) in lib/api.ts.
 */

import type {
  Application,
  CV,
  CVSuggestion,
  FitEvaluation,
  JobPosting,
  Profile,
  Skill,
} from "./types";
import type { CVAnalysisResult } from "./api";

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 864e5).toISOString();
const daysAhead = (d: number) => new Date(now.getTime() + d * 864e5).toISOString();

/* ------------------------------- Profile ---------------------------------- */

export const mockProfile: Profile = {
  id: "mock-user",
  full_name: "Nguyễn Đức Thái",
  email: "thai.nguyen@example.com",
  avatar_url: undefined,
  location: "TP. Hồ Chí Minh",
  phone: "0901 234 567",
  linkedin_url: "https://linkedin.com/in/thai-nguyen",
  github_url: "https://github.com/thainguyen",
  portfolio_url: "https://thainguyen.dev",
  current_status: "student",
  target_roles: ["Frontend Developer", "Fullstack Developer"],
  target_locations: ["TP. Hồ Chí Minh", "Remote"],
  deal_breakers: ["Tăng ca thường xuyên không lương", "Không có lộ trình thăng tiến"],
  onboarding_completed: true,
  education: [
    {
      id: "edu-1",
      degree: "Cử nhân",
      field: "Khoa học Máy tính",
      institution: "Đại học Bách Khoa TP.HCM",
      start_year: 2021,
      end_year: 2025,
      gpa: 3.4,
      thesis: "Ứng dụng học sâu trong nhận diện văn bản tiếng Việt",
      highlights: ["Học bổng khuyến khích học tập 3 kỳ", "Top 5 đồ án xuất sắc khoa CNTT"],
    },
  ],
  experience: [
    {
      id: "exp-1",
      job_title: "Frontend Developer (Thực tập)",
      company: "FPT Software",
      location: "TP. Hồ Chí Minh",
      start_date: "2024-06",
      end_date: "2024-12",
      is_current: false,
      responsibilities: [
        "Phát triển giao diện cho hệ thống nội bộ bằng React và TypeScript",
        "Tối ưu hiệu năng trang, giảm 30% thời gian tải",
      ],
      achievements: ["Được giữ lại làm part-time sau kỳ thực tập"],
      technologies: ["React", "TypeScript", "Tailwind CSS", "Git"],
    },
    {
      id: "exp-2",
      job_title: "Cộng tác viên Web",
      company: "CLB Lập trình BK",
      location: "TP. Hồ Chí Minh",
      start_date: "2023-01",
      end_date: "2024-05",
      is_current: false,
      responsibilities: ["Xây dựng landing page cho các sự kiện của CLB"],
      achievements: ["Trang sự kiện đạt 5.000+ lượt đăng ký"],
      technologies: ["Next.js", "Figma"],
    },
  ],
  skills: [
    { id: "sk-1", name: "React", category: "primary", level: "advanced", years_experience: 2 },
    { id: "sk-2", name: "TypeScript", category: "primary", level: "advanced", years_experience: 2 },
    { id: "sk-3", name: "Next.js", category: "primary", level: "intermediate", years_experience: 1 },
    { id: "sk-4", name: "Tailwind CSS", category: "secondary", level: "advanced" },
    { id: "sk-5", name: "Node.js", category: "secondary", level: "intermediate" },
    { id: "sk-6", name: "Thiết kế UI/UX", category: "domain", level: "intermediate" },
    { id: "sk-7", name: "Figma", category: "tool", level: "intermediate" },
    { id: "sk-8", name: "Git", category: "tool", level: "advanced" },
  ],
};

/* -------------------------------- Jobs ------------------------------------ */

type JobSeed = Partial<JobPosting> & { id: string; title: string; company: string };

function buildJob(seed: JobSeed): JobPosting {
  return {
    external_id: seed.id,
    source: "vietnamworks",
    company_logo_url: undefined,
    location: "TP. Hồ Chí Minh",
    is_remote: false,
    description:
      "Chúng tôi đang tìm kiếm một ứng viên năng động, đam mê công nghệ để gia nhập đội ngũ phát triển sản phẩm. Bạn sẽ làm việc trong môi trường Agile, cùng team xây dựng các tính năng mới và tối ưu trải nghiệm người dùng.",
    requirements: [
      "Thành thạo JavaScript/TypeScript",
      "Kinh nghiệm với React hoặc framework tương đương",
      "Hiểu biết về RESTful API",
      "Có tinh thần học hỏi, làm việc nhóm tốt",
    ],
    benefits: ["Lương tháng 13", "Bảo hiểm sức khỏe", "Làm việc hybrid", "Ngân sách học tập"],
    salary_min: 15_000_000,
    salary_max: 25_000_000,
    salary_currency: "VND",
    salary_negotiable: false,
    employment_type: "Full-time",
    experience_years_min: 1,
    experience_years_max: 3,
    skills_required: ["React", "TypeScript", "Tailwind CSS"],
    posted_at: daysAgo(3),
    deadline: daysAhead(20),
    url: `https://www.vietnamworks.com/jobs/${seed.id}`,
    is_active: true,
    scraped_at: daysAgo(1),
    ...seed,
  };
}

export const mockJobs: JobPosting[] = [
  buildJob({
    id: "job-1", title: "Frontend Developer (React)", company: "Tiki",
    source: "vietnamworks", is_remote: true, salary_min: 18_000_000, salary_max: 28_000_000,
    skills_required: ["React", "TypeScript", "Redux"],
  }),
  buildJob({
    id: "job-2", title: "Product Engineer", company: "MoMo",
    source: "topcv", location: "TP. Hồ Chí Minh", salary_min: 25_000_000, salary_max: 40_000_000,
    skills_required: ["Node.js", "React", "PostgreSQL"], experience_years_min: 2, experience_years_max: 5,
  }),
  buildJob({
    id: "job-3", title: "Fullstack Developer", company: "VNG",
    source: "itviec", salary_negotiable: true, salary_min: undefined, salary_max: undefined,
    skills_required: ["Next.js", "Node.js", "AWS"],
  }),
  buildJob({
    id: "job-4", title: "Junior UI/UX Designer", company: "Haravan",
    source: "careerviet", salary_min: 12_000_000, salary_max: 18_000_000,
    skills_required: ["Figma", "Thiết kế UI/UX"], employment_type: "Full-time",
  }),
  buildJob({
    id: "job-5", title: "Frontend Intern", company: "Shopee",
    source: "topcv", is_remote: true, salary_min: 8_000_000, salary_max: 12_000_000,
    skills_required: ["React", "JavaScript"], experience_years_min: 0, experience_years_max: 1,
  }),
  buildJob({
    id: "job-6", title: "Data Analyst", company: "Be Group",
    source: "vietnamworks", location: "Hà Nội", salary_min: 16_000_000, salary_max: 24_000_000,
    skills_required: ["SQL", "Python", "Power BI"],
  }),
  buildJob({
    id: "job-7", title: "Mobile Developer (React Native)", company: "ZaloPay",
    source: "itviec", salary_min: 20_000_000, salary_max: 35_000_000,
    skills_required: ["React Native", "TypeScript"],
  }),
  buildJob({
    id: "job-8", title: "Backend Developer (Node.js)", company: "Sapo",
    source: "careerviet", location: "Hà Nội", salary_min: 18_000_000, salary_max: 30_000_000,
    skills_required: ["Node.js", "MongoDB", "Docker"],
  }),
];

function findJob(id: string): JobPosting {
  return mockJobs.find((j) => j.id === id) ?? mockJobs[0];
}

/* ---------------------------- Fit evaluation ------------------------------ */

export function mockFitEvaluation(jobId: string): FitEvaluation {
  const job = findJob(jobId);
  return {
    technical_skills: { score: 82, notes: `Kỹ năng ${job.skills_required.slice(0, 2).join(", ")} của bạn rất phù hợp với yêu cầu.` },
    experience_match: { score: 65, notes: "Kinh nghiệm thực tập liên quan, nhưng còn thiếu kinh nghiệm dự án quy mô lớn." },
    cultural_fit: { score: 78, notes: "Tinh thần học hỏi và làm việc nhóm phù hợp với văn hóa công ty." },
    career_alignment: { score: 88, notes: "Vị trí này nằm đúng trong định hướng nghề nghiệp bạn đặt ra." },
    overall_score: 84,
    verdict: "Phù hợp cao",
    strengths: [
      `Nền tảng ${job.skills_required[0]} vững`,
      "Định hướng nghề nghiệp rõ ràng",
      "Có sản phẩm thực tế trong portfolio",
    ],
    gaps: ["Chưa có kinh nghiệm CI/CD", "Cần bổ sung kiến thức về testing"],
    recommendation:
      "Bạn nên ứng tuyển vị trí này. Hãy nhấn mạnh dự án thực tập tại FPT Software và các sản phẩm cá nhân để bù đắp cho khoảng cách về kinh nghiệm.",
  };
}

/* ------------------------------ Applications ------------------------------ */

function buildApplication(
  id: string,
  jobIdx: number,
  status: Application["status"],
  fit: number,
  extra: Partial<Application> = {}
): Application {
  const job = mockJobs[jobIdx];
  return {
    id,
    user_id: "mock-user",
    job_posting_id: job.id,
    status,
    fit_score: fit,
    company_name: job.company,
    role_title: job.title,
    source_url: job.url,
    created_at: daysAgo(10),
    updated_at: daysAgo(2),
    job_postings: job,
    ...extra,
  };
}

export const mockApplications: Application[] = [
  buildApplication("app-1", 0, "applied", 84, { applied_at: daysAgo(6) }),
  buildApplication("app-2", 1, "interview", 79, { applied_at: daysAgo(9), interview_at: daysAhead(2), notes: "Vòng kỹ thuật qua Google Meet" }),
  buildApplication("app-3", 2, "bookmarked", 71),
  buildApplication("app-4", 3, "offer", 90, { applied_at: daysAgo(20), salary_expected: 16_000_000 }),
  buildApplication("app-5", 4, "applied", 68, { applied_at: daysAgo(4) }),
  buildApplication("app-6", 6, "interview", 76, { applied_at: daysAgo(7), interview_at: daysAhead(5) }),
  buildApplication("app-7", 5, "rejected", 55, { applied_at: daysAgo(15) }),
  buildApplication("app-8", 7, "bookmarked", 73),
  buildApplication("app-9", 2, "withdrawn", 60, { applied_at: daysAgo(18) }),
];

/* --------------------------------- CVs ------------------------------------ */

function cvHtml(title: string, role: string): string {
  return `
  <div style="font-family: Arial, sans-serif; color:#0f172a; padding:40px; line-height:1.6;">
    <h1 style="margin:0; font-size:24px;">Nguyễn Đức Thái</h1>
    <p style="margin:4px 0; color:#475569;">${role} · TP. Hồ Chí Minh · thai.nguyen@example.com</p>
    <hr style="border:none; border-top:1px solid #e2e8f0; margin:16px 0;" />
    <h2 style="font-size:14px; text-transform:uppercase; letter-spacing:1px; color:#64748b;">Mục tiêu nghề nghiệp</h2>
    <p>Sinh viên CNTT năm cuối với 2 năm kinh nghiệm React/TypeScript, mong muốn phát triển sự nghiệp ở vị trí ${role}.</p>
    <h2 style="font-size:14px; text-transform:uppercase; letter-spacing:1px; color:#64748b;">Kinh nghiệm</h2>
    <p><strong>Frontend Developer (Thực tập) — FPT Software</strong> (06/2024 – 12/2024)</p>
    <ul><li>Phát triển giao diện hệ thống nội bộ bằng React, TypeScript</li><li>Tối ưu hiệu năng, giảm 30% thời gian tải</li></ul>
    <h2 style="font-size:14px; text-transform:uppercase; letter-spacing:1px; color:#64748b;">Kỹ năng</h2>
    <p>React · TypeScript · Next.js · Tailwind CSS · Node.js · Figma · Git</p>
  </div>`;
}

export const mockCvs: CV[] = [
  {
    id: "cv-1", user_id: "mock-user", title: "CV Frontend Developer", target_role: "Frontend Developer",
    target_company: "Tiki", profile_statement: "Sinh viên CNTT năm cuối, 2 năm kinh nghiệm React/TypeScript.",
    sections: [], html_content: cvHtml("CV Frontend Developer", "Frontend Developer"),
    is_master: true, version: 3, created_at: daysAgo(30), updated_at: daysAgo(2),
  },
  {
    id: "cv-2", user_id: "mock-user", title: "CV Fullstack", target_role: "Fullstack Developer",
    target_company: "VNG", profile_statement: "Định hướng fullstack với nền tảng frontend vững và Node.js.",
    sections: [], html_content: cvHtml("CV Fullstack", "Fullstack Developer"),
    is_master: false, version: 1, created_at: daysAgo(12), updated_at: daysAgo(5),
  },
  {
    id: "cv-3", user_id: "mock-user", title: "CV Thực tập", target_role: "Frontend Intern",
    target_company: undefined, profile_statement: "Bản CV tinh gọn cho các vị trí thực tập.",
    sections: [], html_content: cvHtml("CV Thực tập", "Frontend Intern"),
    is_master: false, version: 2, created_at: daysAgo(20), updated_at: daysAgo(8),
  },
];

export const mockCvSuggestions: CVSuggestion[] = [
  { id: "sg-1", section: "Mục tiêu nghề nghiệp", suggestion_type: "keyword", original_text: "đam mê công nghệ", suggested_text: "đam mê xây dựng sản phẩm web hiệu năng cao với React", reason: "Thêm từ khóa khớp với JD mục tiêu", is_applied: false },
  { id: "sg-2", section: "Kinh nghiệm", suggestion_type: "reframe", original_text: "Tối ưu hiệu năng trang", suggested_text: "Giảm 30% thời gian tải trang nhờ code-splitting và lazy-loading", reason: "Định lượng kết quả gây ấn tượng hơn", is_applied: false },
  { id: "sg-3", section: "Kỹ năng", suggestion_type: "add", suggested_text: "Bổ sung kinh nghiệm viết unit test (Jest, React Testing Library)", reason: "JD yêu cầu kỹ năng testing", is_applied: false },
  { id: "sg-4", section: "Mục tiêu nghề nghiệp", suggestion_type: "weakness", original_text: "mong muốn học hỏi", suggested_text: "đóng góp ngay vào việc phát triển tính năng", reason: "Tránh diễn đạt bị động, thiếu tự tin", is_applied: false },
  { id: "sg-5", section: "Kinh nghiệm", suggestion_type: "remove", original_text: "Sở thích: chơi game, xem phim", reason: "Thông tin không liên quan, nên loại bỏ để tiết kiệm không gian", is_applied: false },
];

/* ------------------------------- Analytics -------------------------------- */

export const mockUserActivity = { jobs_explored: 47, cvs_created: 3, avg_fit_score: 76 };

export const mockAppStats = {
  total: mockApplications.length,
  by_status: mockApplications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
  active: mockApplications.filter((a) => ["applied", "interview"].includes(a.status)).length,
  success_rate: 11,
};

export const mockMarket = {
  top_skills: [
    { skill: "React", count: 320 },
    { skill: "TypeScript", count: 280 },
    { skill: "Node.js", count: 240 },
    { skill: "Python", count: 210 },
    { skill: "SQL", count: 190 },
    { skill: "AWS", count: 150 },
  ],
  top_sectors: [
    { sector: "Công nghệ / Phần mềm", count: 540 },
    { sector: "Thương mại điện tử", count: 320 },
    { sector: "Tài chính / Fintech", count: 260 },
    { sector: "Giáo dục", count: 140 },
    { sector: "Logistics", count: 90 },
  ],
  salary_ranges: [
    { range: "< 15tr", count: 120 },
    { range: "15–25tr", count: 380 },
    { range: "25–35tr", count: 290 },
    { range: "35–50tr", count: 160 },
    { range: "> 50tr", count: 70 },
  ],
  employment_types: [
    { type: "Full-time", count: 720 },
    { type: "Part-time", count: 110 },
    { type: "Thực tập", count: 130 },
    { type: "Freelance", count: 60 },
  ],
  top_locations: [
    { location: "TP. Hồ Chí Minh", count: 610 },
    { location: "Hà Nội", count: 430 },
    { location: "Đà Nẵng", count: 120 },
    { location: "Remote", count: 180 },
  ],
  insights: [
    "Nhu cầu tuyển dụng React và TypeScript tăng 18% so với quý trước — đây là tổ hợp kỹ năng đáng đầu tư.",
    "Mức lương phổ biến nhất cho frontend junior tại TP.HCM rơi vào khoảng 15–25 triệu/tháng.",
    "Hơn 25% tin tuyển dụng cho phép làm việc remote hoặc hybrid, mở rộng cơ hội cho ứng viên ngoài thành phố lớn.",
    "Kỹ năng testing (Jest, Cypress) ngày càng được nhắc đến nhiều trong JD nhưng nhiều ứng viên còn thiếu.",
  ],
};

export const mockJobSummary = {
  total_jobs: 1240,
  by_source: { vietnamworks: 420, topcv: 380, itviec: 280, careerviet: 160 },
};

/* ------------------------------- CV upload -------------------------------- */

export const mockCvAnalysis: CVAnalysisResult = {
  name: "Nguyễn Đức Thái",
  headline: "Frontend Developer · Fresher",
  contacts: ["thai.nguyen@example.com", "TP. Hồ Chí Minh", "linkedin.com/in/thai-nguyen"],
  overall_score: 78,
  summary_message: "CV của bạn khá tốt! Còn vài chỗ được tô vàng cần cải thiện để nổi bật hơn với nhà tuyển dụng.",
  top_priorities: [
    "Định lượng thành tích bằng số liệu cụ thể",
    "Bổ sung từ khóa kỹ thuật khớp với vị trí mục tiêu",
    "Rút gọn phần thông tin không liên quan",
  ],
  sections: [
    {
      id: "s1", title: "Mục tiêu nghề nghiệp", score: 65,
      content_preview: "", issues: [], suggestions: [],
      items: [
        {
          id: "s1-0",
          text: "Sinh viên CNTT năm cuối đam mê công nghệ, mong muốn được học hỏi trong môi trường năng động.",
          weak: true,
          issue: "Quá chung chung và bị động (\"mong muốn được học hỏi\") — không nêu giá trị bạn mang lại hay vị trí cụ thể.",
          suggestion: "Frontend Developer với 2 năm kinh nghiệm React/TypeScript, từng tối ưu giảm 30% thời gian tải trang. Sẵn sàng đóng góp ngay vào việc phát triển sản phẩm web hiệu năng cao.",
        },
      ],
    },
    {
      id: "s2", title: "Kinh nghiệm", score: 72,
      subtitle: "Frontend Developer (Thực tập) · FPT Software · 06/2024 – 12/2024",
      content_preview: "", issues: [], suggestions: [],
      items: [
        {
          id: "s2-0",
          text: "Phụ trách xây dựng giao diện và sửa lỗi cho hệ thống nội bộ.",
          weak: true,
          issue: "Thiếu công nghệ cụ thể và kết quả đo lường được.",
          suggestion: "Phát triển 12+ màn hình cho hệ thống nội bộ bằng React, TypeScript và Tailwind, phối hợp cùng team 5 người theo quy trình Agile.",
        },
        {
          id: "s2-1",
          text: "Tối ưu hiệu năng trang web giúp tải nhanh hơn.",
          weak: true,
          issue: "Không có số liệu — \"nhanh hơn\" không thuyết phục nhà tuyển dụng.",
          suggestion: "Giảm 30% thời gian tải trang nhờ code-splitting và lazy-loading, cải thiện điểm Lighthouse từ 68 lên 94.",
        },
        {
          id: "s2-2",
          text: "Được giữ lại làm part-time sau kỳ thực tập nhờ kết quả tốt.",
          weak: false,
        },
      ],
    },
    {
      id: "s3", title: "Kỹ năng", score: 84,
      content_preview: "", issues: [], suggestions: [],
      items: [
        { id: "s3-0", text: "React · TypeScript · Next.js · Tailwind CSS · Node.js · Git · Figma", weak: false },
        {
          id: "s3-1",
          text: "Sở thích: chơi game, xem phim, nghe nhạc.",
          weak: true,
          issue: "Thông tin không liên quan đến vị trí ứng tuyển, nên loại bỏ để tiết kiệm không gian.",
          suggestion: "Kỹ năng bổ trợ: viết unit test (Jest, React Testing Library), tối ưu SEO, làm việc với REST API.",
        },
      ],
    },
  ],
};

/* --------------------------- Tailor CV to a job --------------------------- */

export function mockTailoredAnalysis(jobId: string): CVAnalysisResult {
  const job = findJob(jobId);
  const topSkill = job.skills_required[0] || "kỹ năng chính";
  const skillList = job.skills_required.slice(0, 3).join(", ") || "kỹ năng yêu cầu";
  return {
    name: mockProfile.full_name,
    headline: `Ứng viên cho vị trí ${job.title}`,
    contacts: [mockProfile.email, mockProfile.location || "", "linkedin.com/in/thai-nguyen"].filter(Boolean),
    overall_score: 71,
    summary_message: `CV của bạn khớp khoảng 71% với "${job.title}" tại ${job.company}. Các dòng tô vàng cần nhấn mạnh ${skillList} để tăng độ phù hợp.`,
    top_priorities: [
      `Đưa ${topSkill} lên đầu phần kỹ năng và mục tiêu`,
      `Bổ sung từ khóa: ${skillList}`,
      "Định lượng thành tích khớp với yêu cầu công việc",
    ],
    sections: [
      {
        id: "t-sum", title: "Mục tiêu nghề nghiệp", score: 6, content_preview: "", issues: [], suggestions: [],
        items: [{
          id: "t-sum-0",
          text: "Sinh viên CNTT năm cuối đam mê công nghệ, mong muốn được học hỏi.",
          weak: true,
          issue: `Chưa nhắm tới vị trí ${job.title} và thiếu từ khóa ${topSkill}.`,
          suggestion: `Ứng viên ${job.title} với nền tảng ${topSkill} vững; thành thạo ${skillList}, sẵn sàng đóng góp ngay vào ${job.company}.`,
        }],
      },
      {
        id: "t-exp", title: "Kinh nghiệm", score: 7,
        subtitle: "Frontend Developer (Thực tập) · FPT Software · 06/2024 – 12/2024",
        content_preview: "", issues: [], suggestions: [],
        items: [
          {
            id: "t-exp-0",
            text: "Phụ trách xây dựng giao diện và sửa lỗi cho hệ thống nội bộ.",
            weak: true,
            issue: `Chưa thể hiện ${topSkill} mà vị trí ${job.title} yêu cầu.`,
            suggestion: `Phát triển 12+ màn hình bằng ${skillList}, đúng công nghệ ${job.company} đang dùng, theo quy trình Agile.`,
          },
          { id: "t-exp-1", text: "Giảm 30% thời gian tải trang nhờ code-splitting và lazy-loading.", weak: false },
        ],
      },
      {
        id: "t-skill", title: "Kỹ năng", score: 8, content_preview: "", issues: [], suggestions: [],
        items: [
          {
            id: "t-skill-0",
            text: "React · TypeScript · Next.js · Tailwind CSS · Git · Figma",
            weak: job.skills_required.length > 0,
            issue: `Nên sắp xếp để ${skillList} (yêu cầu của vị trí) xuất hiện trước.`,
            suggestion: `${skillList} · React · TypeScript · Git — đưa kỹ năng job cần lên đầu.`,
          },
        ],
      },
    ],
  };
}

/* ------------------------------- Resolver --------------------------------- */

const stripQuery = (p: string) => p.split("?")[0].replace(/\/$/, "") || "/";

/** Resolve a mock response for a given request. */
export function resolveMock(method: string, rawPath: string, body?: unknown): unknown {
  const path = stripQuery(rawPath);
  const m = method.toUpperCase();
  const b = (body ?? {}) as Record<string, unknown>;

  if (m === "GET") {
    if (path === "/profile") return mockProfile;
    if (path === "/analytics/user/activity") return mockUserActivity;
    if (path === "/applications/stats") return mockAppStats;
    if (path === "/applications") return mockApplications;
    if (path === "/analytics/market") return [{ data: mockMarket }];
    if (path === "/analytics/jobs/summary") return mockJobSummary;
    if (path === "/cv") return mockCvs;
    if (path.startsWith("/jobs/search")) return { jobs: mockJobs };
    if (path === "/jobs/saved") return { jobs: mockApplications.filter((a) => a.status === "bookmarked").map((a) => a.job_postings!) };

    let mm = path.match(/^\/cv\/([^/]+)\/suggestions$/);
    if (mm) return mockCvSuggestions;
    mm = path.match(/^\/cv\/([^/]+)$/);
    if (mm) return mockCvs.find((c) => c.id === mm![1]) ?? mockCvs[0];
    mm = path.match(/^\/jobs\/([^/]+)$/);
    if (mm) return findJob(mm[1]);
    return {};
  }

  if (m === "POST") {
    let mm = path.match(/^\/jobs\/([^/]+)\/evaluate-fit$/);
    if (mm) return mockFitEvaluation(mm[1]);
    if (/^\/jobs\/[^/]+\/mark-seen$/.test(path)) return {};
    if (path === "/jobs/crawl") return { total: mockJobs.length, by_source: {}, queries: 1 };
    if (path === "/cv/tailor") return mockTailoredAnalysis((b.job_posting_id as string) || "job-1");
    if (path === "/applications") {
      const app: Application = {
        id: `app-${Date.now()}`,
        user_id: "mock-user",
        status: (b.status as Application["status"]) || "bookmarked",
        company_name: (b.company_name as string) || "Công ty",
        role_title: (b.role_title as string) || "Vị trí",
        fit_score: (b.fit_score as number) ?? undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...b,
      } as Application;
      mockApplications.unshift(app);
      return app;
    }
    if (path === "/cv") {
      const cv: CV = {
        id: `cv-${Date.now()}`,
        user_id: "mock-user",
        title: (b.title as string) || "CV mới",
        target_role: (b.target_role as string) || undefined,
        target_company: undefined,
        profile_statement: "",
        sections: (b.sections as CV["sections"]) || [],
        html_content: cvHtml((b.title as string) || "CV mới", (b.target_role as string) || "Vị trí mục tiêu"),
        is_master: (b.is_master as boolean) || false,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockCvs.unshift(cv);
      return cv;
    }
    if (/^\/cv\/[^/]+\/analyze/.test(path)) return { suggestions: mockCvSuggestions };
    if (/^\/cv\/[^/]+\/suggestions\/apply$/.test(path)) return {};
    if (path === "/analytics/market/refresh") return mockMarket;
    if (path === "/profile/skills") return { id: `sk-${Date.now()}`, level: "intermediate", ...b } as Skill;
    if (path === "/profile/education" || path === "/profile/experience") return { id: `m-${Date.now()}`, ...b };
    if (path === "/cv/cover-letter/generate")
      return {
        content: "Kính gửi bộ phận tuyển dụng,\n\nTôi viết thư này để bày tỏ sự quan tâm đến vị trí... (nội dung mẫu)",
        html_content: "<p>Kính gửi bộ phận tuyển dụng,</p><p>Tôi viết thư này để bày tỏ sự quan tâm...</p>",
      };
    return b;
  }

  if (m === "PATCH") {
    const cvMatch = path.match(/^\/cv\/([^/]+)$/);
    if (cvMatch) {
      const cv = mockCvs.find((c) => c.id === cvMatch[1]);
      if (cv) Object.assign(cv, b, { updated_at: new Date().toISOString() });
      return cv ?? { id: cvMatch[1], ...b };
    }
    const appMatch = path.match(/^\/applications\/([^/]+)$/);
    if (appMatch) {
      const app = mockApplications.find((a) => a.id === appMatch[1]);
      if (app) Object.assign(app, b, { updated_at: new Date().toISOString() });
      return app ?? { id: appMatch[1], ...b };
    }
    return { ...b };
  }

  if (m === "PUT") return { ...b };
  if (m === "DELETE") return {};
  return {};
}

/** Stream a canned AI reply for the chat dock. */
export function mockStreamReply(message: string, contextType?: string): ReadableStreamDefaultReader<Uint8Array> {
  const replies: Record<string, string> = {
    job: "Dựa trên hồ sơ của bạn, vị trí này phù hợp khoảng **84%**. Điểm mạnh là nền tảng React và TypeScript. Bạn nên nhấn mạnh dự án thực tập tại FPT Software khi ứng tuyển.",
    cv: "CV của bạn khá tốt. Gợi ý: định lượng thành tích bằng số liệu cụ thể (ví dụ \"giảm 30% thời gian tải\") và bổ sung kỹ năng testing để khớp hơn với JD.",
    applications: "Bạn nên ưu tiên đơn ở trạng thái Phỏng vấn trước — hãy chuẩn bị kỹ vòng kỹ thuật với MoMo sắp tới. Đừng quên follow-up các đơn đã ứng tuyển quá 7 ngày.",
    market: "Thị trường hiện ưu tiên React + TypeScript. Mức lương frontend junior tại TP.HCM phổ biến 15–25 triệu. Kỹ năng testing đang là lợi thế cạnh tranh.",
    dashboard: "Bước tiếp theo: hoàn thiện CV chính, ứng tuyển thêm 2–3 vị trí phù hợp tuần này, và chuẩn bị cho buổi phỏng vấn sắp tới.",
    general: "Tôi là trợ lý AI của Vica. Tôi có thể giúp bạn đánh giá độ phù hợp với việc làm, cải thiện CV, và lên chiến lược ứng tuyển. Bạn muốn bắt đầu từ đâu?",
  };
  const text = replies[contextType || "general"] || replies.general;
  const tokens = text.split(/(\s+)/); // keep spaces
  const encoder = new TextEncoder();
  let i = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i >= tokens.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(tokens[i++]));
      return new Promise((r) => setTimeout(r, 28));
    },
  });
  return stream.getReader();
}
