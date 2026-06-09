"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import { WorkflowProgress } from "@/components/workflow-progress";

export default function CvUploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <WorkflowProgress currentStep={0} />

      <div className="mt-9">
        <PageHeader
          eyebrow="Step 01 / CV intake"
          title="Bring the CV you already use."
          description="PDF is the first supported format. This frontend preview keeps the file in your browser only and does not upload it to the backend."
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-[1.75rem] border border-[#1c2923]/10 bg-white/78 p-5 shadow-[0_20px_70px_rgba(30,55,43,0.07)] sm:p-8">
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="group grid min-h-80 w-full place-items-center rounded-[1.5rem] border border-dashed border-[#2d7455]/35 bg-[#eef4eb] px-6 text-center transition hover:border-[#2d7455] hover:bg-[#e6f0e4]"
          >
            <span>
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#173c31] text-white shadow-lg shadow-[#173c31]/15 transition group-hover:-translate-y-1">
                <Icon name={fileName ? "check" : "upload"} className="h-7 w-7" />
              </span>
              <span className="mt-6 block font-serif text-3xl tracking-[-0.03em] text-[#173c31]">
                {fileName ?? "Choose a PDF CV"}
              </span>
              <span className="mx-auto mt-3 block max-w-md text-sm leading-6 text-[#365347]/68">
                {fileName
                  ? "Selected locally. Backend upload and extraction will be connected in Task 002."
                  : "Select a clear, text-based PDF. Scanned image-only documents are not part of this preview."}
              </span>
              <span className="mt-5 inline-block rounded-full bg-white px-4 py-2 text-xs font-bold text-[#24543f] shadow-sm">
                {fileName ? "Choose another file" : "Browse files"}
              </span>
            </span>
          </button>

          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#e58b2a]/20 bg-[#fff4dd] p-4 text-sm text-[#70501f] sm:flex-row sm:items-start">
            <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="leading-6">
              CV content is untrusted private input. Production logging will keep only opaque IDs,
              status codes, and redacted error categories.
            </p>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[1.5rem] bg-[#173c31] p-6 text-white">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#f6b49e]">
              What happens next
            </p>
            <ol className="mt-5 space-y-5">
              {[
                "Extract readable text",
                "Identify evidence and sections",
                "Validate the structured result",
              ].map((item, index) => (
                <li key={item} className="flex gap-3 text-sm leading-5 text-white/75">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-[10px] font-bold text-white">
                    {index + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-[1.5rem] border border-[#1c2923]/10 bg-white/70 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#365347]/55">Preview path</p>
            <p className="mt-3 text-sm leading-6 text-[#365347]/75">
              Continue with typed placeholder data to review the intended analysis experience.
            </p>
            <Link
              href="/cv-analysis"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#d95332] hover:underline"
            >
              Preview CV analysis
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
