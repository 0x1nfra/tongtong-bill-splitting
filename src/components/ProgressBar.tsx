"use client";

type ProgressBarProps = Readonly<{
  collectedCents: number;
  totalCents: number;
}>;

export function ProgressBar({ collectedCents, totalCents }: ProgressBarProps) {
  const pct =
    totalCents > 0
      ? Math.min(100, (collectedCents / totalCents) * 100)
      : 0;

  const collectedDisplay = (collectedCents / 100).toFixed(2);
  const totalDisplay = (totalCents / 100).toFixed(2);

  return (
    <div>
      {/* Label row */}
      <div className="flex justify-between items-center mb-1">
        <span className="uppercase text-xs text-ink font-bold tracking-widest">
          TOTAL COLLECTED
        </span>
        <span className="text-xs text-ink">
          RM{collectedDisplay} / RM{totalDisplay}
        </span>
      </div>

      {/* Progress track */}
      <div
        className="w-full h-2 rounded"
        style={{ backgroundColor: "color-mix(in srgb, var(--color-ink) 20%, transparent)" }}
      >
        {/* Blue fill — DASH-01 */}
        <div
          className="h-2 bg-pen rounded transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
