import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-5 border-b border-[#1c2923]/10 pb-7 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#d95332]">{eyebrow}</p>
        <h1 className="mt-3 font-serif text-4xl leading-[0.95] tracking-[-0.04em] text-[#173c31] md:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#365347] md:text-base">{description}</p>
      </div>
      {action}
    </header>
  );
}
