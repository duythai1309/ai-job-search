import Link from "next/link";

import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import { ScoreRing } from "@/components/score-ring";
import { WorkflowProgress } from "@/components/workflow-progress";
import { jobMatchesPlaceholder } from "@/lib/placeholder-data";

export default function JobMatchesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <WorkflowProgress currentStep={2} />

      <div className="mt-9">
        <PageHeader
          eyebrow="Step 03 / Vietnam job discovery"
          title="Compare opportunities with visible logic."
          description="These sample roles demonstrate the seeded fallback. Scores are typed placeholders shaped like the future deterministic scoring contract."
          action={
            <span className="w-fit rounded-full border border-[#2d7455]/20 bg-[#dcebdd] px-4 py-2 text-xs font-bold text-[#24543f]">
              3 sample matches
            </span>
          }
        />
      </div>

      <section className="mt-7 rounded-[1.5rem] border border-[#1c2923]/10 bg-white/72 p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <label className="flex items-center gap-3 rounded-xl border border-[#1c2923]/10 bg-[#faf8f2] px-4 py-3">
            <Icon name="search" className="h-5 w-5 text-[#365347]/55" />
            <input
              aria-label="Role or skill"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#365347]/40"
              placeholder="Frontend intern, React, Data..."
            />
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-[#1c2923]/10 bg-[#faf8f2] px-4 py-3">
            <Icon name="location" className="h-5 w-5 text-[#365347]/55" />
            <input
              aria-label="Location"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#365347]/40"
              placeholder="Vietnam location"
            />
          </label>
          <button
            type="button"
            className="rounded-xl bg-[#173c31] px-6 py-3 text-sm font-bold text-white opacity-60"
            title="Backend job search is not connected yet"
          >
            Search preview
          </button>
        </div>
        <p className="mt-3 text-xs text-[#365347]/52">
          Search controls are visual placeholders until the approved job-provider adapter is implemented.
        </p>
      </section>

      <div className="mt-6 space-y-4">
        {jobMatchesPlaceholder.map((job, index) => (
          <article
            key={job.id}
            className="rounded-[1.75rem] border border-[#1c2923]/10 bg-white/76 p-5 shadow-[0_18px_60px_rgba(30,55,43,0.055)] sm:p-7"
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <ScoreRing score={job.fitScore} size={index === 0 ? "large" : "small"} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#f8e5df] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#9d4229]">
                        {job.availabilityStatus} data
                      </span>
                      <span className="text-xs font-semibold text-[#365347]/48">{job.source}</span>
                    </div>
                    <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em] text-[#173c31]">{job.title}</h2>
                    <p className="mt-1 text-sm font-semibold text-[#365347]">{job.company}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-[#365347]/65">
                    <span className="rounded-full bg-[#eef4eb] px-3 py-1.5">{job.location}</span>
                    <span className="rounded-full bg-[#eef4eb] px-3 py-1.5">{job.employmentType}</span>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#24543f]">
                      Matched evidence
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {job.matchedSkills.map((skill) => (
                        <span key={skill} className="rounded-lg bg-[#dcebdd] px-2.5 py-1.5 text-xs font-semibold text-[#24543f]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#9d4229]">
                      Missing or unverified
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {job.missingSkills.map((skill) => (
                        <span key={skill} className="rounded-lg bg-[#f8e5df] px-2.5 py-1.5 text-xs font-semibold text-[#9d4229]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-[#1c2923]/8 pt-4">
                  <p className="text-xs text-[#365347]/52">
                    Deterministic preview based on skills, level, evidence, and location.
                  </p>
                  {index === 0 ? (
                    <Link
                      href="/cv-recommendations"
                      className="inline-flex items-center gap-2 text-sm font-bold text-[#d95332] hover:underline"
                    >
                      Improve CV for this job
                      <Icon name="arrow" className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="text-xs font-semibold text-[#365347]/42">Preview only</span>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
