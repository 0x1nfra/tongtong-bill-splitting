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
      ? "text-stamp" // #B91C1C — permitted red per UI-SPEC
      : status === "N/A"
        ? "text-ink opacity-40"
        : "text-ink";

  return (
    <span className={`text-xs uppercase ${colorClass}`}>{status}</span>
  );
}
