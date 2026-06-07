"use client";

import { use, useEffect, useRef, useState } from "react";
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

  // Per-item selected quantity for multi-qty items (staged before confirming claim)
  const [pendingQty, setPendingQty] = useState<Map<string, number>>(new Map());

  const [receiptLightboxOpen, setReceiptLightboxOpen] = useState(false);
  const receiptTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!receiptLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setReceiptLightboxOpen(false);
        receiptTriggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [receiptLightboxOpen]);

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
  // CR-01: guard with pendingItems.size === 0 to avoid redirect while claim mutation is in-flight
  useEffect(() => {
    if (organizerBillData != null && pendingItems.size === 0) {
      router.replace(`/dashboard/${billId}`);
    }
  }, [organizerBillData, billId, router, pendingItems]);

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
  const handleItemTap = async (itemId: string, myClaimId?: string, itemQty?: number) => {
    if (bill?.archivedAt) return; // BONUS-03: archived bills block all claims
    if (!claimantSession) return; // T-02-09: session not yet loaded
    if (pendingItems.has(itemId)) return; // T-02-10: mutation in-flight

    if (!memberName) {
      // D-02: first tap — expand inline name-entry (and stepper for multi-qty)
      setExpandedItemId(itemId);
      return;
    }

    // Multi-qty items: expand stepper instead of claiming immediately
    if (itemQty && itemQty > 1) {
      setExpandedItemId(expandedItemId === itemId ? null : itemId);
      return;
    }

    // Qty=1 items: immediate toggle
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

  // handleQtyClaim — confirm claim for a multi-qty item with chosen quantity
  const handleQtyClaim = async (itemId: string, claimQty: number) => {
    if (!claimantSession || !memberName) return;
    setExpandedItemId(null);
    setPendingItems((prev) => new Set(prev).add(itemId));
    try {
      await claimItemMutation({
        billId: billId as Id<"bills">,
        itemId: itemId as Id<"items">,
        claimantName: memberName,
        claimantSession,
        claimQty,
      });
    } catch (err) {
      console.error("Claim failed:", err);
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
   * WR-01: also guard on pendingItems to prevent concurrent duplicate mutations.
   */
  const handleNameSubmit = async (itemId: string, claimQty?: number) => {
    const name = nameInput.trim();
    if (!name) return;
    if (!claimantSession) return; // T-02-09
    if (pendingItems.has(itemId)) return; // WR-01: mirrors handleItemTap guard

    // Save name to localStorage and update state
    setMemberName(name);
    setExpandedItemId(null);
    setNameInput("");

    setPendingItems((prev) => new Set(prev).add(itemId));
    try {
      await claimItemMutation({
        billId: billId as Id<"bills">,
        itemId: itemId as Id<"items">,
        claimantName: name,
        claimantSession,
        claimQty: claimQty ?? 1,
      });
    } catch (err) {
      console.error("Claim failed:", err);
    } finally {
      setPendingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
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

  const totals = calculateTotals(items, bill.applySST, bill.applyServiceCharge, bill.roundingAdjustmentCents ?? 0);

  // Build claims-by-item map for O(1) lookups (D-05, CALC-01)
  const claimsByItem = new Map<string, typeof claims>();
  for (const claim of claims) {
    const existing = claimsByItem.get(claim.itemId) ?? [];
    claimsByItem.set(claim.itemId, [...existing, claim]);
  }

  // hasClaims: derived directly from useQuery result — NOT useEffect (anti-pattern)
  const hasClaims = claims.some((c) => c.claimantSession === claimantSession);

  // Your Portion panel values (CALC-01 through CALC-05)
  // ADJ-07: pass roundingAdjustmentCents as 5th arg to distribute adjustment proportionally
  const personTotals =
    bill && claimantSession
      ? calculatePersonTotals(items, claims, claimantSession, totals, bill.roundingAdjustmentCents ?? 0)
      : null;

  // CR-02: treat payment === undefined (query loading) as disabled — do NOT collapse to null via ??
  const isPaymentLoading = payment === undefined && claimantSession !== null;
  const paymentStatus = payment === undefined ? null : (payment?.status ?? null);
  const showPayForm =
    !isPaymentLoading && (paymentStatus === null || paymentStatus === "rejected");
  const isButtonDisabled =
    isPaymentLoading ||
    !claimantSession ||
    !memberName ||
    isPaying ||
    !!bill?.archivedAt ||
    payment?.status === "pending" ||
    payment?.status === "settled";

  return (
    <main id="main-content" className="min-h-screen bg-paper-table">
      <div className="max-w-[480px] mx-auto px-4 py-6">

        {/* PAGE HEADER — on table surface */}
        <p
          className="text-[0.625rem] font-bold tracking-widest text-ink-muted mb-0.5"
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
              ref={receiptTriggerRef}
              type="button"
              onClick={() => setReceiptLightboxOpen(true)}
              className="mb-3 w-full flex items-center gap-3 border border-ink bg-paper-chit px-3 py-2 text-left hover:bg-paper-chit/70 transition-colors cursor-pointer"
              aria-label="View receipt"
              aria-haspopup="dialog"
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
                <p className="text-[0.625rem] font-bold uppercase tracking-widest text-ink-muted">
                  Receipt attached
                </p>
                <p className="text-xs text-ink uppercase tracking-widest">
                  Tap to view
                </p>
              </div>
            </button>

            {receiptLightboxOpen && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Receipt"
                className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 px-4"
                onClick={() => {
                  setReceiptLightboxOpen(false);
                  receiptTriggerRef.current?.focus();
                }}
              >
                <div
                  className="relative max-w-[480px] w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    type="button"
                    onClick={() => {
                      setReceiptLightboxOpen(false);
                      receiptTriggerRef.current?.focus();
                    }}
                    className="absolute -top-8 right-0 text-white text-xs uppercase tracking-widest font-bold cursor-pointer"
                    aria-label="Close receipt"
                  >
                    <span aria-hidden="true">CLOSE ✕</span>
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
          <p className="text-[0.625rem] text-ink-muted uppercase tracking-widest">
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
              const isMine = !!myClaimOnItem;
              const isPending = pendingItems.has(item._id);
              const myClaimedQty = myClaimOnItem ? (myClaimOnItem.claimQty ?? 1) : 0;
              const totalClaimedQty = item.quantity > 1
                ? itemClaims.reduce((sum, c) => sum + (c.claimQty ?? 1), 0)
                : totalClaimants;
              const othersClaimedQty = totalClaimedQty - myClaimedQty;
              const remainingForMe = item.quantity - othersClaimedQty;
              const pendingQtyForItem = pendingQty.get(item._id) ?? (myClaimedQty || 1);
              const splitPriceCents =
                item.quantity > 1
                  ? isMine
                    ? item.price * myClaimedQty
                    : item.price * item.quantity
                  : totalClaimants > 0
                    ? Math.round(item.price / totalClaimants)
                    : item.price;
              const isExpanded = expandedItemId === item._id;

              return (
                <div key={item._id}>
                  {/* Tappable item row */}
                  <button
                    type="button"
                    className="dot-leader w-full min-h-[48px] flex items-center text-left px-0 py-2 cursor-pointer hover:bg-paper-chit/50 transition-colors disabled:opacity-50 disabled:cursor-wait"
                    disabled={isPending}
                    aria-label={`${item.name} — tap to ${isMine ? "adjust or unclaim" : totalClaimants > 0 ? "co-claim" : "claim"}`}
                    onClick={() => handleItemTap(item._id, myClaimOnItem?._id, item.quantity)}
                  >
                    {/* Left side: unclaimed indicator + item name + qty */}
                    <span
                      className={`flex items-center gap-1 text-sm text-ink min-w-0${isMine ? " font-bold" : ""}`}
                    >
                      {totalClaimants === 0 ? (
                        <span className="text-warning mr-0.5">❋</span>
                      ) : null}
                      {item.name}
                      {item.quantity > 1 ? (
                        <span className="text-ink-muted ml-1 text-xs">
                          qty:{totalClaimedQty}/{item.quantity}
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

                  {/* Claimant names row (CLAIM-04) — your name is tappable: tap = unclaim (qty=1) or adjust stepper (multi-qty) */}
                  {totalClaimants > 0 ? (
                    <div className="flex flex-wrap gap-1 px-0 pb-1">
                      {itemClaims.map((claim) => {
                        const isMe = claim.claimantSession === claimantSession;
                        const label = `${claim.claimantName}${(claim.claimQty ?? 1) > 1 ? ` ×${claim.claimQty}` : ""}`;
                        if (isMe) {
                          return (
                            <button
                              key={claim._id}
                              type="button"
                              onClick={() => handleItemTap(item._id, claim._id, item.quantity)}
                              className="font-[family-name:var(--font-handwriting)] text-pen text-sm font-bold cursor-pointer hover:line-through focus-visible:outline-2 focus-visible:outline-pen focus-visible:outline-offset-1"
                              aria-label={`Remove your claim for ${item.name}`}
                            >
                              {label}
                            </button>
                          );
                        }
                        return (
                          <span
                            key={claim._id}
                            className="font-[family-name:var(--font-handwriting)] text-pen text-sm"
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  ) : null}

                  {/* Inline "CLAIM" hint — unclaimed and not expanded; tapping handled by button above */}
                  {totalClaimants === 0 && !isExpanded ? (
                    <p className="text-xs text-warning uppercase tracking-widest pb-1" aria-hidden="true">
                      CLAIM
                    </p>
                  ) : null}

                  {/* Inline expansion: name entry + (for multi-qty) stepper (D-02) */}
                  <div
                    className={`overflow-hidden transition-[max-height] duration-200 ease-out${isExpanded ? " max-h-[240px]" : " max-h-0"}`}
                  >
                    <div className="bg-paper-chit px-2 py-2 flex flex-col gap-2">
                      {/* Name entry row — only if name not yet set */}
                      {!memberName && (
                        <div className="flex gap-2 items-center">
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
                              if (e.key === "Enter") handleNameSubmit(item._id, item.quantity > 1 ? pendingQtyForItem : 1);
                            }}
                            className="flex-1 border border-ink bg-paper-chit text-ink text-sm px-2 py-2 focus:outline-none focus-visible:outline-2 focus-visible:outline-pen focus-visible:outline-offset-2 min-w-0"
                          />
                        </div>
                      )}

                      {/* Stepper row — only for multi-qty items */}
                      {item.quantity > 1 ? (
                        <div className="flex gap-2 items-center">
                          <span className="text-xs font-bold uppercase tracking-widest text-ink shrink-0">
                            HOW MANY
                          </span>
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            disabled={pendingQtyForItem <= 1}
                            onClick={() => setPendingQty((prev) => {
                              const next = new Map(prev);
                              next.set(item._id, Math.max(1, pendingQtyForItem - 1));
                              return next;
                            })}
                            className="border border-ink text-ink text-sm w-8 h-8 flex items-center justify-center cursor-pointer disabled:opacity-30"
                          >
                            −
                          </button>
                          <span className="text-sm font-bold text-ink w-6 text-center">{pendingQtyForItem}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={pendingQtyForItem >= remainingForMe}
                            onClick={() => setPendingQty((prev) => {
                              const next = new Map(prev);
                              next.set(item._id, Math.min(remainingForMe, pendingQtyForItem + 1));
                              return next;
                            })}
                            className="border border-ink text-ink text-sm w-8 h-8 flex items-center justify-center cursor-pointer disabled:opacity-30"
                          >
                            +
                          </button>
                          <span className="text-xs text-ink-muted ml-1">
                            of {remainingForMe} left
                          </span>
                          {isMine && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (!claimantSession || !myClaimOnItem) return;
                                setExpandedItemId(null);
                                setPendingItems((prev) => new Set(prev).add(item._id));
                                try {
                                  await unclaimItemMutation({ claimId: myClaimOnItem._id as Id<"claims">, claimantSession });
                                } catch (err) {
                                  console.error("Unclaim failed:", err);
                                } finally {
                                  setPendingItems((prev) => { const next = new Set(prev); next.delete(item._id); return next; });
                                }
                              }}
                              className="ml-auto text-xs text-ink-muted uppercase tracking-widest cursor-pointer border-none bg-transparent"
                            >
                              REMOVE
                            </button>
                          )}
                        </div>
                      ) : null}

                      {/* Confirm button */}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (!memberName) {
                              handleNameSubmit(item._id, item.quantity > 1 ? pendingQtyForItem : 1);
                            } else {
                              handleQtyClaim(item._id, item.quantity > 1 ? pendingQtyForItem : 1);
                            }
                          }}
                          className="bg-pen text-white text-xs uppercase font-bold tracking-widest px-3 py-2 shrink-0 min-h-[44px] cursor-pointer"
                        >
                          {isMine ? "UPDATE" : "CLAIM"}
                        </button>
                      </div>
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

          {/* UAT gap fix: rounding adj row in BILL TOTAL — mirrors YOUR PORTION ADJ-07 pattern */}
          {(totals.roundingAdjustmentCents ?? 0) !== 0 ? (
            <div className="dot-leader flex justify-between text-sm text-ink mb-1">
              <span className="text-ink-muted">Rounding Adj.</span>
              <span className="text-ink">
                {(totals.roundingAdjustmentCents ?? 0) > 0 ? "+" : ""}RM{(Math.abs(totals.roundingAdjustmentCents ?? 0) / 100).toFixed(2)}
              </span>
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

              {/* ADJ-07: rounding adjustment row — only shown when non-zero */}
              {(personTotals?.personRoundingAdjustmentCents ?? 0) !== 0 ? (
                <div className="dot-leader flex justify-between text-sm text-ink mb-1">
                  <span className="text-ink-muted">Rounding Adj.</span>
                  <span className="text-ink">
                    {(personTotals?.personRoundingAdjustmentCents ?? 0) > 0 ? "+" : ""}RM{(Math.abs(personTotals?.personRoundingAdjustmentCents ?? 0) / 100).toFixed(2)}
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

          {/* BANKING INFO — visible whenever set, no claim required */}
          {(bill.bankName || bill.accountNumber || bill.accountHolderName || bill.duitNowId) ? (
            <>
              <div className="perforation my-4"></div>
              <div className="text-left">
                <p className="text-xs font-bold uppercase text-ink-muted tracking-widest mb-2">
                  TRANSFER TO
                </p>
                {bill.bankName ? (
                  <div className="dot-leader flex justify-between text-sm text-ink mb-1">
                    <span className="text-ink-muted">Bank</span>
                    <span>{bill.bankName}</span>
                  </div>
                ) : null}
                {bill.accountNumber ? (
                  <div className="dot-leader flex justify-between text-sm text-ink mb-1">
                    <span className="text-ink-muted">Account No.</span>
                    <span>{bill.accountNumber}</span>
                  </div>
                ) : null}
                {bill.accountHolderName ? (
                  <div className="dot-leader flex justify-between text-sm text-ink mb-1">
                    <span className="text-ink-muted">Name</span>
                    <span>{bill.accountHolderName}</span>
                  </div>
                ) : null}
                {bill.duitNowId ? (
                  <div className="dot-leader flex justify-between text-sm text-ink mb-1">
                    <span className="text-ink-muted">DuitNow ID</span>
                    <span>{bill.duitNowId}</span>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          {/* PAYMENT ZONE — QR, stamp, pay button — only if hasClaims */}
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
                      alt="DuitNow QR code for payment"
                      width={200}
                      height={200}
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
                    <span lang="ms">Tak confirm lah. Cuba lagi k?</span>
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
