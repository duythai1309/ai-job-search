import type { ScoreDimension } from "@/lib/types";

export function ScoreBar({ dimension }: { dimension: ScoreDimension }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#1c2923]">{dimension.label}</p>
          <p className="mt-1 text-xs leading-5 text-[#365347]/70">{dimension.detail}</p>
        </div>
        <span className="font-serif text-xl text-[#173c31]">{dimension.score}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#1c2923]/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#2d7455] to-[#73a57e]"
          style={{ width: `${dimension.score}%` }}
        />
      </div>
    </div>
  );
}
