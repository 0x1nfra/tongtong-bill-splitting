"use client";

import { use, useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { BillSummaryCard } from "@/components/BillSummaryCard";
import { CopyLinkField } from "@/components/CopyLinkField";

export default function SharePage({
  params,
}: {
  params: Promise<{ billId: string }>;
}) {
  const { billId } = use(params);
  const router = useRouter();
  const bill = useQuery(api.bills.getBillForMember, {
    billId: billId as Id<"bills">,
  });

  // SHARE-03: construct /c/[billId] URL inside useEffect — window.location is browser-only
  const [shareUrl, setShareUrl] = useState<string>("");
  useEffect(() => {
    setShareUrl(`${window.location.origin}/c/${billId}`);
  }, [billId]);

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

  // SHARE-01: display code derived from first 4 chars of Convex billId (uppercase)
  const displayCode = `#TT-${billId.slice(0, 4).toUpperCase()}`;

  // WhatsApp share URL — SHARE-04: recipients need no login
  const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(shareUrl)}`;

  return (
    <main className="min-h-screen bg-[--color-paper-table]">
      <div className="max-w-[480px] mx-auto px-4 py-8">
        {/* Page heading — SHARE-02 */}
        <h1 className="text-2xl font-bold uppercase text-[--color-ink] tracking-widest mb-6">
          SHARE THIS CHIT
        </h1>

        {/* Bill summary card — SHARE-02: displays bill title, item count, grand total */}
        <BillSummaryCard
          title={bill.title}
          items={bill.items}
          applySST={bill.applySST}
          applyServiceCharge={bill.applyServiceCharge}
          displayCode={displayCode}
        />

        {/* Send to friends section — SHARE-03 */}
        <p className="uppercase text-xs text-[--color-ink] opacity-60 mt-6 mb-2">
          SEND TO FRIENDS
        </p>

        {/* Copy link field with 2s COPIED! feedback — SHARE-03 */}
        <CopyLinkField url={shareUrl} />

        {/* WhatsApp share button — SHARE-04 */}
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex w-full h-12 bg-[--color-pen] text-white uppercase font-bold text-sm tracking-widest items-center justify-center rounded"
        >
          SEND TO WHATSAPP
        </a>

        {/* Dashboard navigation — D-09 */}
        <button
          type="button"
          onClick={() => router.push(`/dashboard/${billId}`)}
          className="mt-4 w-full text-center text-sm text-[--color-pen] underline py-2"
        >
          VIEW MY DASHBOARD
        </button>
      </div>
    </main>
  );
}
