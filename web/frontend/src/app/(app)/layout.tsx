"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { LayoutDashboard, Search, ClipboardList, FileText, MessageSquare, BarChart3, User, LogOut, Briefcase } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/jobs", icon: Search, label: "Tìm việc" },
  { href: "/applications", icon: ClipboardList, label: "Ứng tuyển" },
  { href: "/cv", icon: FileText, label: "CV Builder" },
  { href: "/chat", icon: MessageSquare, label: "AI Chat" },
  { href: "/analytics", icon: BarChart3, label: "Phân tích" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-surface flex font-sans">
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col fixed h-full z-40 shadow-card">
        <div className="px-5 py-4 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-btn-brand">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">Vica</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-brand-600 rounded-r-full" />
                )}
                <Icon className={`w-4 h-4 shrink-0 ${active ? "text-brand-600" : ""}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-100 space-y-0.5">
          <Link
            href="/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              pathname === "/profile"
                ? "bg-brand-50 text-brand-700"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            Hồ sơ
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-150 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
