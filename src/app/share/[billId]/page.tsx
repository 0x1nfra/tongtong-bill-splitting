"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";

export default function SharePage({
  params,
}: {
  params: Promise<{ billId: string }>;
}) {
  const { billId } = use(params);
  const router = useRouter();
  const bill = useQuery(api.bills.getBillForMember, { billId });

  if (bill === undefined) {
    return (
      <main className="min-h-screen bg-[--color-paper-table] flex items-center justify-center">
        <p className="text-sm font-bold uppercase text-[--color-ink] tracking-widest">
          LOADING...
        </p>
      </main>
    );
  }

  if (bill === null) {
    return (
      <main className="min-h-screen bg-[--color-paper-table] flex items-center justify-center">
        <div className="max-w-[480px] mx-auto px-4 py-12 text-center">
          <h1 className="text-xl font-bold uppercase text-[--color-ink] tracking-widest mb-3">
            THIS CHIT HAS BEEN TORN UP
          </h1>
          <p className="text-sm text-[--color-ink] opacity-60">
            The link may have expired or the chit was closed.
          </p>
        </div>
      </main>
    );
  }

  const displayCode = `#TT-${billId.slice(0, 4).toUpperCase()}`;

  return (
    <main className="min-h-screen bg-[--color-paper-table]">
      <div className="max-w-[480px] mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold uppercase text-[--color-ink] tracking-widest mb-2">
          SHARE THIS CHIT
        </h1>
        <p className="text-xs text-[--color-ink] opacity-60 mb-6">
          {displayCode}
        </p>
        <div className="bg-[--color-paper-chit] p-4 mb-6">
          <p className="text-sm font-bold uppercase text-[--color-ink] tracking-wide">
            {bill.title}
          </p>
        </div>
        <button
          type="button"
          className="block w-full bg-[--color-pen] text-white uppercase font-bold text-sm tracking-widest py-3 min-h-[48px] flex items-center justify-center mb-3"
        >
          COPY LINK
        </button>
        <button
          type="button"
          onClick={() => router.push(`/dashboard/${billId}`)}
          className="block w-full text-center text-sm text-[--color-pen] font-bold uppercase tracking-widest py-2 min-h-[44px] flex items-center justify-center"
        >
          VIEW MY DASHBOARD
        </button>
      </div>
    </main>
  );
}
