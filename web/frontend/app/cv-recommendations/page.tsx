import Link from "next/link";

import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import { ScoreBar } from "@/components/score-bar";
import { ScoreRing } from "@/components/score-ring";
import { WorkflowProgress } from "@/components/workflow-progress";
import {
  cvRecommendationsPlaceholder,
  jobMatchesPlaceholder,
} from "@/lib/placeholder-data";

const priorityStyle = {
  high: "bg-[#f8e5df] text-[#9d4229]",
  medium: "bg-[#fff0ce] text-[#8b5a16]",
  low: "bg-[#dcebdd] text-[#24543f]",
};

export default function CvRecommendationsPage() {
  const selectedJob = jobMatchesPlaceholder[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <WorkflowProgress currentStep={3} />

      <div className="mt-9">
        <PageHeader
          eyebrow="Step 04 / Grounded improvements"
          title="Improve the evidence, not the story."
          description="Every suggestion below cites both the typed CV placeholder and the selected sample job. Unsupported achievements remain explicitly prohibited."
          action={
            <Link
              href="/job-matches"
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#1c2923]/12 bg-white/70 px-4 py-2.5 text-sm font-bold text-[#24543f]"
            >
              Choose another job
            </Link>
          }
        />
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <aside className="space-y-5">
          <div className="rounded-[1.75rem] bg-[#173c31] p-6 text-white">
            <div className="flex items-center gap-5">
              <ScoreRing score={selectedJob.fitScore} />
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#f6b49e]">
                  Selected match
                </p>
                <h2 className="mt-2 font-serif text-2xl leading-tight">{selectedJob.title}</h2>
                <p className="mt-1 text-sm text-white/58">{selectedJob.company}</p>
              </div>
            </div>

            <div className="mt-7 space-y-5 border-t border-white/12 pt-6">
              {selectedJob.scoreBreakdown.map((dimension) => (
                <div key={dimension.label} className="[&_*]:text-white">
                  <ScoreBar dimension={dimension} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#2d7455]/16 bg-[#edf5eb] p-5">
            <div className="flex gap-3 text-[#24543f]">
              <Icon name="shield" className="h-5 w-5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold">Grounding rule</h3>
                <p className="mt-2 text-xs leading-5 text-[#365347]/75">
                  Missing evidence becomes a gap or a question. It never becomes a fabricated CV claim.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="space-y-4">
          {cvRecommendationsPlaceholder.map((recommendation, index) => (
            <article
              key={recommendation.id}
              className="rounded-[1.65rem] border border-[#1c2923]/10 bg-white/78 p-5 shadow-[0_18px_60px_rgba(30,55,43,0.05)] sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#173c31] text-sm font-bold text-white">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#365347]/46">
                      {recommendation.targetSection}
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#173c31]">Recommended change</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase ${priorityStyle[recommendation.priority]}`}>
                  {recommendation.priority} priority
                </span>
              </div>

              <p className="mt-5 font-serif text-2xl leading-snug tracking-[-0.02em] text-[#173c31]">
                {recommendation.action}
              </p>
              <p className="mt-3 text-sm leading-6 text-[#365347]/74">{recommendation.reason}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-[#f2f0e9] p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#365347]/48">
                    CV evidence
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[#365347]">{recommendation.cvEvidence}</p>
                </div>
                <div className="rounded-xl bg-[#edf5eb] p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#24543f]">
                    Job evidence
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[#365347]">{recommendation.jobEvidence}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2 rounded-xl border border-[#d95332]/14 bg-[#fbebe5] p-3 text-xs leading-5 text-[#7f4332]">
                <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
                {recommendation.prohibitedClaims.join(" ")}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
