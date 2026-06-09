export function ScoreRing({
  score,
  size = "large",
}: {
  score: number;
  size?: "small" | "large";
}) {
  const diameter = size === "large" ? 112 : 76;
  const stroke = size === "large" ? 9 : 7;
  const radius = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: diameter, height: diameter }}>
      <svg className="-rotate-90" width={diameter} height={diameter}>
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke="rgba(28,41,35,0.09)"
          strokeWidth={stroke}
        />
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke={score >= 75 ? "#2d7455" : score >= 60 ? "#e58b2a" : "#d95332"}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className={`${size === "large" ? "text-3xl" : "text-xl"} font-black text-[#173c31]`}>
            {score}
          </div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-[#365347]/55">fit</div>
        </div>
      </div>
    </div>
  );
}
