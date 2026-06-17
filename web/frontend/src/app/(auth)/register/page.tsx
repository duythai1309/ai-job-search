"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";
import { User, Mail, Lock, CheckCircle2, ArrowRight, Inbox, RefreshCw } from "lucide-react";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error("Mật khẩu phải có ít nhất 6 ký tự"); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: "https://ai-job-search-seven.vercel.app/login",
      },
    });
    if (error) {
      toast.error(error.message);
    } else {
      setRegistered(true);
    }
    setLoading(false);
  }

  async function resendEmail() {
    setResending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) toast.error("Không thể gửi lại email");
    else toast.success("Đã gửi lại email xác thực");
    setResending(false);
  }

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left branding panel */}
      <div className="hidden lg:flex w-1/2 bg-primary-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(to right, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-700 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-500 rounded-full blur-3xl opacity-15" />
        <div className="relative">
          <Link href="/" className="flex items-center">
            <span className="font-bold text-white text-2xl tracking-tight">Vica</span>
          </Link>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Bắt đầu hành trình<br />nghề nghiệp của bạn
          </h2>
          <p className="text-primary-200 text-base leading-relaxed mb-8 font-body">
            Tạo tài khoản miễn phí và khám phá hàng nghìn cơ hội việc làm phù hợp với bạn.
          </p>
          <ul className="space-y-3">
            {["Hoàn toàn miễn phí, không cần thẻ tín dụng", "AI đánh giá CV và độ phù hợp tức thì", "Theo dõi tất cả đơn ứng tuyển một nơi"].map((item) => (
              <li key={item} className="flex items-center gap-3 text-white/80 text-sm font-body">
                <CheckCircle2 className="w-4 h-4 text-accent-400 shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-primary-400 text-xs font-body">© 2025 Vica · Dành cho sinh viên Việt Nam</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <span className="font-bold text-slate-900 text-2xl tracking-tight">Vica</span>
          </div>

          {registered ? (
            /* Email confirmation state — same page, same layout */
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-5">
                <Inbox className="w-7 h-7 text-brand-600" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">Kiểm tra hộp thư</h1>
              <p className="text-slate-500 text-sm font-body mb-1">Chúng tôi đã gửi email xác thực đến</p>
              <p className="font-semibold text-slate-800 text-sm mb-6">{email}</p>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left mb-6 space-y-3">
                {[
                  "Mở email từ Vica trong hộp thư",
                  'Nhấn vào nút "Xác thực tài khoản"',
                  "Đăng nhập và bắt đầu sử dụng",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-sm text-slate-700 font-body">{step}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-400 font-body mb-3">Không thấy email? Kiểm tra thư mục spam hoặc</p>
              <button
                onClick={resendEmail}
                disabled={resending}
                className="flex items-center gap-2 mx-auto text-sm text-brand-600 hover:text-brand-700 font-semibold disabled:opacity-50 cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                {resending ? "Đang gửi lại..." : "Gửi lại email xác thực"}
              </button>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-sm text-slate-500 font-body">
                  Đã xác thực?{" "}
                  <Link href="/auth/login" className="text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            /* Registration form */
            <>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Tạo tài khoản</h1>
              <p className="text-slate-500 text-sm mb-8 font-body">Miễn phí 100% · Không cần thẻ tín dụng</p>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Họ và tên</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-body"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ban@email.com"
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-body"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ít nhất 6 ký tự"
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-body"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all duration-150 shadow-btn-accent hover:shadow-none cursor-pointer mt-2"
                >
                  {loading ? "Đang tạo tài khoản..." : <><span>Tạo tài khoản miễn phí</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6 font-body">
                Đã có tài khoản?{" "}
                <Link href="/auth/login" className="text-primary-700 font-semibold hover:text-primary-900 transition-colors">
                  Đăng nhập
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
