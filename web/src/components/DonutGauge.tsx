"use client";

interface DonutGaugeProps {
  label: string;
  value: number;
}

function getStrokeColor(score: number): string {
  if (score >= 75) return "#0F766E";
  if (score >= 50) return "#B45309";
  return "#B91C1C";
}

export function DonutGauge({ label, value }: DonutGaugeProps) {
  const safeVal = Number.isFinite(value) ? value : 0;
  const clamped = Math.max(0, Math.min(100, Math.round(safeVal)));
  const size = 76;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;
  const color = getStrokeColor(clamped);

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-[76px] w-[76px] items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          role="img"
          aria-label={`${label} ${clamped}%`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E6E9EF"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeOpacity={clamped === 0 ? 0 : 1}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-200 ease-out"
          />
        </svg>
        <span className="absolute text-[15px] font-semibold text-[#0F172A] tabular-nums">
          {clamped}%
        </span>
      </div>
      <span className="mt-2 text-center text-[12px] font-medium text-[#475569]">
        {label}
      </span>
    </div>
  );
}
