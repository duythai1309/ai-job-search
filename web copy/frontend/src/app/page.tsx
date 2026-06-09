import Link from "next/link";

const features = [
  {
    icon: "🔍",
    title: "Tìm việc từ nhiều nguồn",
    desc: "Tổng hợp việc làm từ VietnamWorks, TopCV, ITviec, CareerViet trong một nơi.",
  },
  {
    icon: "🤖",
    title: "Đánh giá độ phù hợp AI",
    desc: "Gemini AI phân tích hồ sơ và chấm điểm phù hợp với từng vị trí cụ thể.",
  },
  {
    icon: "📄",
    title: "CV builder thông minh",
    desc: "Xây dựng CV đẹp, nhận gợi ý cải thiện theo checkbox và xuất PDF chuyên nghiệp.",
  },
  {
    icon: "📊",
    title: "Theo dõi ứng tuyển",
    desc: "Kanban board theo dõi toàn bộ pipeline từ Saved → Applied → Interview → Offer.",
  },
  {
    icon: "💬",
    title: "Chatbot hỗ trợ 24/7",
    desc: "Hỏi chatbot về chiến lược tìm việc, chuẩn bị phỏng vấn và tư vấn nghề nghiệp.",
  },
  {
    icon: "📈",
    title: "Dashboard thị trường",
    desc: "Phân tích xu hướng tuyển dụng, mức lương và kỹ năng hot theo ngành.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-indigo-900 to-brand-900">
      <nav className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💼</span>
          <span className="text-white font-bold text-xl">JobViet AI</span>
        </div>
        <div className="flex gap-3">
          <Link
            href="/auth/login"
            className="text-white/80 hover:text-white px-4 py-2 rounded-lg transition"
          >
            Đăng nhập
          </Link>
          <Link
            href="/auth/register"
            className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-lg font-medium transition"
          >
            Đăng ký miễn phí
          </Link>
        </div>
      </nav>

      <main className="px-8 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-sm px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
          <span>✨</span>
          <span>Powered by Gemini AI</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Tìm việc thông minh
          <br />
          <span className="text-brand-400">với AI đồng hành</span>
        </h1>

        <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10">
          Từ tìm kiếm, đánh giá phù hợp, tạo CV đến theo dõi ứng tuyển —
          tất cả trong một nền tảng, hỗ trợ bởi AI tiên tiến.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <Link
            href="/auth/register"
            className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition shadow-lg shadow-brand-500/30"
          >
            Bắt đầu miễn phí →
          </Link>
          <Link
            href="/auth/login"
            className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition backdrop-blur-sm"
          >
            Đăng nhập
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-left hover:bg-white/15 transition"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center text-white/40 text-sm py-8">
        © 2024 JobViet AI · Powered by Gemini · Dữ liệu từ các cổng việc làm Việt Nam
      </footer>
    </div>
  );
}
