"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { SettleStamp } from "../../../components/SettleStamp";
import { calculateTotals, calculatePersonTotals } from "@/lib/calculateTotals";

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

/**
 * useMemberName — reads or sets the member's display name for this bill.
 * D-01: localStorage key `tongtong_name_${billId}`
 * Returns null if not yet set (first visit).
 */
function useMemberName(
  billId: string
): [string | null, (name: string) => void] {
  const [memberName, setMemberNameState] = useState<string | null>(null);
  useEffect(() => {
    const stored = localStorage.getItem(`tongtong_name_${billId}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMemberNameState(stored); // null if not set
  }, [billId]);

  function setMemberName(name: string) {
    localStorage.setItem(`tongtong_name_${billId}`, name);
    setMemberNameState(name);
  }
  return [memberName, setMemberName];
}

/**
 * getRotation — deterministic rotation for claimant name badges.
 * CLAIM-04 / D-09: derive from claimId.charCodeAt(0) for stable, no-useState rotation.
 * Range: −2.0 to +1.9 degrees.
 */
function getRotation(claimId: string): number {
  const seed = claimId.charCodeAt(0) % 40; // 0–39
  return (seed - 20) / 10; // −2.0 to +1.9 degrees
}

export default function MemberViewPage({
  params,
}: {
  params: Promise<{ billId: string }>;
}) {
  const { billId } = use(params);
  const router = useRouter();
  const claimantSession = useMemberSession(billId);
  const [memberName, setMemberName] = useMemberName(billId);

  const [isPaying, setIsPaying] = useState<boolean>(false);

  // Inline name-entry expansion state (D-02)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState<string>("");

  // Per-item mutation in-flight guard (Pitfall 3 / T-02-10)
  const [pendingItems, setPendingItems] = useState<Set<string>>(new Set());

  // T-05-05: read organizer secret to check if this device owns this specific bill
  const [organizerSecret, setOrganizerSecret] = useState<string | null>(null);
  useEffect(() => {
    const stored = localStorage.getItem("tongtong_organizer_secret");
    setOrganizerSecret(stored ?? "");
  }, []);

  // T-05-05: check if stored secret matches this bill server-side (returns null if not organizer)
  const organizerBillData = useQuery(
    api.bills.getBillForOrganizer,
    organizerSecret
      ? { billId: billId as Id<"bills">, organizerSecret }
      : "skip"
  );

  // T-05-05: redirect to dashboard only when confirmed as this bill's organizer
  useEffect(() => {
    if (organizerBillData != null) {
      router.replace(`/dashboard/${billId}`);
    }
  }, [organizerBillData, billId, router]);

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
  const claimItemMutation = useMutation(api.bills.claimItem);
  const unclaimItemMutation = useMutation(api.bills.unclaimItem);

  /**
   * handlePay — PAY-01: call markPaid mutation to create pending payment record.
   * Guards: claimantSession must be loaded, memberName must be non-null.
   * Uses memberName from tongtong_name_${billId} localStorage (D-01).
   */
  const handlePay = async () => {
    if (!claimantSession || !memberName) return;
    setIsPaying(true);
    try {
      await markPaid({
        billId: billId as Id<"bills">,
        claimantSession,
        claimantName: memberName,
      });
    } catch (err) {
      // WR-03: log error so failures are not silent; button re-enables via finally
      console.error("Failed to mark as paid:", err);
    } finally {
      setIsPaying(false);
    }
  };

  /**
   * handleItemTap — D-03/D-04: claim or unclaim an item row.
   * Guard: if (!claimantSession) return — session may not be loaded yet (Pitfall 1 / T-02-09).
   * If name not set: expand inline name-entry (D-02).
   * If name set: fire claim/unclaim immediately (D-03/D-04).
   */
  const handleItemTap = async (itemId: string, myClaimId?: string) => {
    if (!claimantSession) return; // T-02-09: session not yet loaded
    if (pendingItems.has(itemId)) return; // T-02-10: mutation in-flight

    if (!memberName) {
      // D-02: first tap — expand inline name-entry for this item
      setExpandedItemId(itemId);
      return;
    }

    setPendingItems((prev) => new Set(prev).add(itemId));
    try {
      if (myClaimId) {
        // D-04: toggle unclaim
        await unclaimItemMutation({
          claimId: myClaimId as Id<"claims">,
          claimantSession,
        });
      } else {
        // D-03: claim immediately
        await claimItemMutation({
          billId: billId as Id<"bills">,
          itemId: itemId as Id<"items">,
          claimantName: memberName,
          claimantSession,
        });
      }
    } catch (err) {
      console.error("Claim action failed:", err);
    } finally {
      setPendingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  /**
   * handleNameSubmit — D-02: save name, collapse inline entry, fire claim.
   * Guard: if (!claimantSession) return (Pitfall 1 / T-02-09).
   */
  const handleNameSubmit = async (itemId: string) => {
    const name = nameInput.trim();
    if (!name) return;
    if (!claimantSession) return; // T-02-09

    // Save name to localStorage and update state
    setMemberName(name);
    setExpandedItemId(null);
    setNameInput("");

    try {
      await claimItemMutation({
        billId: billId as Id<"bills">,
        itemId: itemId as Id<"items">,
        claimantName: name,
        claimantSession,
      });
    } catch (err) {
      console.error("Claim failed:", err);
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

  const items = bill.items ?? [];
  const claims = bill.claims ?? [];

  const totals = calculateTotals(
    items,
    bill.applySST,
    bill.applyServiceCharge
  );

  // Build claims-by-item map for O(1) lookups (D-05, CALC-01)
  const claimsByItem = new Map<string, typeof claims>();
  for (const claim of claims) {
    const existing = claimsByItem.get(claim.itemId) ?? [];
    claimsByItem.set(claim.itemId, [...existing, claim]);
  }

  // hasClaims: derived directly from useQuery result — NOT useEffect (anti-pattern)
  const hasClaims = claims.some((c) => c.claimantSession === claimantSession);

  // Your Portion panel values (CALC-01 through CALC-05)
  const personTotals =
    bill && claimantSession
      ? calculatePersonTotals(items, claims, claimantSession, totals)
      : null;

  const paymentStatus = payment?.status ?? null;
  const showPayForm =
    paymentStatus === null || paymentStatus === "rejected";
  const isButtonDisabled =
    !claimantSession ||
    !memberName ||
    isPaying ||
    payment?.status === "pending" ||
    payment?.status === "settled";

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

        {/* Interactive items list — CLAIM-01 through CLAIM-05 */}
        <div className="bg-[--color-paper-chit] p-4 mb-4">
          <p className="text-xs font-bold uppercase text-[--color-ink] tracking-widest mb-3 opacity-60">
            ITEMS
          </p>
          {items.map(
            (item: {
              _id: string;
              name: string;
              price: number;
              quantity: number;
            }) => {
              const itemClaims = claimsByItem.get(item._id) ?? [];
              const myClaimOnItem = itemClaims.find(
                (c) => c.claimantSession === claimantSession
              );
              const totalClaimants = itemClaims.length;
              const splitPriceCents =
                totalClaimants > 0
                  ? Math.round((item.price * item.quantity) / totalClaimants)
                  : item.price * item.quantity;
              const isExpanded = expandedItemId === item._id;
              const isMine = !!myClaimOnItem;
              const isPending = pendingItems.has(item._id);

              return (
                <div
                  key={item._id}
                  className="border-b border-[--color-ink] border-opacity-10 last:border-0"
                >
                  {/* Tappable item row */}
                  <button
                    type="button"
                    className={`w-full min-h-[48px] flex justify-between items-center text-left px-0 py-2 cursor-pointer hover:bg-[--color-paper-chit]/50 transition-colors${isMine ? " bg-[--color-paper-chit] border-l-4 border-[--color-pen] pl-2" : ""} disabled:opacity-50 disabled:cursor-wait`}
                    disabled={isPending}
                    aria-label={`${item.name} — tap to ${isMine ? "unclaim" : totalClaimants > 0 ? "co-claim" : "claim"}`}
                    onClick={() =>
                      handleItemTap(item._id, myClaimOnItem?._id)
                    }
                  >
                    {/* Left side: unclaimed indicator + item name + qty */}
                    <span
                      className={`flex-1 flex items-center gap-1 text-sm text-[--color-ink]${isMine ? " font-bold" : ""}`}
                    >
                      {totalClaimants === 0 ? (
                        <span className="text-[--color-stamp] mr-0.5">❋</span>
                      ) : null}
                      {item.name}
                      {item.quantity > 1 ? (
                        <span className="opacity-60 ml-1 text-xs">
                          x{item.quantity}
                        </span>
                      ) : null}
                    </span>

                    {/* Right side: price (member share or full price) */}
                    <span
                      className={`text-sm${isMine ? " font-bold text-[--color-pen]" : " text-[--color-ink]"}`}
                    >
                      RM{(splitPriceCents / 100).toFixed(2)}
                    </span>
                  </button>

                  {/* Claimant names row (CLAIM-04) */}
                  {totalClaimants > 0 ? (
                    <div className="flex flex-wrap gap-1 px-0 pb-1 pl-2">
                      {itemClaims.map((claim) => (
                        <span
                          key={claim._id}
                          className={`font-[family-name:var(--font-handwriting)] text-[--color-pen] text-sm${claim.claimantSession === claimantSession ? " font-bold" : ""}`}
                          style={{
                            display: "inline-block",
                            transform: `rotate(${getRotation(claim._id)}deg)`,
                            marginRight: "4px",
                          }}
                        >
                          {claim.claimantName}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {/* Inline "CLAIM" prompt — unclaimed and not expanded (D-10, CLAIM-05) */}
                  {totalClaimants === 0 && !isExpanded ? (
                    <p className="text-xs text-[--color-stamp] uppercase tracking-widest pb-1 pl-0">
                      CLAIM
                    </p>
                  ) : null}

                  {/* Inline name-entry expansion (D-02) */}
                  <div
                    className={`overflow-hidden transition-[max-height] duration-200 ease-out${isExpanded ? " max-h-[80px]" : " max-h-0"}`}
                  >
                    <div className="bg-[--color-paper-chit] px-2 py-2 flex gap-2 items-center">
                      <label
                        htmlFor="claimantNameInput"
                        className="text-xs font-bold uppercase tracking-widest text-[--color-ink] shrink-0"
                      >
                        YOUR NAME
                      </label>
                      <input
                        id="claimantNameInput"
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Enter your name"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleNameSubmit(item._id);
                        }}
                        className="flex-1 border border-[--color-ink] bg-[--color-paper-chit] text-[--color-ink] text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[--color-pen] min-w-0"
                      />
                      <button
                        type="button"
                        onClick={() => handleNameSubmit(item._id)}
                        className="bg-[--color-pen] text-white text-xs uppercase font-bold tracking-widest px-3 py-1 shrink-0"
                      >
                        CLAIM
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* YOUR PORTION panel — sticky, hidden until first claim (D-07, CALC-04) */}
        <div
          className={`sticky bottom-0 bg-[--color-paper-chit] border-t border-[--color-ink] border-opacity-20 p-4 shadow-[0_-4px_16px_rgba(31,27,23,0.08)] border-l-4 border-l-[--color-pen] transition-[opacity,transform] duration-300 ease-out mb-4${hasClaims ? " opacity-100 translate-y-0" : " opacity-0 translate-y-2 pointer-events-none"}`}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-[--color-ink] opacity-60 mb-3">
            YOUR PORTION
          </p>

          {/* Subtotal row */}
          <div className="flex justify-between text-sm text-[--color-ink] mb-1">
            <span className="opacity-60">Subtotal</span>
            <span>
              RM{((personTotals?.personSubtotalCents ?? 0) / 100).toFixed(2)}
            </span>
          </div>

          {/* Service charge row (conditional) */}
          {bill.applyServiceCharge ? (
            <div className="flex justify-between text-sm text-[--color-ink] mb-1">
              <span className="opacity-60">Service Charge (10%)</span>
              <span>
                RM
                {((personTotals?.personServiceChargeCents ?? 0) / 100).toFixed(
                  2
                )}
              </span>
            </div>
          ) : null}

          {/* SST row (conditional) */}
          {bill.applySST ? (
            <div className="flex justify-between text-sm text-[--color-ink] mb-1">
              <span className="opacity-60">SST (6%)</span>
              <span>
                RM{((personTotals?.personSSTCents ?? 0) / 100).toFixed(2)}
              </span>
            </div>
          ) : null}

          {/* YOUR TOTAL row */}
          <div className="flex justify-between font-bold text-base text-[--color-ink] border-t border-[--color-ink] mt-2 pt-2">
            <span className="uppercase tracking-widest">YOUR TOTAL</span>
            <span aria-live="polite">
              RM{((personTotals?.personTotalCents ?? 0) / 100).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Bill grand total section */}
        <div className="bg-[--color-paper-chit] p-4 mb-6">
          <p className="text-xs font-bold uppercase text-[--color-ink] tracking-widest mb-3 opacity-60">
            BILL TOTAL
          </p>

          {/* Subtotal row */}
          <div className="flex justify-between text-sm text-[--color-ink] mb-1">
            <span className="opacity-60">Subtotal</span>
            <span>RM{(totals.subtotalCents / 100).toFixed(2)}</span>
          </div>

          {/* Service charge row (shown only if applicable) */}
          {bill.applyServiceCharge ? (
            <div className="flex justify-between text-sm text-[--color-ink] mb-1">
              <span className="opacity-60">Service Charge (10%)</span>
              <span>RM{(totals.serviceChargeCents / 100).toFixed(2)}</span>
            </div>
          ) : null}

          {/* SST row (shown only if applicable) */}
          {bill.applySST ? (
            <div className="flex justify-between text-sm text-[--color-ink] mb-1">
              <span className="opacity-60">SST (6%)</span>
              <span>RM{(totals.sstCents / 100).toFixed(2)}</span>
            </div>
          ) : null}

          {/* Grand total row */}
          <div className="flex justify-between font-bold text-base text-[--color-ink] border-t border-[--color-ink] mt-2 pt-2">
            <span className="uppercase tracking-widest">GRAND TOTAL</span>
            <span>RM{(totals.grandTotalCents / 100).toFixed(2)}</span>
          </div>
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

        {/* SettleStamp — shown after payment is submitted (PAY-02, PAY-04) */}
        {paymentStatus !== null && paymentStatus !== "rejected" ? (
          <div className="relative mb-6 flex justify-center">
            <SettleStamp status={paymentStatus} />
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
