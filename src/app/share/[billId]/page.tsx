"use client";

import { use, useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { CopyLinkField } from "@/components/CopyLinkField";
import { calculateTotals } from "@/lib/calculateTotals";

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
      <main className="min-h-screen bg-paper-table flex items-center justify-center">
        <p className="text-sm font-bold uppercase text-ink tracking-widest">
          LOADING...
        </p>
      </main>
    );
  }

  if (bill === null) {
    return (
      <main className="min-h-screen bg-paper-table flex items-center justify-center">
        <div className="max-w-[480px] mx-auto px-4 py-12 text-center">
          <h1 className="text-xl font-bold uppercase text-ink tracking-widest mb-3">
            THIS BILL HAS BEEN TORN UP
          </h1>
          <p className="text-sm text-ink-muted">
            The link may have expired or the bill was closed.
          </p>
        </div>
      </main>
    );
  }

  // SHARE-01: display code derived from first 4 chars of Convex billId (uppercase)
  const displayCode = `#TT-${billId.slice(0, 4).toUpperCase()}`;

  const { subtotalCents, serviceChargeCents, sstCents, grandTotalCents } =
    calculateTotals(bill.items, bill.applySST, bill.applyServiceCharge);

  // WhatsApp share URL — SHARE-04: pre-filled Manglish message (BONUS-02)
  const manglishMessage = `Eh, join the bill lah! ${bill.title} — tap here to claim your items and see how much you owe:\n${shareUrl}\n\nSettle dulu k`;
  const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(manglishMessage)}`;

  return (
    <main className="min-h-screen bg-paper-table">
      <div className="max-w-[480px] mx-auto px-4 py-6">
        <div className="chit p-6">

          {/* HEADER ZONE */}
          <p
            className="text-[10px] font-bold tracking-widest text-ink-muted mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            tongtong.
          </p>
          <h1
            className="text-sm font-bold uppercase text-ink tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {bill.title || "UNTITLED BILL"}
          </h1>
          <p
            className="text-[10px] text-ink-muted mt-0.5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {displayCode}
          </p>

          <div className="perforation my-4" />

          {/* ITEMS ZONE */}
          <p
            className="text-xs font-bold uppercase text-ink-muted tracking-widest mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ITEMS
          </p>
          <div className="space-y-1">
            {bill.items.map((item, i) => (
              <div
                key={i}
                className="dot-leader flex justify-between text-sm text-ink"
              >
                <span>
                  {item.name}
                  {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                </span>
                <span>RM{((item.price * item.quantity) / 100).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="perforation my-4" />

          {/* TOTALS ZONE */}
          <p
            className="text-xs font-bold uppercase text-ink-muted tracking-widest mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            TOTALS
          </p>
          <div className="dot-leader flex justify-between text-sm text-ink mb-1">
            <span className="text-ink-muted">Subtotal</span>
            <span>RM{(subtotalCents / 100).toFixed(2)}</span>
          </div>
          {bill.applyServiceCharge && (
            <div className="dot-leader flex justify-between text-sm text-ink mb-1">
              <span className="text-ink-muted">Service Charge (10%)</span>
              <span>RM{(serviceChargeCents / 100).toFixed(2)}</span>
            </div>
          )}
          {bill.applySST && (
            <div className="dot-leader flex justify-between text-sm text-ink mb-1">
              <span className="text-ink-muted">SST (6%)</span>
              <span>RM{(sstCents / 100).toFixed(2)}</span>
            </div>
          )}
          <div className="dot-leader flex justify-between font-bold text-base text-ink border-t border-ink mt-2 pt-2">
            <span className="uppercase tracking-widest">GRAND TOTAL</span>
            <span>RM{(grandTotalCents / 100).toFixed(2)}</span>
          </div>

          <div className="perforation my-4" />

          {/* SHARE ZONE */}
          <p
            className="text-xs font-bold uppercase text-ink-muted tracking-widest mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            SEND TO FRIENDS
          </p>
          <CopyLinkField url={shareUrl} />
          <a
            href={shareUrl ? whatsAppUrl : undefined}
            onClick={!shareUrl ? (e) => e.preventDefault() : undefined}
            aria-disabled={!shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-3 flex w-full h-12 bg-pen text-white uppercase font-bold text-sm tracking-widest items-center justify-center${!shareUrl ? " opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
          >
            SEND TO WHATSAPP
          </a>

          <div className="perforation my-4" />

          {/* DASHBOARD NAV — D-09 */}
          <button
            type="button"
            onClick={() => router.push(`/dashboard/${billId}`)}
            className="w-full border border-ink text-ink h-10 uppercase text-xs font-bold tracking-widest cursor-pointer"
          >
            VIEW MY DASHBOARD
          </button>

        </div>
      </div>
    </main>
  );
}
