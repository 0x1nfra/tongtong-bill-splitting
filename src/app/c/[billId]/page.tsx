"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { SettleStamp } from "../../../components/SettleStamp";
import { ArchivedStamp } from "../../../components/ArchivedStamp";
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
  billId: string,
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

  const [receiptLightboxOpen, setReceiptLightboxOpen] = useState(false);

  // T-05-05: read organizer secret to check if this device owns this specific bill
  const [organizerSecret, setOrganizerSecret] = useState<string | null>(null);
  useEffect(() => {
    const stored = localStorage.getItem("tongtong_organizer_secret");
    setOrganizerSecret(stored ?? "");
  }, []);

  // Convex IDs are lowercase alphanumeric, typically 20+ chars.
  // Reject obviously malformed IDs before hitting the validator.
  const isValidBillIdFormat = /^[a-z0-9]{15,}$/.test(billId);

  // T-05-05: check if stored secret matches this bill server-side (returns null if not organizer)
  const organizerBillData = useQuery(
    api.bills.getBillForOrganizer,
    organizerSecret && isValidBillIdFormat
      ? { billId: billId as Id<"bills">, organizerSecret }
      : "skip",
  );

  // T-05-05: redirect to dashboard only when confirmed as this bill's organizer
  useEffect(() => {
    if (organizerBillData != null) {
      router.replace(`/dashboard/${billId}`);
    }
  }, [organizerBillData, billId, router]);

  const bill = useQuery(
    api.bills.getBillForMember,
    isValidBillIdFormat ? { billId: billId as Id<"bills"> } : "skip",
  );

  // PAY-02: subscribe to member's own payment status for real-time stamp state machine
  const payment = useQuery(
    api.payments.getMyPayment,
    claimantSession && isValidBillIdFormat
      ? { billId: billId as Id<"bills">, claimantSession }
      : "skip",
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
    if (bill?.archivedAt) return; // BONUS-03: archived bills block all claims
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

  if (!isValidBillIdFormat) {
    return (
      <main className="min-h-screen bg-paper-table flex items-center justify-center px-4">
        <div className="chit max-w-[360px] w-full p-6 text-center mx-auto">
          <div className="mb-4 flex justify-center">
            <div
              className="inline-block border-2 border-stamp px-4 py-2"
              style={{ transform: "rotate(-6deg)" }}
            >
              <span
                className="text-3xl font-bold text-stamp uppercase tracking-widest"
                style={{ fontFamily: "var(--font-stamp)" }}
              >
                EXPIRED
              </span>
            </div>
          </div>
          <h2 className="text-lg font-bold text-ink uppercase tracking-widest mt-6 mb-2">
            This bill has been torn up
          </h2>
          <p className="text-sm text-ink-muted">
            The bill you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </main>
    );
  }

  if (bill === undefined) {
    return (
      <main className="min-h-screen bg-paper-table flex items-center justify-center">
        <div className="chit max-w-[480px] w-full mx-4 p-4 animate-pulse">
          <div className="h-4 bg-ink opacity-10 mb-3 w-1/3"></div>
          <div className="h-3 bg-ink opacity-10 mb-2 w-full"></div>
          <div className="h-3 bg-ink opacity-10 mb-2 w-4/5"></div>
          <div className="h-3 bg-ink opacity-10 mb-2 w-full"></div>
          <div className="h-3 bg-ink opacity-10 w-3/4"></div>
        </div>
      </main>
    );
  }

  if (bill === null) {
    return (
      <main className="min-h-screen bg-paper-table flex items-center justify-center px-4">
        <div className="chit max-w-[360px] w-full p-6 text-center mx-auto">
          <div className="mb-4 flex justify-center">
            <div
              className="inline-block border-2 border-stamp px-4 py-2"
              style={{ transform: "rotate(-6deg)" }}
            >
              <span
                className="text-2xl font-bold text-stamp uppercase tracking-widest"
                style={{ fontFamily: "var(--font-stamp)" }}
              >
                EXPIRED
              </span>
            </div>
          </div>
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

  // BONUS-03: early return for archived bills — show ArchivedStamp overlay, no bill content
  if (bill.archivedAt) {
    return (
      <main className="min-h-screen bg-paper-table flex items-center justify-center">
        <div className="max-w-[480px] mx-auto px-4 py-12">
          <ArchivedStamp />
        </div>
      </main>
    );
  }

  const items = bill.items ?? [];
  const claims = bill.claims ?? [];

  const totals = calculateTotals(items, bill.applySST, bill.applyServiceCharge);

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
  const showPayForm = paymentStatus === null || paymentStatus === "rejected";
  const isButtonDisabled =
    !claimantSession ||
    !memberName ||
    isPaying ||
    !!bill?.archivedAt ||
    payment?.status === "pending" ||
    payment?.status === "settled";

  return (
    <main className="min-h-screen bg-paper-table">
      <div className="max-w-[480px] mx-auto px-4 py-6">

        {/* PAGE HEADER — on table surface */}
        <p
          className="text-[10px] font-bold tracking-widest text-ink-muted mb-0.5"
          style={{ fontFamily: "var(--font-display)" }}
        >
          tongtong.
        </p>
        <h1
          className="text-xl font-bold uppercase text-ink tracking-widest mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Claim Your Share
        </h1>

        {/* Receipt thumbnail — tap to open lightbox */}
        {bill.receiptUrl && (
          <>
            <button
              type="button"
              onClick={() => setReceiptLightboxOpen(true)}
              className="mb-3 w-full flex items-center gap-3 border border-ink bg-paper-chit px-3 py-2 text-left hover:bg-paper-chit/70 transition-colors cursor-pointer"
              aria-label="View receipt"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bill.receiptUrl}
                alt=""
                aria-hidden="true"
                width={40}
                height={54}
                className="w-10 h-14 object-cover border border-ink shrink-0"
              />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                  Receipt attached
                </p>
                <p className="text-xs text-ink uppercase tracking-widest">
                  Tap to view
                </p>
              </div>
            </button>

            {receiptLightboxOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
                onClick={() => setReceiptLightboxOpen(false)}
              >
                <div
                  className="relative max-w-[480px] w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setReceiptLightboxOpen(false)}
                    className="absolute -top-8 right-0 text-white text-xs uppercase tracking-widest font-bold cursor-pointer"
                    aria-label="Close receipt"
                  >
                    CLOSE ✕
                  </button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bill.receiptUrl}
                    alt="Bill receipt"
                    width={480}
                    height={640}
                    className="w-full border border-ink"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Single chit — one receipt surface for all content */}
        <div className="chit p-6">

          {/* BILL IDENTITY — which bill */}
          <p
            className="text-sm font-bold uppercase text-ink tracking-wide mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {bill.title}
          </p>
          {bill.venueName && (
            <p className="text-xs text-ink-muted uppercase tracking-widest mb-0.5">
              {bill.venueName}
            </p>
          )}
          <p className="text-[10px] text-ink-muted uppercase tracking-widest">
            {"#TT-" + billId.slice(0, 4).toUpperCase()}
          </p>

          <div className="perforation my-4"></div>

          {/* ITEMS ZONE */}
          <p className="text-xs font-bold uppercase text-ink-muted tracking-widest mb-3" style={{ fontFamily: "var(--font-display)" }}>
            ITEMS
          </p>
          {items.map(
            (
              item: {
                _id: string;
                name: string;
                price: number;
                quantity: number;
              },
              index: number,
            ) => {
              const itemClaims = claimsByItem.get(item._id) ?? [];
              const myClaimOnItem = itemClaims.find(
                (c) => c.claimantSession === claimantSession,
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
                <div key={item._id}>
                  {/* Tappable item row */}
                  <button
                    type="button"
                    className="dot-leader w-full min-h-[48px] flex items-center text-left px-0 py-2 cursor-pointer hover:bg-paper-chit/50 transition-colors disabled:opacity-50 disabled:cursor-wait"
                    disabled={isPending}
                    aria-label={`${item.name} — tap to ${isMine ? "unclaim" : totalClaimants > 0 ? "co-claim" : "claim"}`}
                    onClick={() => handleItemTap(item._id, myClaimOnItem?._id)}
                  >
                    {/* Left side: unclaimed indicator + item name + qty */}
                    <span
                      className={`flex items-center gap-1 text-sm text-ink${isMine ? " font-bold" : ""}`}
                    >
                      {totalClaimants === 0 ? (
                        <span className="text-warning mr-0.5">❋</span>
                      ) : null}
                      {item.name}
                      {item.quantity > 1 ? (
                        <span className="text-ink-muted ml-1 text-xs">
                          x{item.quantity}
                        </span>
                      ) : null}
                    </span>

                    {/* Right side: price (member share or full price) */}
                    <span
                      className={`text-sm${isMine ? " font-bold text-pen" : " text-ink"}`}
                    >
                      RM{(splitPriceCents / 100).toFixed(2)}
                    </span>
                  </button>

                  {/* Claimant names row (CLAIM-04) */}
                  {totalClaimants > 0 ? (
                    <div className="flex flex-wrap gap-1 px-0 pb-1">
                      {itemClaims.map((claim) => (
                        <span
                          key={claim._id}
                          className={`font-[family-name:var(--font-handwriting)] text-pen text-sm${claim.claimantSession === claimantSession ? " font-bold" : ""}`}
                        >
                          {claim.claimantName}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {/* Inline "CLAIM" prompt — unclaimed and not expanded (D-10, CLAIM-05) */}
                  {totalClaimants === 0 && !isExpanded ? (
                    <p
                      className="text-xs text-warning uppercase tracking-widest pb-1 cursor-pointer"
                      onClick={() =>
                        handleItemTap(item._id, myClaimOnItem?._id)
                      }
                    >
                      CLAIM
                    </p>
                  ) : null}

                  {/* Inline name-entry expansion (D-02) */}
                  <div
                    className={`overflow-hidden transition-[max-height] duration-200 ease-out${isExpanded ? " max-h-[80px]" : " max-h-0"}`}
                  >
                    <div className="bg-paper-chit px-2 py-2 flex gap-2 items-center">
                      <label
                        htmlFor={`claimantName-${item._id}`}
                        className="text-xs font-bold uppercase tracking-widest text-ink shrink-0"
                      >
                        YOUR NAME
                      </label>
                      <input
                        id={`claimantName-${item._id}`}
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Enter your name"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleNameSubmit(item._id);
                        }}
                        className="flex-1 border border-ink bg-paper-chit text-ink text-sm px-2 py-2 focus:outline-none focus-visible:outline-2 focus-visible:outline-pen focus-visible:outline-offset-2 min-w-0"
                      />
                      <button
                        type="button"
                        onClick={() => handleNameSubmit(item._id)}
                        className="bg-pen text-white text-xs uppercase font-bold tracking-widest px-3 py-2 shrink-0 min-h-[44px] cursor-pointer"
                      >
                        CLAIM
                      </button>
                    </div>
                  </div>
                  {index < items.length - 1 ? (
                    <hr className="rule-hairline" />
                  ) : null}
                </div>
              );
            },
          )}

          <div className="perforation my-4"></div>

          {/* BILL TOTAL ZONE */}
          <p className="text-xs font-bold uppercase text-ink-muted tracking-widest mb-3" style={{ fontFamily: "var(--font-display)" }}>
            BILL TOTAL
          </p>

          <div className="dot-leader flex justify-between text-sm text-ink mb-1">
            <span className="text-ink-muted">Subtotal</span>
            <span>RM{(totals.subtotalCents / 100).toFixed(2)}</span>
          </div>

          {bill.applyServiceCharge ? (
            <div className="dot-leader flex justify-between text-sm text-ink mb-1">
              <span className="text-ink-muted">Service Charge (10%)</span>
              <span>RM{(totals.serviceChargeCents / 100).toFixed(2)}</span>
            </div>
          ) : null}

          {bill.applySST ? (
            <div className="dot-leader flex justify-between text-sm text-ink mb-1">
              <span className="text-ink-muted">SST (6%)</span>
              <span>RM{(totals.sstCents / 100).toFixed(2)}</span>
            </div>
          ) : null}

          <div className="dot-leader flex justify-between font-bold text-base text-ink border-t border-ink mt-2 pt-2">
            <span className="uppercase tracking-widest">GRAND TOTAL</span>
            <span>RM{(totals.grandTotalCents / 100).toFixed(2)}</span>
          </div>

          <div className="perforation my-4"></div>

          {/* YOUR PORTION ZONE — always rendered */}
          <p className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-3" style={{ fontFamily: "var(--font-display)" }}>
            YOUR PORTION
          </p>

          {hasClaims ? (
            <>
              <div className="dot-leader flex justify-between text-sm text-ink mb-1">
                <span className="text-ink-muted">Subtotal</span>
                <span>
                  RM{((personTotals?.personSubtotalCents ?? 0) / 100).toFixed(2)}
                </span>
              </div>

              {bill.applyServiceCharge ? (
                <div className="dot-leader flex justify-between text-sm text-ink mb-1">
                  <span className="text-ink-muted">Service Charge (10%)</span>
                  <span>
                    RM
                    {(
                      (personTotals?.personServiceChargeCents ?? 0) / 100
                    ).toFixed(2)}
                  </span>
                </div>
              ) : null}

              {bill.applySST ? (
                <div className="dot-leader flex justify-between text-sm text-ink mb-1">
                  <span className="text-ink-muted">SST (6%)</span>
                  <span>
                    RM{((personTotals?.personSSTCents ?? 0) / 100).toFixed(2)}
                  </span>
                </div>
              ) : null}

              <div className="dot-leader flex justify-between font-bold text-base text-ink border-t border-ink mt-2 pt-2">
                <span className="uppercase tracking-widest">YOUR TOTAL</span>
                <span aria-live="polite">
                  RM{((personTotals?.personTotalCents ?? 0) / 100).toFixed(2)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="dot-leader flex justify-between text-sm mb-1">
                <span className="text-ink-muted">Subtotal</span>
                <span className="text-ink-muted">—</span>
              </div>
              <div className="dot-leader flex justify-between font-bold text-base border-t border-ink mt-2 pt-2">
                <span className="uppercase tracking-widest text-ink-muted">YOUR TOTAL</span>
                <span className="text-ink-muted">—</span>
              </div>
              <p className="text-xs text-ink-muted mt-3">
                Tap the items you ordered above to see your share.
              </p>
            </>
          )}

          {/* PAYMENT ZONE — only if hasClaims */}
          {hasClaims && (
            <>
              <div className="perforation my-4"></div>

              <div className="text-center">
                {bill.qrUrl ? (
                  <>
                    <p className="text-xs font-bold uppercase text-ink-muted tracking-widest mb-2">
                      SCAN TO PAY
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bill.qrUrl}
                      alt="DuitNow QR"
                      width={200}
                      height={200}
                      loading="lazy"
                      className="w-[200px] h-[200px] object-contain mx-auto mb-4"
                    />
                  </>
                ) : null}

                {paymentStatus !== null && paymentStatus !== "rejected" ? (
                  <div className="mb-4 flex justify-center">
                    <SettleStamp status={paymentStatus} />
                  </div>
                ) : null}

                {showPayForm ? (
                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={isButtonDisabled}
                    className="w-full h-12 bg-pen text-white uppercase font-bold text-sm tracking-widest flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    I&apos;VE PAID
                  </button>
                ) : null}

                {paymentStatus === "rejected" ? (
                  <p className="text-xs text-ink-muted uppercase tracking-widest mt-2">
                    Tak confirm lah. Cuba lagi k?
                  </p>
                ) : null}
              </div>
            </>
          )}

        </div>
      </div>
    </main>
  );
}
