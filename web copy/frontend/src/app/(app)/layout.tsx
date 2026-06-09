"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", label: "Tổng quan", icon: "📊" },
  { href: "/jobs", label: "Tìm việc", icon: "🔍" },
  { href: "/applications", label: "Ứng tuyển", icon: "📋" },
  { href: "/cv", label: "CV của tôi", icon: "📄" },
  { href: "/chat", label: "AI Chat", icon: "💬" },
  { href: "/analytics", label: "Thị trường", icon: "📈" },
  { href: "/profile", label: "Hồ sơ", icon: "👤" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">💼</span>
            <span className="font-bold text-navy-700 text-base">JobViet AI</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
                pathname.startsWith(item.href)
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-4">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition"
          >
            <span>🚪</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
