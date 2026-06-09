import Link from "next/link";
import { Briefcase, Sparkles, FileText, BarChart3, MessageSquare, TrendingUp, ArrowRight, CheckCircle2, MapPin, Star } from "lucide-react";

const features = [
  { icon: <Briefcase className="w-5 h-5" />, title: "Tổng hợp từ 4 cổng việc làm", desc: "VietnamWorks, TopCV, ITviec, CareerViet — tìm một lần, thấy tất cả.", color: "bg-sky-50 text-sky-600" },
  { icon: <Sparkles className="w-5 h-5" />, title: "AI đánh giá độ phù hợp", desc: "AI chấm điểm và giải thích chi tiết tại sao bạn phù hợp với vị trí đó.", color: "bg-violet-50 text-violet-600" },
  { icon: <FileText className="w-5 h-5" />, title: "CV builder thông minh", desc: "Xây dựng CV, nhận gợi ý cải thiện theo checkbox, xuất PDF chuyên nghiệp.", color: "bg-emerald-50 text-emerald-600" },
  { icon: <BarChart3 className="w-5 h-5" />, title: "Theo dõi ứng tuyển", desc: "Kanban board theo dõi toàn bộ pipeline từ Saved → Applied → Interview → Offer.", color: "bg-fuchsia-50 text-fuchsia-600" },
  { icon: <MessageSquare className="w-5 h-5" />, title: "AI Chat hỗ trợ 24/7", desc: "Tư vấn chiến lược tìm việc, chuẩn bị phỏng vấn và định hướng nghề nghiệp.", color: "bg-rose-50 text-rose-600" },
  { icon: <TrendingUp className="w-5 h-5" />, title: "Dashboard thị trường", desc: "Phân tích xu hướng tuyển dụng, mức lương, kỹ năng hot theo từng ngành.", color: "bg-amber-50 text-amber-600" },
];

const stats = [
  { value: "4+", label: "Cổng việc làm" },
  { value: "10k+", label: "Việc làm mới / tuần" },
  { value: "AI", label: "Đánh giá tự động" },
  { value: "100%", label: "Miễn phí" },
];

const benefits = [
  "Không cần tìm trên nhiều trang",
  "AI chỉ ra chính xác điểm mạnh / yếu của bạn",
  "CV được tối ưu cho từng vị trí",
  "Theo dõi tất cả đơn ứng tuyển một chỗ",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">Vica</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="text-slate-600 hover:text-slate-900 px-4 py-2 text-sm font-medium transition-colors duration-150">Đăng nhập</Link>
            <Link href="/auth/register" className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 shadow-btn-cta hover:shadow-none">Bắt đầu miễn phí</Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/60 to-white pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(#4338CA 1px, transparent 1px), linear-gradient(to right, #4338CA 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="absolute top-16 right-0 w-[480px] h-[480px] bg-brand-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-emerald-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-8 tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            Nền tảng AI tìm việc cho sinh viên Việt Nam
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.05] tracking-tight mb-6">
            Tìm việc thông minh<br />
            <span className="text-brand-600">dành cho sinh viên</span><br />
            <span className="text-emerald-500">Việt Nam.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-body">
            Từ tìm kiếm, đánh giá độ phù hợp AI, tạo CV đến theo dõi ứng tuyển — tất cả trong một nền tảng, hoàn toàn miễn phí.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-base transition-all duration-200 shadow-btn-cta hover:shadow-none hover:-translate-y-0.5">
              Bắt đầu miễn phí <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/auth/login" className="inline-flex items-center justify-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 px-8 py-4 rounded-xl font-semibold text-base transition-all duration-200 hover:bg-slate-50">
              Đã có tài khoản
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-extrabold text-brand-600 mb-1">{s.value}</div>
                <div className="text-xs text-slate-500 font-medium font-body">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Mọi thứ bạn cần để tìm việc</h2>
            <p className="text-slate-500 max-w-lg mx-auto font-body">Được thiết kế riêng cho sinh viên mới ra trường tại thị trường Việt Nam</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 cursor-default" style={{ animationDelay: `${i * 50}ms` }}>
                <div className={`w-10 h-10 ${f.color} rounded-xl flex items-center justify-center mb-4`}>{f.icon}</div>
                <h3 className="font-bold text-slate-900 text-base mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-body">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block bg-brand-100 text-brand-700 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest mb-6">Tại sao chọn Vica?</div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-6">Không chỉ là trang tìm việc</h2>
              <p className="text-slate-500 mb-8 leading-relaxed font-body">Vica là người đồng hành nghề nghiệp — từ lúc bạn còn chưa biết bắt đầu từ đâu, đến khi nhận được offer đầu tiên.</p>
              <ul className="space-y-3">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700 text-sm font-medium font-body">{b}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/register" className="inline-flex items-center gap-2 mt-10 bg-brand-700 hover:bg-brand-900 text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 shadow-btn-brand">
                Dùng thử ngay — Miễn phí <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="relative">
              <div className="bg-brand-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-700 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-white/60 font-body">Đánh giá AI</div>
                      <div className="font-bold text-sm">Frontend Developer @ Tiki</div>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    {[{ label: "Kỹ năng kỹ thuật", score: 82 }, { label: "Kinh nghiệm", score: 65 }, { label: "Văn hóa & hành vi", score: 78 }].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1.5 font-body">
                          <span className="text-white/70">{item.label}</span>
                          <span className="text-white font-semibold">{item.score}/100</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${item.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                    <div className="text-xs text-white/60 mb-1 font-body">Nhận xét AI</div>
                    <p className="text-white text-sm leading-relaxed font-body">Bạn có nền tảng React tốt. Cần bổ sung kinh nghiệm TypeScript và quen với CI/CD để cạnh tranh tốt hơn.</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}</div>
                    <span className="text-white/60 text-xs font-body">Phù hợp cao</span>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-card-hover px-4 py-3 border border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-600" />
                  <span className="text-xs font-semibold text-slate-700">Hà Nội · TP.HCM · Remote</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-br from-brand-700 to-brand-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500 rounded-full blur-3xl opacity-10 pointer-events-none" />
        <div className="max-w-2xl mx-auto text-center relative">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">Sẵn sàng bắt đầu?</h2>
          <p className="text-brand-200 mb-8 font-body">Tạo tài khoản miễn phí và bắt đầu tìm kiếm việc làm ngay hôm nay.</p>
          <Link href="/auth/register" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-4 rounded-xl font-bold text-base transition-all duration-200 shadow-btn-cta hover:-translate-y-0.5">
            Đăng ký miễn phí <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="bg-brand-900 border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-700 rounded-md flex items-center justify-center">
              <Briefcase className="w-3 h-3 text-white" />
            </div>
            <span className="text-white/60 text-sm font-body">Vica · 2025</span>
          </div>
          <p className="text-white/30 text-xs font-body">VietnamWorks · TopCV · ITviec · CareerViet</p>
        </div>
      </footer>
    </div>
  );
}
