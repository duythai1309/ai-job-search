"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";
import { Mail, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Email hoặc mật khẩu không đúng" : error.message);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const destination = user?.user_metadata?.onboarding_completed ? "/dashboard" : "/onboarding";
      router.push(destination);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex font-sans">
      <div className="hidden lg:flex w-1/2 bg-[#001E36] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background graphic */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-85 transition-transform duration-1000 hover:scale-105"
          style={{
            backgroundImage: "url('/vinuni-graphic.jpg')",
          }}
        />
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#001E36]/60 via-[#001E36]/30 to-[#001E36]/80 pointer-events-none" />
        
        {/* Gold stripe to anchor VinUni branding */}
        <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#DEB25E] via-[#C8953C] to-[#DEB25E]" />

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex flex-col justify-between h-full w-full"
        >
          <div className="relative">
            <Link href="/" className="flex items-center gap-1.5 font-bold text-white text-2xl tracking-tight">
              <img src="/vinuni-logo-v-white.png" alt="VinUniversity Logo" className="w-8 h-8 object-contain" />
              <span>ica</span>
            </Link>
          </div>
          <div className="relative">
            <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Tìm việc thông minh<br />với AI
            </h2>
            <p className="text-blue-100/90 text-sm leading-relaxed mb-8 font-body">
              Nền tảng tìm việc AI dành riêng cho sinh viên Việt Nam — từ tìm kiếm đến offer.
            </p>
            <ul className="space-y-3">
              {["Tổng hợp từ 4 cổng việc làm lớn nhất", "AI đánh giá độ phù hợp chi tiết", "CV builder & cover letter thông minh"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-white/90 text-sm font-body">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="relative text-blue-200/80 text-xs font-body">© 2025 Vica · Miễn phí cho sinh viên</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 flex items-center justify-center px-6 py-12 bg-white"
      >
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-1.5 font-bold text-slate-900 text-2xl tracking-tight">
              <img src="/vinuni-logo-v.png" alt="VinUniversity Logo" className="w-8 h-8 object-contain" />
              <span>ica</span>
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Đăng nhập</h1>
          <p className="text-slate-500 text-sm mb-8 font-body">Chào mừng trở lại! Vui lòng nhập thông tin của bạn.</p>

          <form onSubmit={handleLogin} className="space-y-4">
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
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-body"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all duration-150 shadow-btn-accent hover:shadow-none cursor-pointer mt-2"
            >
              {loading ? "Đang đăng nhập..." : <><span>Đăng nhập</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6 font-body">
            Chưa có tài khoản?{" "}
            <Link href="/auth/register" className="text-primary-700 font-semibold hover:text-primary-900 transition-colors">
              Đăng ký miễn phí
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
