"use client";

import { use, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { BillSummaryCard } from "../../../components/BillSummaryCard";
import { ProgressBar } from "../../../components/ProgressBar";
import { StatsBar } from "../../../components/StatsBar";
import { MemberRow } from "../../../components/MemberRow";
import { calculateTotals } from "@/lib/calculateTotals";

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

  const confirmPayment = useMutation(api.payments.confirmPayment);
  const rejectPayment = useMutation(api.payments.rejectPayment);
  const generateUploadUrl = useMutation(api.bills.generateUploadUrl);
  const setBillReceipt = useMutation(api.bills.setBillReceipt);

  // organizerSecret is null while localStorage hasn't been read yet (SSR-safe)
  if (organizerSecret === null) {
    return (
      <main className="min-h-screen bg-paper-table flex items-center justify-center">
        <div className="chit max-w-[480px] w-full mx-4 p-4 animate-pulse">
          <div className="h-4 bg-ink opacity-10 rounded mb-3 w-1/3" />
          <div className="h-3 bg-ink opacity-10 rounded mb-2 w-full" />
          <div className="h-3 bg-ink opacity-10 rounded mb-2 w-4/5" />
          <div className="h-3 bg-ink opacity-10 rounded w-3/4" />
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
            DASHBOARD NOT ACCESSIBLE
          </h1>
          <p className="text-sm text-ink opacity-60">
            Dashboard access requires the device you used to create this chit.
          </p>
        </div>
      </main>
    );
  }

  // organizerSecret loaded but Convex data still arriving
  if (billData === undefined) {
    return (
      <main className="min-h-screen bg-paper-table flex items-center justify-center">
        <div className="chit max-w-[480px] w-full mx-4 p-4 animate-pulse">
          <div className="h-4 bg-ink opacity-10 rounded mb-3 w-1/3" />
          <div className="h-3 bg-ink opacity-10 rounded mb-2 w-full" />
          <div className="h-3 bg-ink opacity-10 rounded mb-2 w-4/5" />
          <div className="h-3 bg-ink opacity-10 rounded w-3/4" />
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
            DASHBOARD NOT ACCESSIBLE
          </h1>
          <p className="text-sm text-ink opacity-60">
            Dashboard access requires the device you used to create this chit.
          </p>
        </div>
      </main>
    );
  }

  const { bill, items } = billData;
  const { grandTotalCents } = calculateTotals(
    items,
    bill.applySST,
    bill.applyServiceCharge
  );

  // Phase 1: equal-split per-member amount (no item claiming yet)
  const memberCount = payments?.length ?? 0;
  const amountPerMemberCents =
    memberCount > 0 ? Math.round(grandTotalCents / memberCount) : grandTotalCents;

  // Derive stats from payments (CR-04: correct variable semantics)
  const confirmed = payments?.filter((p) => p.status === "settled").length ?? 0;
  const awaiting = payments?.filter((p) => p.status === "pending").length ?? 0;
  const rejected = payments?.filter((p) => p.status === "rejected").length ?? 0;
  void rejected; // tracked for future use; not surfaced in StatsBar
  const claimed = claimsStats?.claimedCount ?? 0;
  const unclaimed = claimsStats?.unclaimedCount ?? 0;

  // TOTAL COLLECTED: count of settled payments × per-member share
  const collectedCents = confirmed * amountPerMemberCents;

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

  // DASH-06: copies share link to clipboard
  function handleRemind() {
    navigator.clipboard.writeText(shareUrl).catch((err: unknown) => {
      console.error("Failed to copy share link:", err);
    });
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

  return (
    <main className="min-h-screen bg-paper-table">
      <div className="max-w-[960px] mx-auto px-4 py-8">
        {/* Heading */}
        <h1 className="text-2xl font-bold uppercase text-ink tracking-widest mb-0.5">
          {bill.title}
        </h1>
        <p className="text-xs text-ink opacity-60 mb-6 uppercase">
          {displayCode}
        </p>

        {/* 2-column layout: left 60%, right 40% on desktop (md+) */}
        <div className="md:grid md:grid-cols-[60%_40%] md:gap-8">

          {/* LEFT COLUMN */}
          <div>
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

            {payments?.length === 0 ? (
              /* Empty state per UI-11 */
              <div className="chit p-6 text-center">
                <p className="text-xs font-bold uppercase text-ink tracking-widest mb-1 opacity-60">
                  NOTHING HERE YET
                </p>
                <p className="text-sm text-ink opacity-60 mb-4">
                  Share the link and they&apos;ll appear here.
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
              /* Payment rows (DASH-03) */
              <div>
                {payments?.map((payment) => {
                  const memberStatus =
                    payment.status === "settled"
                      ? ("CONFIRMED" as const)
                      : payment.status === "pending"
                        ? ("AWAITING" as const)
                        : ("CLAIMED — UNPAID" as const);

                  return (
                    <MemberRow
                      key={payment._id}
                      name={payment.claimantName}
                      status={memberStatus}
                      amountOwed={amountPerMemberCents}
                      onConfirm={() => handleConfirm(payment._id)}
                      onReject={() => handleReject(payment._id)}
                      onRemind={handleRemind}
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
              items={items}
              applySST={bill.applySST}
              applyServiceCharge={bill.applyServiceCharge}
              displayCode={displayCode}
            />

            {/* Perforation between BillSummaryCard and quick actions */}
            <div className="perforation my-4" />

            {/* Quick actions */}
            <h3 className="uppercase text-xs font-bold text-ink tracking-widest mt-4 mb-2">
              QUICK ACTIONS
            </h3>

            {/* COPY SHARE LINK — neutral border */}
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="w-full border border-ink text-ink h-10 uppercase text-sm tracking-widest mb-2 cursor-pointer"
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

            {/* UPLOAD RECEIPT — new bonus feature */}
            <label className={`w-full border border-ink text-ink h-10 uppercase text-sm tracking-widest mb-2 flex items-center justify-center${isUploadingReceipt ? " opacity-50 cursor-wait" : " cursor-pointer"}`}>
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
                className="block w-full text-center text-xs text-pen underline mb-2"
              >
                VIEW RECEIPT
              </a>
            )}

            {/* CLOSE CHIT EARLY — red permitted per UI-SPEC (destructive action) */}
            {!showCloseConfirm ? (
              <button
                type="button"
                onClick={() => setShowCloseConfirm(true)}
                className="w-full border border-stamp text-stamp h-10 uppercase text-sm tracking-widest cursor-pointer"
              >
                CLOSE CHIT EARLY
              </button>
            ) : (
              <div className="border border-stamp p-3">
                <p className="text-xs text-stamp uppercase mb-2 font-bold">
                  Close this chit? Members will no longer be able to pay.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      alert("Close chit feature coming soon.");
                      setShowCloseConfirm(false);
                    }}
                    className="border border-stamp text-stamp text-xs h-8 px-3 uppercase tracking-widest cursor-pointer"
                  >
                    CLOSE CHIT
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCloseConfirm(false)}
                    className="border border-ink text-ink text-xs h-8 px-3 uppercase tracking-widest cursor-pointer"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
