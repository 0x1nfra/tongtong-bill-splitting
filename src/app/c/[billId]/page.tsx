"use client";

import { use, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { SettleStamp } from "../../../components/SettleStamp";

/**
 * calculateTotals — client-side bill total calculation (Pattern 7 from RESEARCH.md).
 * Service charge (10%) applied to subtotal first, then SST (6%) on post-service-charge
 * total (Malaysian restaurant convention).
 */
function calculateTotals(
  items: Array<{ price: number; quantity: number }>,
  applySST: boolean,
  applyServiceCharge: boolean
) {
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const serviceChargeCents = applyServiceCharge
    ? Math.round(subtotalCents * 0.1)
    : 0;
  const afterServiceCharge = subtotalCents + serviceChargeCents;
  const sstCents = applySST ? Math.round(afterServiceCharge * 0.06) : 0;
  const grandTotalCents = afterServiceCharge + sstCents;

  return {
    subtotalCents,
    serviceChargeCents,
    sstCents,
    grandTotalCents,
    subtotal: (subtotalCents / 100).toFixed(2),
    serviceCharge: (serviceChargeCents / 100).toFixed(2),
    sst: (sstCents / 100).toFixed(2),
    grandTotal: (grandTotalCents / 100).toFixed(2),
  };
}

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
  const claimantSession = useMemberSession(billId);

  const [claimantName, setClaimantName] = useState<string>("");
  const [isPaying, setIsPaying] = useState<boolean>(false);

  const bill = useQuery(api.bills.getBillForMember, {
    billId: billId as Id<"bills">,
  });

  // PAY-02: subscribe to member's own payment status for real-time stamp state machine
  const payment = useQuery(
    api.payments.getMyPayment,
    claimantSession
      ? { billId: billId as Id<"bills">, claimantSession }
      : "skip"
  );

  const markPaid = useMutation(api.payments.markPaid);

  // D-05: if organizer opens member link from their own device, redirect to dashboard
  useEffect(() => {
    const secret = localStorage.getItem("tongtong_organizer_secret");
    if (secret) {
      router.replace(`/dashboard/${billId}`);
    }
  }, [billId, router]);

  /**
   * handlePay — PAY-01: call markPaid mutation to create pending payment record.
   * Guards: claimantSession must be loaded, claimantName must be non-empty.
   * T-05-04: client-side empty name guard.
   */
  const handlePay = async () => {
    if (!claimantSession || !claimantName.trim()) return;
    setIsPaying(true);
    try {
      await markPaid({
        billId: billId as Id<"bills">,
        claimantSession,
        claimantName: claimantName.trim(),
      });
    } catch (err) {
      // WR-03: log error so failures are not silent; button re-enables via finally
      console.error("Failed to mark as paid:", err);
    } finally {
      setIsPaying(false);
    }
  };

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

  const totals = calculateTotals(
    bill.items ?? [],
    bill.applySST,
    bill.applyServiceCharge
  );

  const paymentStatus = payment?.status ?? null;
  const showPayForm =
    paymentStatus === null || paymentStatus === "rejected";
  const isButtonDisabled =
    !claimantSession || !claimantName.trim() || isPaying || payment?.status === "pending" || payment?.status === "settled";

  return (
    <main className="min-h-screen bg-[--color-paper-table]">
      <div className="max-w-[480px] mx-auto px-4 py-6">
        {/* Bill header */}
        <h1 className="text-xl font-bold uppercase text-[--color-ink] tracking-widest mb-1">
          {bill.title}
        </h1>
        <p className="text-xs text-[--color-ink] opacity-60 mb-6 uppercase tracking-widest">
          {"#TT-" + billId.slice(0, 4).toUpperCase()}
        </p>

        {/* Items list */}
        <div className="bg-[--color-paper-chit] p-4 mb-4">
          <p className="text-xs font-bold uppercase text-[--color-ink] tracking-widest mb-3 opacity-60">
            ITEMS
          </p>
          {(bill.items ?? []).map(
            (item: {
              _id: string;
              name: string;
              price: number;
              quantity: number;
            }) => (
              <div
                key={item._id}
                className="flex justify-between text-sm text-[--color-ink] py-1 border-b border-[--color-ink] opacity-80"
              >
                <span className="flex-1">
                  {item.name}
                  {item.quantity > 1 ? (
                    <span className="opacity-60 ml-1">x{item.quantity}</span>
                  ) : null}
                </span>
                <span className="font-bold">
                  RM{((item.price * item.quantity) / 100).toFixed(2)}
                </span>
              </div>
            )
          )}
        </div>

        {/* DuitNow QR (PAY-03) */}
        {bill.qrUrl ? (
          <div className="mb-4 text-center">
            <p className="text-xs font-bold uppercase text-[--color-ink] tracking-widest mb-2 opacity-60">
              SCAN TO PAY
            </p>
            <img
              src={bill.qrUrl}
              alt="DuitNow QR"
              className="w-[200px] h-[200px] object-contain mx-auto"
            />
          </div>
        ) : null}

        {/* YOUR TOTAL section */}
        <div className="bg-[--color-paper-chit] p-4 mb-6">
          <p className="text-xs font-bold uppercase text-[--color-ink] tracking-widest mb-3 opacity-60">
            YOUR TOTAL
          </p>

          {/* Subtotal row */}
          <div className="flex justify-between text-sm text-[--color-ink] mb-1">
            <span className="opacity-60">Subtotal</span>
            <span>RM{totals.subtotal}</span>
          </div>

          {/* Service charge row (shown only if applicable) */}
          {bill.applyServiceCharge ? (
            <div className="flex justify-between text-sm text-[--color-ink] mb-1">
              <span className="opacity-60">Service Charge (10%)</span>
              <span>RM{totals.serviceCharge}</span>
            </div>
          ) : null}

          {/* SST row (shown only if applicable) */}
          {bill.applySST ? (
            <div className="flex justify-between text-sm text-[--color-ink] mb-1">
              <span className="opacity-60">SST (6%)</span>
              <span>RM{totals.sst}</span>
            </div>
          ) : null}

          {/* Grand total row */}
          <div className="flex justify-between font-bold text-base text-[--color-ink] border-t border-[--color-ink] mt-2 pt-2">
            <span className="uppercase tracking-widest">GRAND TOTAL</span>
            <span>RM{totals.grandTotal}</span>
          </div>
        </div>

        {/* SettleStamp — shown after payment is submitted (PAY-02, PAY-04) */}
        {paymentStatus !== null && paymentStatus !== "rejected" ? (
          <div className="relative mb-6 flex justify-center">
            <SettleStamp status={paymentStatus} />
          </div>
        ) : null}

        {/* Name input — shown only when not pending or settled */}
        {showPayForm ? (
          <div className="mb-4">
            <label
              htmlFor="claimantName"
              className="block text-xs font-bold uppercase text-[--color-ink] tracking-widest mb-2"
            >
              YOUR NAME
            </label>
            <input
              id="claimantName"
              type="text"
              value={claimantName}
              onChange={(e) => setClaimantName(e.target.value)}
              placeholder="Enter your name"
              className="w-full border border-[--color-ink] bg-[--color-paper-chit] text-[--color-ink] text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[--color-pen]"
            />
          </div>
        ) : null}

        {/* I'VE PAID button (PAY-01) — hidden when pending or settled */}
        {showPayForm ? (
          <button
            type="button"
            onClick={handlePay}
            disabled={isButtonDisabled}
            className="w-full h-12 bg-[--color-pen] text-white uppercase font-bold text-sm tracking-widest flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            I&apos;VE PAID
          </button>
        ) : null}

        {/* AWAITING CONFIRMATION subtext (PAY-02) */}
        {paymentStatus === "pending" ? (
          <p className="text-xs text-center text-[--color-ink] opacity-60 uppercase tracking-widest mt-4">
            AWAITING CONFIRMATION FROM THE ORGANIZER
          </p>
        ) : null}

        {/* HAVE A GOOD ONE! confirmation copy (PAY-04) */}
        {paymentStatus === "settled" ? (
          <p className="text-sm text-center font-bold text-[--color-pen] uppercase tracking-widest mt-4">
            PAYMENT CONFIRMED — HAVE A GOOD ONE!
          </p>
        ) : null}

        {/* Rejection note — member can re-tap I'VE PAID */}
        {paymentStatus === "rejected" ? (
          <p className="text-xs text-center text-[--color-ink] opacity-60 uppercase tracking-widest mt-2">
            PAYMENT WAS NOT CONFIRMED. PLEASE TRY AGAIN.
          </p>
        ) : null}
      </div>
    </main>
  );
}
