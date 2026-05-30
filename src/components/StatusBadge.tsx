"use client";

export type StatusValue =
  | "N/A"
  | "CONFIRMED"
  | "AWAITING"
  | "CLAIMED — UNPAID"
  | "UNCLAIMED ❋";

type StatusBadgeProps = Readonly<{
  status: StatusValue;
}>;

export function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass =
    status === "UNCLAIMED ❋"
      ? "text-warning" // amber — attention state, not celebratory
      : status === "N/A"
        ? "text-ink-muted"
        : "text-ink";

  return (
    <span className={`text-xs uppercase ${colorClass}`}>{status}</span>
  );
}
