"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { workflowSteps } from "@/lib/placeholder-data";
import { Icon, type IconName } from "./icon";

const navigation: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/cv-upload", label: "CV Upload", icon: "upload" },
  { href: "/cv-analysis", label: "CV Analysis", icon: "document" },
  { href: "/job-matches", label: "Job Matches", icon: "briefcase" },
  { href: "/cv-recommendations", label: "Recommendations", icon: "lightbulb" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeStep = workflowSteps.findIndex((step) => step.href === pathname);

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#1c2923]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(221,93,55,0.14),transparent_28rem),linear-gradient(110deg,transparent_0_48%,rgba(55,89,68,0.05)_48%_52%,transparent_52%)]" />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[#1c2923]/10 bg-[#173c31] px-5 py-6 text-white lg:flex">
        <Link href="/" className="flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#ef6a45] text-white">
            <Icon name="spark" className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-serif text-2xl leading-none">VICA</span>
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
              Career matching
            </span>
          </span>
        </Link>

        <nav className="mt-12 space-y-1.5">
          {navigation.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-white text-[#173c31] shadow-sm"
                    : "text-white/68 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon name={item.icon} className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/12 bg-white/6 p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#f6b49e]">
            <Icon name="shield" className="h-4 w-4" />
            MVP guardrail
          </div>
          <p className="mt-2 text-xs leading-5 text-white/58">
            Scores are deterministic. Suggestions never invent experience.
          </p>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-[#1c2923]/10 bg-[#f5f1e8]/92 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-serif text-xl">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#173c31] text-white">
              <Icon name="spark" className="h-4 w-4" />
            </span>
            VICA
          </Link>
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-[#1c2923]/55">
            {activeStep >= 0 ? `Step ${activeStep + 1} of 4` : "Career MVP"}
          </div>
        </div>
        <nav className="mx-auto mt-3 flex max-w-6xl gap-2 overflow-x-auto pb-1">
          {navigation.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  isActive ? "bg-[#173c31] text-white" : "bg-white/65 text-[#1c2923]/65"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="relative min-h-screen lg:pl-64">{children}</main>
    </div>
  );
}
