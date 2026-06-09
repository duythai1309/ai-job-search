import Link from "next/link";

import { workflowSteps } from "@/lib/placeholder-data";
import { Icon } from "./icon";

export function WorkflowProgress({ currentStep }: { currentStep: number }) {
  return (
    <ol className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {workflowSteps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <li key={step.href}>
            <Link
              href={step.href}
              className={`flex h-full items-center gap-3 rounded-2xl border px-3 py-3 transition md:px-4 ${
                isCurrent
                  ? "border-[#173c31] bg-[#173c31] text-white"
                  : isComplete
                    ? "border-[#2d7455]/20 bg-[#dcebdd] text-[#24543f]"
                    : "border-[#1c2923]/10 bg-white/55 text-[#1c2923]/48 hover:bg-white"
              }`}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  isCurrent
                    ? "bg-[#ef6a45] text-white"
                    : isComplete
                      ? "bg-[#2d7455] text-white"
                      : "bg-[#1c2923]/8"
                }`}
              >
                {isComplete ? <Icon name="check" className="h-4 w-4" /> : index + 1}
              </span>
              <span className="text-xs font-bold md:text-sm">{step.shortLabel}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
