"use client";

import { use, useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function DashboardPage({
  params,
}: {
  params: Promise<{ billId: string }>;
}) {
  const { billId } = use(params);
  const [organizerSecret, setOrganizerSecret] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("tongtong_organizer_secret");
    // setOrganizerSecret to stored value (may be null if not present on this device)
    setOrganizerSecret(stored ?? "");
  }, []);

  // T-02-01: skip query until secret is loaded from localStorage to prevent
  // unauthenticated request; Convex server will also verify the secret
  const bill = useQuery(
    api.bills.getBillForOrganizer,
    organizerSecret ? { billId: billId as Id<"bills">, organizerSecret } : "skip"
  );

  // organizerSecret is null while localStorage hasn't been read yet (SSR-safe)
  if (organizerSecret === null) {
    return (
      <main className="min-h-screen bg-[--color-paper-table] flex items-center justify-center">
        <p className="text-sm font-bold uppercase text-[--color-ink] tracking-widest">
          LOADING...
        </p>
      </main>
    );
  }

  // organizerSecret loaded but bill is still loading
  if (bill === undefined) {
    return (
      <main className="min-h-screen bg-[--color-paper-table] flex items-center justify-center">
        <p className="text-sm font-bold uppercase text-[--color-ink] tracking-widest">
          LOADING...
        </p>
      </main>
    );
  }

  // D-10: organizerSecret loaded but bill is null — wrong device or invalid secret
  if (bill === null) {
    return (
      <main className="min-h-screen bg-[--color-paper-table] flex items-center justify-center">
        <div className="max-w-[480px] mx-auto px-4 py-12 text-center">
          <h1 className="text-xl font-bold uppercase text-[--color-ink] tracking-widest mb-3">
            DASHBOARD NOT ACCESSIBLE
          </h1>
          <p className="text-sm text-[--color-ink] opacity-60">
            Dashboard access requires the device you used to create this chit.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[--color-paper-table]">
      <div className="max-w-[480px] mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold uppercase text-[--color-ink] tracking-widest mb-2">
          DASHBOARD
        </h1>
        <p className="text-sm text-[--color-ink] opacity-60 mb-6">
          {bill.bill?.title}
        </p>
        <p className="text-xs text-[--color-ink] opacity-40">
          Full dashboard UI coming in Plan 06.
        </p>
      </div>
    </main>
  );
}
