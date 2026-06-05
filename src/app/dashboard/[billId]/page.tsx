"use client";

import { use, useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { BillSummaryCard } from "../../../components/BillSummaryCard";
import { CopyLinkField } from "../../../components/CopyLinkField";
import { ProgressBar } from "../../../components/ProgressBar";
import { StatsBar } from "../../../components/StatsBar";
import { MemberRow } from "../../../components/MemberRow";
import { calculateTotals, calculatePersonTotals } from "@/lib/calculateTotals";

export default function DashboardPage({
  params,
}: {
  params: Promise<{ billId: string }>;
}) {
  const { billId } = use(params);
  const [organizerSecret, setOrganizerSecret] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isUploadingQR, setIsUploadingQR] = useState(false);
  const [closeBillMsg, setCloseBillMsg] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("tongtong_organizer_secret");
    // null means key absent (different device) — coerce to "" so the !organizerSecret guard fires
    setOrganizerSecret(stored ?? "");
  }, []);

  useEffect(() => {
    setShareUrl(`${window.location.origin}/c/${billId}`);
  }, [billId]);

  // T-02-01: skip query until secret is loaded from localStorage to prevent
  // unauthenticated request; Convex server will also verify the secret
  const billData = useQuery(
    api.bills.getBillForOrganizer,
    organizerSecret ? { billId: billId as Id<"bills">, organizerSecret } : "skip"
  );

  // Separate real-time payments subscription (DASH-01, DASH-02, DASH-03)
  const payments = useQuery(
    api.payments.getPaymentsForBill,
    organizerSecret
      ? { billId: billId as Id<"bills">, organizerSecret }
      : "skip"
  );

  // Real-time CLAIMED/UNCLAIMED subscription (DASH-02); skipped until organizerSecret loads
  const claimsStats = useQuery(
    api.bills.getClaimsForBill,
    organizerSecret ? { billId: billId as Id<"bills">, organizerSecret } : "skip"
  );

  // DASH-03: all claimants (members who claimed at least one item) — used for PEOPLE tab
  const claimants = useQuery(
    api.bills.getClaimantsForBill,
    organizerSecret ? { billId: billId as Id<"bills">, organizerSecret } : "skip"
  );

  const confirmPayment = useMutation(api.payments.confirmPayment);
  const rejectPayment = useMutation(api.payments.rejectPayment);
  const generateUploadUrl = useMutation(api.bills.generateUploadUrl);
  const setBillReceipt = useMutation(api.bills.setBillReceipt);
  const updateQR = useMutation(api.bills.updateQR);
  const updateRoundingAdjustment = useMutation(api.bills.updateRoundingAdjustment);
  const updateBankingInfo = useMutation(api.bills.updateBankingInfo);

  // CR-01: container refs so onBlur reads sibling values from DOM, not stale Convex subscription
  const bankInfoDesktopRef = useRef<HTMLDivElement>(null);
  const bankInfoMobileRef = useRef<HTMLDivElement>(null);

  // CR-02: read all 4 banking input values from a container ref.
  // Empty string is passed explicitly so updateBankingInfo treats it as a clear (stores null).
  const readBankInfoFromContainer = (container: HTMLDivElement | null) => {
    if (!container) return { bankName: undefined, accountNumber: undefined, accountHolderName: undefined, duitNowId: undefined };
    const inputs = container.querySelectorAll<HTMLInputElement>('input[data-field]');
    const vals: Record<string, string> = {};
    inputs.forEach(inp => {
      vals[inp.dataset.field!] = inp.value.trim() || "";  // CR-02: empty string, not undefined
    });
    return {
      bankName: vals['bankName'],
      accountNumber: vals['accountNumber'],
      accountHolderName: vals['accountHolderName'],
      duitNowId: vals['duitNowId'],
    };
  };

  // organizerSecret is null while localStorage hasn't been read yet (SSR-safe)
  if (organizerSecret === null) {
    return (
      <main className="min-h-screen bg-paper-table flex items-center justify-center">
        <div role="status" aria-label="Loading dashboard" className="chit max-w-[480px] w-full mx-4 p-4 animate-pulse">
          <div className="h-4 bg-ink opacity-10 mb-3 w-1/3" />
          <div className="h-3 bg-ink opacity-10 mb-2 w-full" />
          <div className="h-3 bg-ink opacity-10 mb-2 w-4/5" />
          <div className="h-3 bg-ink opacity-10 w-3/4" />
        </div>
      </main>
    );
  }

  // D-10: organizerSecret is "" (empty string) — key absent, wrong device (AUTH-03)
  if (!organizerSecret) {
    return (
      <main className="min-h-screen bg-paper-table flex items-center justify-center">
        <div className="max-w-[480px] mx-auto px-4 py-12 text-center">
          <h1 className="text-xl font-bold uppercase text-ink tracking-widest mb-3">
            WRONG DEVICE LAH
          </h1>
          <p className="text-sm text-ink-muted">
            This dashboard can only be opened from the device that created this bill lah.
          </p>
        </div>
      </main>
    );
  }

  // organizerSecret loaded but Convex data still arriving
  if (billData === undefined) {
    return (
      <main className="min-h-screen bg-paper-table flex items-center justify-center">
        <div role="status" aria-label="Loading dashboard" className="chit max-w-[480px] w-full mx-4 p-4 animate-pulse">
          <div className="h-4 bg-ink opacity-10 mb-3 w-1/3" />
          <div className="h-3 bg-ink opacity-10 mb-2 w-full" />
          <div className="h-3 bg-ink opacity-10 mb-2 w-4/5" />
          <div className="h-3 bg-ink opacity-10 w-3/4" />
        </div>
      </main>
    );
  }

  // D-10: bill is null — secret does not match this bill's organizer (AUTH-03)
  if (billData === null) {
    return (
      <main className="min-h-screen bg-paper-table flex items-center justify-center">
        <div className="max-w-[480px] mx-auto px-4 py-12 text-center">
          <h1 className="text-xl font-bold uppercase text-ink tracking-widest mb-3">
            WRONG DEVICE LAH
          </h1>
          <p className="text-sm text-ink-muted">
            This dashboard can only be opened from the device that created this bill lah.
          </p>
        </div>
      </main>
    );
  }

  const { bill, items } = billData;
  const isArchived = !!bill.archivedAt;
  const billTotals = calculateTotals(items, bill.applySST, bill.applyServiceCharge, bill.roundingAdjustmentCents ?? 0);
  const { grandTotalCents } = billTotals;

  // Build synthetic claims from claimedItems data for per-member calculation
  const syntheticClaims = (claimants ?? []).flatMap((c) =>
    c.claimedItems.map((item) => ({ itemId: item._id, claimantSession: c.claimantSession, claimQty: item.claimedQty }))
  );

  // Pre-compute actual per-member totals based on claimed items
  const memberTotalsMap = new Map<string, number>();
  for (const claimant of claimants ?? []) {
    const pt = calculatePersonTotals(items, syntheticClaims, claimant.claimantSession, billTotals, bill.roundingAdjustmentCents ?? 0);
    memberTotalsMap.set(claimant.claimantSession, pt.personTotalCents);
  }

  // Discrepancy between grand total and sum of per-member totals
  const sumOfPersonTotals = [...memberTotalsMap.values()].reduce((a, b) => a + b, 0);
  const discrepancyCents = grandTotalCents - sumOfPersonTotals;

  // Derive stats from payments (CR-04: correct variable semantics)
  const confirmed = payments?.filter((p) => p.status === "settled").length ?? 0;
  const awaiting = payments?.filter((p) => p.status === "pending").length ?? 0;
  const rejected = payments?.filter((p) => p.status === "rejected").length ?? 0;
  void rejected; // tracked for future use; not surfaced in StatsBar
  const claimed = claimsStats?.claimedCount ?? 0;
  const unclaimed = claimsStats?.unclaimedCount ?? 0;

  // TOTAL COLLECTED: sum of settled members' actual item-based amounts
  const collectedCents = (claimants ?? [])
    .filter((c) => c.payment?.status === "settled")
    .reduce((sum, c) => sum + (memberTotalsMap.get(c.claimantSession) ?? 0), 0);

  // Display code per UI-SPEC: "#TT-XXXX" first 4 chars of Convex ID uppercase
  const displayCode = `#TT-${billId.slice(0, 4).toUpperCase()}`;

  function handleConfirm(paymentId: string) {
    confirmPayment({
      paymentId: paymentId as Id<"payments">,
      organizerSecret: organizerSecret!,
    }).catch((err: unknown) => {
      console.error("Failed to confirm payment:", err);
    });
  }

  function handleReject(paymentId: string) {
    rejectPayment({
      paymentId: paymentId as Id<"payments">,
      organizerSecret: organizerSecret!,
    }).catch((err: unknown) => {
      console.error("Failed to reject payment:", err);
    });
  }

  // BONUS-04 (D-07): per-member WhatsApp nudge for "CLAIMED — UNPAID" members
  // T-04-04: sanitize claimantName (stored user input) before URL interpolation
  function handleNudgeMember(memberName: string) {
    const sanitizedName = memberName.replace(/[<>"]/g, "");
    const msg = encodeURIComponent(
      `Eh ${sanitizedName}, still haven't paid for the ${bill.title} bill lah! Tap here to settle: ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  function handleCopyShareLink() {
    navigator.clipboard.writeText(shareUrl).catch((err: unknown) => {
      console.error("Failed to copy share link:", err);
    });
  }

  function handleExportCSV() {
    const rows = [
      ["TongTong Bill Export"],
      ["Title", bill.title],
      ["Venue", bill.venueName ?? ""],
      ["Date", bill.billDate ?? ""],
      ["SST", bill.applySST ? "Yes" : "No"],
      ["Service Charge", bill.applyServiceCharge ? "Yes" : "No"],
      [],
      ["ITEMS"],
      ["Name", "Price (RM)", "Qty", "Subtotal (RM)"],
      ...items.map((i) => [
        i.name,
        (i.price / 100).toFixed(2),
        String(i.quantity),
        ((i.price * i.quantity) / 100).toFixed(2),
      ]),
      [],
      ["PAYMENTS"],
      ["Name", "Status", "Paid At"],
      ...(payments ?? []).map((p) => [
        p.claimantName,
        p.status,
        p.paidAt ? new Date(p.paidAt).toLocaleString() : "",
      ]),
      [],
      ["Grand Total (RM)", (grandTotalCents / 100).toFixed(2)],
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tongtong-${displayCode.replace("#", "")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleReceiptUpload(file: File) {
    if (!organizerSecret) return;
    setIsUploadingReceipt(true);
    try {
      const uploadUrl = await generateUploadUrl({});
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error(`Upload failed: ${result.status}`);
      const { storageId } = (await result.json()) as { storageId: string };
      if (!storageId) throw new Error("Upload response missing storageId");
      await setBillReceipt({
        billId: billId as Id<"bills">,
        organizerSecret,
        receiptStorageId: storageId as Id<"_storage">,
      });
    } catch (err) {
      console.error("Failed to upload receipt:", err);
    } finally {
      setIsUploadingReceipt(false);
    }
  }

  async function handleQRUpload(file: File) {
    if (!organizerSecret) return;
    setIsUploadingQR(true);
    try {
      const uploadUrl = await generateUploadUrl({});
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error(`Upload failed: ${result.status}`);
      const { storageId } = (await result.json()) as { storageId: string };
      if (!storageId) throw new Error("Upload response missing storageId");
      await updateQR({
        billId: billId as Id<"bills">,
        organizerSecret,
        qrStorageId: storageId as Id<"_storage">,
      });
    } catch (err) {
      console.error("Failed to upload QR:", err);
    } finally {
      setIsUploadingQR(false);
    }
  }

  const closeBillSection = (
    <div className="mt-4 pt-4 border-t border-ink/20">
      {closeBillMsg && (
        <p role="status" className="text-xs text-warning uppercase tracking-widest mb-2">
          {closeBillMsg}
        </p>
      )}
      {!showCloseConfirm ? (
        <button
          type="button"
          onClick={() => { setShowCloseConfirm(true); setCloseBillMsg(null); }}
          className="w-full border border-stamp text-stamp h-10 uppercase text-sm tracking-widest cursor-pointer"
        >
          CLOSE BILL EARLY
        </button>
      ) : (
        <div className="border border-stamp p-3">
          <p className="text-xs text-stamp uppercase mb-2 font-bold">
            Close this bill? Members will no longer be able to pay.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setCloseBillMsg("COMING SOON — close bill not yet available.");
                setShowCloseConfirm(false);
              }}
              className="border border-stamp text-stamp text-xs min-h-[44px] px-3 uppercase tracking-widest cursor-pointer"
            >
              CLOSE BILL
            </button>
            <button
              type="button"
              onClick={() => setShowCloseConfirm(false)}
              className="border border-ink text-ink text-xs min-h-[44px] px-3 uppercase tracking-widest cursor-pointer"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <main id="main-content" className="min-h-screen bg-paper-table">
      <div className="max-w-[960px] mx-auto px-4 py-8">
        {/* PAGE HEADER */}
        <p
          className="text-[0.625rem] font-bold tracking-widest text-ink-muted mb-0.5"
          style={{ fontFamily: "var(--font-display)" }}
        >
          tongtong.
        </p>
        <h1
          className="text-xl font-bold uppercase text-ink tracking-widest mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Dashboard
        </h1>
        <p
          className="text-sm font-bold text-ink uppercase tracking-widest mb-0.5 break-words"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {bill.title}
        </p>
        <p className="text-[0.625rem] text-ink-muted mb-6 uppercase tracking-widest break-words">
          {bill.venueName ? `${bill.venueName} · ` : ""}{displayCode}
        </p>

        {/* Mobile-only share strip — md+ uses right column quick actions */}
        <div className="md:hidden mb-6">
          <p className="text-xs text-ink-muted mb-2">Share link</p>
          <CopyLinkField url={shareUrl} />
        </div>

        {/* 2-column layout: left 60%, right 40% on desktop (md+) */}
        <div className="md:grid md:grid-cols-[60%_40%] md:gap-8">

          {/* LEFT COLUMN */}
          <div>
            {/* BONUS-03: ARCHIVED banner — inside left column so width matches content */}
            {isArchived && (
              <div className="w-full border-2 border-stamp text-stamp text-xs font-bold uppercase tracking-widest py-3 text-center mb-4">
                BILL ARCHIVED — READ ONLY
              </div>
            )}

            {/* Progress widget (DASH-01) */}
            <ProgressBar
              collectedCents={collectedCents}
              totalCents={grandTotalCents}
            />

            {/* Stats bar (DASH-02) — claimed/unclaimed from real getClaimsForBill subscription */}
            <StatsBar
              confirmed={confirmed}
              awaiting={awaiting}
              claimed={claimed}
              unclaimed={unclaimed}
            />

            {/* Perforation between stats and people section */}
            <div className="perforation my-4" />

            {/* People section (DASH-03) */}
            <h2 className="uppercase text-xs font-bold text-ink tracking-widest mt-6 mb-2">
              PEOPLE
            </h2>

            {!claimants || claimants.length === 0 ? (
              /* Empty state per UI-11 — shown when no claims yet */
              <div className="chit p-6 text-center">
                <p className="text-xs font-bold uppercase text-ink-muted tracking-widest mb-1">
                  NOTHING HERE YET
                </p>
                <p className="text-sm text-ink-muted mb-4">
                  Share the link — members appear here when they start claiming items.
                </p>
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="bg-pen text-white text-xs h-10 px-5 uppercase tracking-widest cursor-pointer"
                >
                  COPY SHARE LINK
                </button>
              </div>
            ) : (
              /* Claimant rows (DASH-03) — populated from claims, not payments */
              <div>
                {claimants.map((claimant) => {
                  const memberStatus =
                    claimant.payment?.status === "settled"
                      ? ("CONFIRMED" as const)
                      : claimant.payment?.status === "pending"
                        ? ("AWAITING" as const)
                        : ("CLAIMED — UNPAID" as const);

                  return (
                    <MemberRow
                      key={claimant.claimantSession}
                      name={claimant.claimantName}
                      status={memberStatus}
                      amountOwed={memberTotalsMap.get(claimant.claimantSession) ?? 0}
                      claimedItems={claimant.claimedItems}
                      onConfirm={
                        !isArchived && claimant.payment && memberStatus === "AWAITING"
                          ? () => handleConfirm(claimant.payment!._id)
                          : undefined
                      }
                      onReject={
                        !isArchived && claimant.payment && memberStatus === "AWAITING"
                          ? () => handleReject(claimant.payment!._id)
                          : undefined
                      }
                      onRemind={
                        !isArchived && memberStatus === "CLAIMED — UNPAID"
                          ? () => handleNudgeMember(claimant.claimantName)
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN — hidden on mobile, shown md+ (DASH-07) */}
          <div className="hidden md:block">
            {/* Chit summary */}
            <BillSummaryCard
              title={bill.title}
              venueName={bill.venueName}
              items={items}
              applySST={bill.applySST}
              applyServiceCharge={bill.applyServiceCharge}
              displayCode={displayCode}
            />

            {/* Perforation between BillSummaryCard and totals/actions */}
            <div className="perforation my-4" />

            {/* SPLIT VS TOTAL discrepancy row — only when there are claimants */}
            {(claimants?.length ?? 0) > 0 && (
              <div className="dot-leader flex justify-between text-sm text-ink mb-2">
                <span className="text-ink-muted">Split vs Total</span>
                <span className={discrepancyCents !== 0 ? "text-ink" : "text-ink-muted"}>
                  {discrepancyCents > 0 ? "+" : ""}{(discrepancyCents / 100).toFixed(2)} difference
                </span>
              </div>
            )}

            {/* ROUNDING ADJUSTMENT live field */}
            <div className="flex flex-col gap-1 mb-4">
              <label className="text-[0.625rem] uppercase tracking-widest text-ink-muted">
                Rounding Adjustment
              </label>
              <input
                type="number"
                step="1"
                defaultValue={bill.roundingAdjustmentCents ?? 0}
                disabled={isArchived}
                onBlur={(e) => {
                  const value = parseInt(e.target.value, 10) || 0;
                  updateRoundingAdjustment({
                    billId: billId as Id<"bills">,
                    organizerSecret: organizerSecret!,
                    roundingAdjustmentCents: value,
                  }).catch((err: unknown) => console.error("Failed to update rounding adjustment:", err));
                }}
                className="w-full border border-ink bg-paper-chit px-3 py-2 text-ink text-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-pen focus-visible:outline-offset-2 disabled:opacity-50"
              />
            </div>

            {/* BANKING INFO — organizer can save transfer details; displayed on member view */}
            <div ref={bankInfoDesktopRef}>
            <div className="flex flex-col gap-1 mb-4">
              <label htmlFor="bankName-desktop" className="text-[0.625rem] uppercase tracking-widest text-ink-muted">
                Bank Name
              </label>
              <input
                id="bankName-desktop"
                data-field="bankName"
                key={bill.bankName ?? ''}
                type="text"
                defaultValue={bill.bankName ?? ''}
                disabled={isArchived}
                onBlur={() => {
                  updateBankingInfo({
                    billId: billId as Id<"bills">,
                    organizerSecret: organizerSecret!,
                    ...readBankInfoFromContainer(bankInfoDesktopRef.current),
                  }).catch((err: unknown) => console.error("Failed to update banking info:", err));
                }}
                className="w-full border border-ink bg-paper-chit px-3 py-2 text-ink text-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-pen focus-visible:outline-offset-2 disabled:opacity-50"
              />
            </div>
            <div className="flex flex-col gap-1 mb-4">
              <label htmlFor="accountNumber-desktop" className="text-[0.625rem] uppercase tracking-widest text-ink-muted">
                Account No.
              </label>
              <input
                id="accountNumber-desktop"
                data-field="accountNumber"
                key={bill.accountNumber ?? ''}
                type="text"
                defaultValue={bill.accountNumber ?? ''}
                disabled={isArchived}
                onBlur={() => {
                  updateBankingInfo({
                    billId: billId as Id<"bills">,
                    organizerSecret: organizerSecret!,
                    ...readBankInfoFromContainer(bankInfoDesktopRef.current),
                  }).catch((err: unknown) => console.error("Failed to update banking info:", err));
                }}
                className="w-full border border-ink bg-paper-chit px-3 py-2 text-ink text-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-pen focus-visible:outline-offset-2 disabled:opacity-50"
              />
            </div>
            <div className="flex flex-col gap-1 mb-4">
              <label htmlFor="accountHolderName-desktop" className="text-[0.625rem] uppercase tracking-widest text-ink-muted">
                Account Holder
              </label>
              <input
                id="accountHolderName-desktop"
                data-field="accountHolderName"
                key={bill.accountHolderName ?? ''}
                type="text"
                defaultValue={bill.accountHolderName ?? ''}
                disabled={isArchived}
                onBlur={() => {
                  updateBankingInfo({
                    billId: billId as Id<"bills">,
                    organizerSecret: organizerSecret!,
                    ...readBankInfoFromContainer(bankInfoDesktopRef.current),
                  }).catch((err: unknown) => console.error("Failed to update banking info:", err));
                }}
                className="w-full border border-ink bg-paper-chit px-3 py-2 text-ink text-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-pen focus-visible:outline-offset-2 disabled:opacity-50"
              />
            </div>
            <div className="flex flex-col gap-1 mb-4">
              <label htmlFor="duitNowId-desktop" className="text-[0.625rem] uppercase tracking-widest text-ink-muted">
                DuitNow ID
              </label>
              <input
                id="duitNowId-desktop"
                data-field="duitNowId"
                key={bill.duitNowId ?? ''}
                type="text"
                defaultValue={bill.duitNowId ?? ''}
                disabled={isArchived}
                onBlur={() => {
                  updateBankingInfo({
                    billId: billId as Id<"bills">,
                    organizerSecret: organizerSecret!,
                    ...readBankInfoFromContainer(bankInfoDesktopRef.current),
                  }).catch((err: unknown) => console.error("Failed to update banking info:", err));
                }}
                className="w-full border border-ink bg-paper-chit px-3 py-2 text-ink text-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-pen focus-visible:outline-offset-2 disabled:opacity-50"
              />
            </div>
            </div>

            {/* Quick actions */}
            <h3 className="uppercase text-xs font-bold text-ink tracking-widest mt-4 mb-2">
              QUICK ACTIONS
            </h3>

            {/* COPY SHARE LINK — primary action, filled blue */}
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="w-full bg-pen text-white h-10 uppercase text-sm tracking-widest mb-2 cursor-pointer"
            >
              COPY SHARE LINK
            </button>

            {/* EXPORT CSV — BONUS-08 */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="w-full border border-ink text-ink h-10 uppercase text-sm tracking-widest mb-2 cursor-pointer"
            >
              EXPORT CSV
            </button>

            {/* UPLOAD RECEIPT */}
            <div className="mb-2">
              {billData.receiptUrl ? (
                <div className="flex gap-1">
                  <label className={`flex-1 border border-ink text-ink h-10 uppercase text-xs tracking-widest flex items-center justify-center${isUploadingReceipt ? " opacity-50 cursor-wait" : " cursor-pointer"}`}>
                    {isUploadingReceipt ? "UPLOADING..." : "CHANGE RECEIPT"}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={isUploadingReceipt}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleReceiptUpload(file);
                      }}
                    />
                  </label>
                  <a
                    href={billData.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-ink text-ink h-10 px-4 uppercase text-xs tracking-widest flex items-center justify-center cursor-pointer"
                  >
                    VIEW →
                  </a>
                </div>
              ) : (
                <label className={`w-full border border-ink text-ink h-10 uppercase text-sm tracking-widest flex items-center justify-center${isUploadingReceipt ? " opacity-50 cursor-wait" : " cursor-pointer"}`}>
                  UPLOAD RECEIPT
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={isUploadingReceipt}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleReceiptUpload(file);
                    }}
                  />
                </label>
              )}
            </div>

            {/* UPLOAD QR / REPLACE QR */}
            <div className="mb-2">
              {billData.qrUrl ? (
                <div className="flex gap-1">
                  <label className={`flex-1 border border-ink text-ink h-10 uppercase text-xs tracking-widest flex items-center justify-center${isUploadingQR ? " opacity-50 cursor-wait" : " cursor-pointer"}`}>
                    {isUploadingQR ? "UPLOADING..." : "CHANGE QR"}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={isUploadingQR}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleQRUpload(file);
                      }}
                    />
                  </label>
                  <a
                    href={billData.qrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-ink text-ink h-10 px-4 uppercase text-xs tracking-widest flex items-center justify-center cursor-pointer"
                  >
                    VIEW →
                  </a>
                </div>
              ) : (
                <label className={`w-full border border-ink text-ink h-10 uppercase text-sm tracking-widest flex items-center justify-center${isUploadingQR ? " opacity-50 cursor-wait" : " cursor-pointer"}`}>
                  UPLOAD QR
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={isUploadingQR}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleQRUpload(file);
                    }}
                  />
                </label>
              )}
            </div>

            {/* CLOSE CHIT EARLY — destructive, visually separated */}
            {closeBillSection}
          </div>
        </div>

        {/* Mobile quick actions — desktop right column features surfaced below PEOPLE on mobile */}
        <div className="md:hidden mt-6">

          {/* SPLIT VS TOTAL discrepancy row — only when there are claimants */}
          {(claimants?.length ?? 0) > 0 && (
            <div className="dot-leader flex justify-between text-sm text-ink mb-2">
              <span className="text-ink-muted">Split vs Total</span>
              <span className={discrepancyCents !== 0 ? "text-ink" : "text-ink-muted"}>
                {discrepancyCents > 0 ? "+" : ""}{(discrepancyCents / 100).toFixed(2)} difference
              </span>
            </div>
          )}

          {/* ROUNDING ADJUSTMENT live field */}
          <div className="flex flex-col gap-1 mb-4">
            <label className="text-[0.625rem] uppercase tracking-widest text-ink-muted">
              Rounding Adjustment
            </label>
            <input
              type="number"
              step="1"
              defaultValue={bill.roundingAdjustmentCents ?? 0}
              disabled={isArchived}
              onBlur={(e) => {
                const value = parseInt(e.target.value, 10) || 0;
                updateRoundingAdjustment({
                  billId: billId as Id<"bills">,
                  organizerSecret: organizerSecret!,
                  roundingAdjustmentCents: value,
                }).catch((err: unknown) => console.error("Failed to update rounding adjustment:", err));
              }}
              className="w-full border border-ink bg-paper-chit px-3 py-2 text-ink text-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-pen focus-visible:outline-offset-2 disabled:opacity-50"
            />
          </div>

          {/* BANKING INFO — organizer can save transfer details; displayed on member view */}
          <div ref={bankInfoMobileRef}>
          <div className="flex flex-col gap-1 mb-4">
            <label htmlFor="bankName-mobile" className="text-[0.625rem] uppercase tracking-widest text-ink-muted">
              Bank Name
            </label>
            <input
              id="bankName-mobile"
              data-field="bankName"
              key={bill.bankName ?? ''}
              type="text"
              defaultValue={bill.bankName ?? ''}
              disabled={isArchived}
              onBlur={() => {
                updateBankingInfo({
                  billId: billId as Id<"bills">,
                  organizerSecret: organizerSecret!,
                  ...readBankInfoFromContainer(bankInfoMobileRef.current),
                }).catch((err: unknown) => console.error("Failed to update banking info:", err));
              }}
              className="w-full border border-ink bg-paper-chit px-3 py-2 text-ink text-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-pen focus-visible:outline-offset-2 disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col gap-1 mb-4">
            <label htmlFor="accountNumber-mobile" className="text-[0.625rem] uppercase tracking-widest text-ink-muted">
              Account No.
            </label>
            <input
              id="accountNumber-mobile"
              data-field="accountNumber"
              key={bill.accountNumber ?? ''}
              type="text"
              defaultValue={bill.accountNumber ?? ''}
              disabled={isArchived}
              onBlur={() => {
                updateBankingInfo({
                  billId: billId as Id<"bills">,
                  organizerSecret: organizerSecret!,
                  ...readBankInfoFromContainer(bankInfoMobileRef.current),
                }).catch((err: unknown) => console.error("Failed to update banking info:", err));
              }}
              className="w-full border border-ink bg-paper-chit px-3 py-2 text-ink text-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-pen focus-visible:outline-offset-2 disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col gap-1 mb-4">
            <label htmlFor="accountHolderName-mobile" className="text-[0.625rem] uppercase tracking-widest text-ink-muted">
              Account Holder
            </label>
            <input
              id="accountHolderName-mobile"
              data-field="accountHolderName"
              key={bill.accountHolderName ?? ''}
              type="text"
              defaultValue={bill.accountHolderName ?? ''}
              disabled={isArchived}
              onBlur={() => {
                updateBankingInfo({
                  billId: billId as Id<"bills">,
                  organizerSecret: organizerSecret!,
                  ...readBankInfoFromContainer(bankInfoMobileRef.current),
                }).catch((err: unknown) => console.error("Failed to update banking info:", err));
              }}
              className="w-full border border-ink bg-paper-chit px-3 py-2 text-ink text-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-pen focus-visible:outline-offset-2 disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col gap-1 mb-4">
            <label htmlFor="duitNowId-mobile" className="text-[0.625rem] uppercase tracking-widest text-ink-muted">
              DuitNow ID
            </label>
            <input
              id="duitNowId-mobile"
              data-field="duitNowId"
              key={bill.duitNowId ?? ''}
              type="text"
              defaultValue={bill.duitNowId ?? ''}
              disabled={isArchived}
              onBlur={() => {
                updateBankingInfo({
                  billId: billId as Id<"bills">,
                  organizerSecret: organizerSecret!,
                  ...readBankInfoFromContainer(bankInfoMobileRef.current),
                }).catch((err: unknown) => console.error("Failed to update banking info:", err));
              }}
              className="w-full border border-ink bg-paper-chit px-3 py-2 text-ink text-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-pen focus-visible:outline-offset-2 disabled:opacity-50"
            />
          </div>
          </div>

          <h3 className="uppercase text-xs font-bold text-ink tracking-widest mb-2">
            QUICK ACTIONS
          </h3>

          <button
            type="button"
            onClick={handleExportCSV}
            className="w-full border border-ink text-ink h-10 uppercase text-sm tracking-widest mb-2 cursor-pointer"
          >
            EXPORT CSV
          </button>

          <div className="mb-2">
            <label className={`w-full border border-ink text-ink h-10 uppercase text-sm tracking-widest flex items-center justify-center${isUploadingReceipt ? " opacity-50 cursor-wait" : " cursor-pointer"}`}>
              {isUploadingReceipt ? "UPLOADING..." : billData.receiptUrl ? "CHANGE RECEIPT" : "UPLOAD RECEIPT"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={isUploadingReceipt}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleReceiptUpload(file);
                }}
              />
            </label>
            {billData.receiptUrl && (
              <a
                href={billData.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-pen underline cursor-pointer mt-1 inline-block"
              >
                View receipt
              </a>
            )}
          </div>

          <div className="mb-2">
            <label className={`w-full border border-ink text-ink h-10 uppercase text-sm tracking-widest flex items-center justify-center${isUploadingQR ? " opacity-50 cursor-wait" : " cursor-pointer"}`}>
              {isUploadingQR ? "UPLOADING..." : billData.qrUrl ? "CHANGE QR" : "UPLOAD QR"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={isUploadingQR}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleQRUpload(file);
                }}
              />
            </label>
            {billData.qrUrl && (
              <a
                href={billData.qrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-pen underline cursor-pointer mt-1 inline-block"
              >
                View QR
              </a>
            )}
          </div>

          {closeBillSection}
        </div>
      </div>
    </main>
  );
}
