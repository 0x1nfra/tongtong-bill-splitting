"use client";

type StatsBarProps = Readonly<{
  confirmed: number;
  awaiting: number;
  claimed: number;
  unclaimed: number;
}>;

export function StatsBar({
  confirmed,
  awaiting,
  claimed,
  unclaimed,
}: StatsBarProps) {
  const stats = [
    { count: confirmed, label: "CONFIRMED" },
    { count: awaiting, label: "AWAITING" },
    { count: claimed, label: "CLAIMED" },
    { count: unclaimed, label: "UNCLAIMED" },
  ];

  return (
    <div className="flex border-t border-b border-[--color-ink] border-opacity-20 py-3 mt-4">
      {stats.map(({ count, label }) => (
        <div key={label} className="flex-1 text-center">
          <div className="text-lg font-bold text-[--color-ink]">{count}</div>
          <div className="text-xs uppercase text-[--color-ink] opacity-60 mt-0.5">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
