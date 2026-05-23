"use client";

import { use, useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

/**
 * useMemberSession — reads or generates the member session UUID for this bill.
 * AUTH-02: localStorage key `tongtong_session_${billId}`
 * Returns null on first render (SSR-safe); sets actual value in useEffect.
 */
function useMemberSession(billId: string): string | null {
  const [session, setSession] = useState<string | null>(null);
  useEffect(() => {
    const key = `tongtong_session_${billId}`;
    let stored = localStorage.getItem(key);
    if (!stored) {
      stored = crypto.randomUUID();
      localStorage.setItem(key, stored);
    }
    setSession(stored);
  }, [billId]);
  return session;
}

export default function MemberViewPage({
  params,
}: {
  params: Promise<{ billId: string }>;
}) {
  const { billId } = use(params);
  const router = useRouter();
  const _memberSession = useMemberSession(billId);
  const bill = useQuery(api.bills.getBillForMember, { billId: billId as Id<"bills"> });

  // D-05: if organizer opens member link from their own device, redirect to dashboard
  useEffect(() => {
    const secret = localStorage.getItem("tongtong_organizer_secret");
    if (secret) {
      router.replace(`/dashboard/${billId}`);
    }
  }, [billId, router]);

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

  return (
    <main className="min-h-screen bg-[--color-paper-table]">
      <div className="max-w-[480px] mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold uppercase text-[--color-ink] tracking-widest mb-2">
          {bill.title}
        </h1>
        <p className="text-xs text-[--color-ink] opacity-60 mb-6">
          {bill.items?.length ?? 0} item{(bill.items?.length ?? 0) !== 1 ? "s" : ""}
        </p>
        <div className="bg-[--color-paper-chit] p-4 mb-6">
          {bill.items?.map(
            (item: { _id: string; name: string; price: number; quantity: number }) => (
              <div
                key={item._id}
                className="flex justify-between text-sm text-[--color-ink] py-1"
              >
                <span>
                  {item.name} x{item.quantity}
                </span>
                <span>RM{((item.price * item.quantity) / 100).toFixed(2)}</span>
              </div>
            )
          )}
        </div>
        <button
          type="button"
          className="block w-full bg-[--color-pen] text-white uppercase font-bold text-sm tracking-widest py-3 min-h-[48px] flex items-center justify-center"
        >
          I&apos;VE PAID
        </button>
      </div>
    </main>
  );
}
