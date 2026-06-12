"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Search, ClipboardList, FileText,
  BarChart3, User, LogOut,
} from "lucide-react";
import ChatDock from "@/components/ui/chat-dock";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Tổng quan" },
  { href: "/jobs",      icon: Search,           label: "Tìm việc" },
  { href: "/applications", icon: ClipboardList, label: "Ứng tuyển" },
  { href: "/cv",        icon: FileText,          label: "CV Builder" },
  { href: "/analytics", icon: BarChart3,         label: "Thị trường" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [initials, setInitials] = useState("U");
  const [expanded, setExpanded] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data }) => {
      const full = data.user?.user_metadata?.full_name || "";
      const email = data.user?.email || "";
      setUserName(full || email.split("@")[0]);
      setUserEmail(email);
      const parts = full.trim().split(" ").filter(Boolean);
      if (parts.length >= 2) {
        setInitials((parts[0][0] + parts[parts.length - 1][0]).toUpperCase());
      } else if (full) {
        setInitials(full.slice(0, 2).toUpperCase());
      } else {
        setInitials(email.slice(0, 2).toUpperCase());
      }
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  // Label that fades/slides in as the rail expands
  const NavLabel = ({ children }: { children: React.ReactNode }) => (
    <span
      className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-out ${
        expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
      }`}
    >
      {children}
    </span>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex font-sans">
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onFocusCapture={() => setExpanded(true)}
        onBlurCapture={() => setExpanded(false)}
        className={`fixed h-full z-40 bg-white border-r border-slate-200/70 flex flex-col overflow-hidden transition-[width,box-shadow] duration-300 ease-out ${
          expanded ? "w-60 shadow-[8px_0_32px_rgba(15,23,42,0.06)]" : "w-[72px]"
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center border-b border-slate-200/70 shrink-0 px-[23px]">
          <Link href="/dashboard" className="flex items-baseline font-bold text-slate-900 text-xl tracking-tight">
            <span>V</span>
            <span
              className={`overflow-hidden transition-all duration-300 ease-out ${
                expanded ? "opacity-100 max-w-[3rem]" : "opacity-0 max-w-0"
              }`}
            >
              ica
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 py-4">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                title={expanded ? undefined : label}
                className={`flex items-center gap-3 h-11 px-[15px] rounded-xl text-sm font-medium transition-colors duration-200 ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <NavLabel>{label}</NavLabel>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 pt-2 border-t border-slate-200/70 space-y-1 shrink-0">
          <Link
            href="/profile"
            title={expanded ? undefined : "Hồ sơ cá nhân"}
            className={`flex items-center gap-3 h-11 px-[15px] rounded-xl text-sm font-medium transition-colors duration-200 ${
              pathname === "/profile"
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <User className="w-[18px] h-[18px] shrink-0" />
            <NavLabel>Hồ sơ cá nhân</NavLabel>
          </Link>

          <div className="flex items-center gap-2.5 h-14 px-[11px] rounded-xl bg-slate-50">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0 select-none">
              {initials}
            </div>
            <div
              className={`flex-1 min-w-0 transition-all duration-300 ease-out ${
                expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
              }`}
            >
              <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{userName || "User"}</p>
              <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">{userEmail}</p>
            </div>
            <button
              onClick={handleSignOut}
              tabIndex={expanded ? 0 : -1}
              className={`text-slate-300 hover:text-slate-900 transition-all duration-300 cursor-pointer shrink-0 p-1 ${
                expanded ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              title="Đăng xuất"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Content keeps the collapsed rail width — the sidebar expands over it.
          When the chat panel opens, content smoothly yields the right side. */}
      <main
        className={`ml-[72px] flex-1 min-h-screen transition-[margin] duration-300 ease-out ${
          chatOpen ? "lg:mr-[420px]" : "mr-0"
        }`}
      >
        <div key={pathname} className="animate-page-in">
          {children}
        </div>
      </main>

      <ChatDock open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
}
