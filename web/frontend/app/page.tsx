import Link from "next/link";

import { Icon, type IconName } from "@/components/icon";
import { WorkflowProgress } from "@/components/workflow-progress";

const principles: Array<{
  icon: IconName;
  label: string;
  title: string;
  detail: string;
}> = [
  {
    icon: "document",
    label: "01 / Understand",
    title: "Start with the CV you already have.",
    detail: "Extract evidence, skills, projects, and gaps without turning the MVP into a CV generator.",
  },
  {
    icon: "search",
    label: "02 / Discover",
    title: "Find realistic Vietnam opportunities.",
    detail: "Browse internship and fresher roles with an explicit seeded fallback for reliable demos.",
  },
  {
    icon: "shield",
    label: "03 / Decide",
    title: "See a score you can explain.",
    detail: "Every fit score is deterministic, reproducible, and broken down by visible factors.",
  },
  {
    icon: "lightbulb",
    label: "04 / Improve",
    title: "Tailor the CV without inventing.",
    detail: "Recommendations cite evidence from both the candidate CV and the selected job.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <WorkflowProgress currentStep={-1} />

      <section className="relative mt-5 overflow-hidden rounded-[2rem] bg-[#173c31] px-6 py-12 text-white sm:px-10 md:py-16 lg:px-14">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full border-[42px] border-[#ef6a45]/55" />
        <div className="absolute -bottom-28 right-36 h-64 w-64 rounded-full bg-[#f4d7a5]/10 blur-2xl" />

        <div className="relative max-w-4xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#f6b49e]">
            Agentic career matching for Vietnam
          </p>
          <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-[0.92] tracking-[-0.05em] sm:text-6xl lg:text-8xl">
            Turn your CV into a focused job search.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-white/68 sm:text-lg">
            VICA helps students and fresh graduates understand their CV, discover relevant roles,
            compare fit, and improve the evidence that matters.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/cv-upload"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ef6a45] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#df5b38]"
            >
              Start with your CV
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
            <Link
              href="/job-matches"
              className="inline-flex items-center justify-center rounded-xl border border-white/18 bg-white/8 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/14"
            >
              Preview job matches
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {principles.map((principle, index) => (
          <article
            key={principle.label}
            className="group rounded-[1.6rem] border border-[#1c2923]/10 bg-white/72 p-6 shadow-[0_18px_60px_rgba(30,55,43,0.06)] backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex items-start justify-between gap-5">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dcebdd] text-[#24543f]">
                <Icon name={principle.icon} className="h-5 w-5" />
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#d95332]">
                {principle.label}
              </span>
            </div>
            <h2 className="mt-8 max-w-md font-serif text-3xl leading-tight tracking-[-0.03em] text-[#173c31]">
              {principle.title}
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[#365347]/76">{principle.detail}</p>
          </article>
        ))}
      </section>

      <footer className="mt-10 flex flex-col gap-2 border-t border-[#1c2923]/10 py-6 text-xs text-[#365347]/60 sm:flex-row sm:items-center sm:justify-between">
        <span>VICA MVP interface preview</span>
        <Link href="/api/health" className="font-bold text-[#24543f] hover:underline">
          Frontend health: /api/health
        </Link>
      </footer>
    </div>
  );
}
