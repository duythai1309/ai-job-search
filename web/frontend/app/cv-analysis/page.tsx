import Link from "next/link";

import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import { WorkflowProgress } from "@/components/workflow-progress";
import { cvAnalysisPlaceholder } from "@/lib/placeholder-data";

const sectionStyle = {
  strong: "bg-[#dcebdd] text-[#24543f]",
  review: "bg-[#fff0ce] text-[#8b5a16]",
  missing: "bg-[#f5dfd7] text-[#9d4229]",
};

export default function CvAnalysisPage() {
  const analysis = cvAnalysisPlaceholder;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <WorkflowProgress currentStep={1} />

      <div className="mt-9">
        <PageHeader
          eyebrow="Step 02 / Structured review"
          title="See what the CV actually proves."
          description="This screen uses typed placeholder data. The production analysis will validate extracted JSON before any result reaches the interface."
          action={
            <span className="w-fit rounded-full border border-[#d95332]/20 bg-[#f8e5df] px-4 py-2 text-xs font-bold text-[#9d4229]">
              Preview data
            </span>
          }
        />
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[1.75rem] bg-[#173c31] p-7 text-white">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#f6b49e]">
            Candidate snapshot
          </p>
          <h2 className="mt-5 font-serif text-4xl tracking-[-0.04em]">{analysis.candidateName}</h2>
          <p className="mt-2 text-sm font-semibold text-[#b8d3c1]">{analysis.targetRole}</p>
          <p className="mt-6 text-sm leading-7 text-white/68">{analysis.profileSummary}</p>

          <div className="mt-7 border-t border-white/12 pt-6">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/42">Detected skills</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {analysis.skills.map((skill) => (
                <span key={skill} className="rounded-full bg-white/9 px-3 py-1.5 text-xs font-semibold text-white/82">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-[1.5rem] border border-[#2d7455]/14 bg-[#edf5eb] p-6">
            <div className="flex items-center gap-2 text-[#24543f]">
              <Icon name="check" className="h-5 w-5" />
              <h2 className="font-bold">Evidence strengths</h2>
            </div>
            <ul className="mt-5 space-y-4">
              {analysis.strengths.map((strength) => (
                <li key={strength} className="flex gap-3 text-sm leading-6 text-[#365347]">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2d7455]" />
                  {strength}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[1.5rem] border border-[#d95332]/14 bg-[#fbebe5] p-6">
            <div className="flex items-center gap-2 text-[#9d4229]">
              <Icon name="search" className="h-5 w-5" />
              <h2 className="font-bold">Evidence gaps</h2>
            </div>
            <ul className="mt-5 space-y-4">
              {analysis.gaps.map((gap) => (
                <li key={gap} className="flex gap-3 text-sm leading-6 text-[#6d463a]">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d95332]" />
                  {gap}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="mt-6 rounded-[1.75rem] border border-[#1c2923]/10 bg-white/72 p-6 sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#d95332]">Section coverage</p>
            <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#173c31]">Extraction confidence</h2>
          </div>
          <p className="text-xs text-[#365347]/55">Source: {analysis.fileName}</p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {analysis.sections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-[#1c2923]/8 bg-[#faf8f2] p-5">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold text-[#1c2923]">{section.title}</h3>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ${sectionStyle[section.status]}`}>
                  {section.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#365347]/72">{section.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-7 flex justify-end">
        <Link
          href="/job-matches"
          className="inline-flex items-center gap-2 rounded-xl bg-[#ef6a45] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#df5b38]"
        >
          View job matches
          <Icon name="arrow" className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
