"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { type ItemDraft, ItemRow } from "@/components/ItemRow";
import { RunningTotal } from "@/components/RunningTotal";
import { QRUpload } from "@/components/QRUpload";

/**
 * useOrganizerSecret — reads or generates the organizer UUID from localStorage.
 * AUTH-01: localStorage key "tongtong_organizer_secret"
 * Returns null on first render (SSR-safe); sets actual value in useEffect.
 */
function useOrganizerSecret(): string | null {
  const [secret, setSecret] = useState<string | null>(null);
  useEffect(() => {
    let stored = localStorage.getItem("tongtong_organizer_secret");
    if (!stored) {
      stored = crypto.randomUUID();
      localStorage.setItem("tongtong_organizer_secret", stored);
    }
    setSecret(stored);
  }, []);
  return secret;
}

export default function CreatePage() {
  const router = useRouter();
  const organizerSecret = useOrganizerSecret();
  const createBill = useMutation(api.bills.createBill);

  // Bill details state
  const [title, setTitle] = useState("");
  const [venueName, setVenueName] = useState("");
  const [billDate, setBillDate] = useState("");

  // Items state — D-08: items live in React local state until GENERATE LINK
  const [items, setItems] = useState<ItemDraft[]>([]);

  // Tax toggle state
  const [applySST, setApplySST] = useState(false);
  const [applyServiceCharge, setApplyServiceCharge] = useState(false);

  // QR upload state — BILL-04: storageId from Convex file storage
  const [qrStorageId, setQrStorageId] = useState<string | undefined>(undefined);
  const [receiptStorageId, setReceiptStorageId] = useState<string | undefined>(undefined);

  // Submission guard — prevents double-tap
  const [isSubmitting, setIsSubmitting] = useState(false);

  // WR-04: client-side item validation error message
  const [validationError, setValidationError] = useState<string | null>(null);

  // Add a new empty item row
  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", price: "", quantity: 1 },
    ]);
  }, []);

  // Update a field on an item by id
  const updateItem = useCallback(
    (id: string, field: keyof ItemDraft, value: string | number) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        )
      );
    },
    []
  );

  // Delete an item by id
  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Handle GENERATE LINK tap
  const handleGenerate = async () => {
    // T-03-03: guard against null secret (localStorage not yet hydrated)
    if (!organizerSecret) return;

    // BILL-06 / T-03-04: cannot generate with empty items
    if (items.length === 0) return;

    // WR-04: client-side validation — each item must have a name and a valid positive price
    const invalidItems = items.filter(
      (item) =>
        !item.name.trim() ||
        isNaN(parseFloat(item.price)) ||
        parseFloat(item.price) <= 0
    );
    if (invalidItems.length > 0) {
      setValidationError(
        "Each item must have a name and a price greater than RM 0.00."
      );
      return;
    }
    setValidationError(null);

    setIsSubmitting(true);
    try {
      const billId = await createBill({
        organizerSecret,
        title,
        applySST,
        applyServiceCharge,
        qrStorageId: qrStorageId as Id<"_storage"> | undefined,
        receiptStorageId: receiptStorageId as Id<"_storage"> | undefined,
        venueName: venueName || undefined,
        billDate: billDate || undefined,
        items: items.map((item, index) => ({
          name: item.name,
          // T-03-01: convert RM string to integer cents before sending to Convex
          price: Math.round(parseFloat(item.price || "0") * 100),
          quantity: item.quantity,
          orderIndex: index,
        })),
      });
      // D-02: redirect to share screen after successful bill creation
      router.push(`/share/${billId}`);
    } catch (err) {
      console.error("Failed to create bill:", err);
      setIsSubmitting(false);
    }
  };

  const isGenerateDisabled = items.length === 0 || isSubmitting;

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
            New Bill
          </h1>

          <div className="perforation my-4" />

          {/* BILL DETAILS ZONE */}
          <p
            className="text-xs font-bold uppercase text-ink-muted tracking-widest mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            BILL DETAILS
          </p>
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-ink-muted">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Team Lunch"
                className="w-full border border-ink bg-paper-chit px-3 py-2 text-ink text-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-pen focus-visible:outline-offset-2"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-ink-muted">
                Venue
              </label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="e.g. Pak Mat Nasi Lemak"
                className="w-full border border-ink bg-paper-chit px-3 py-2 text-ink text-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-pen focus-visible:outline-offset-2"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-ink-muted">
                Date
              </label>
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full border border-ink bg-paper-chit px-3 py-2 text-ink text-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-pen focus-visible:outline-offset-2"
              />
            </div>
          </div>

          <div className="perforation my-4" />

          {/* ITEMS ZONE */}
          <p
            className="text-xs font-bold uppercase text-ink-muted tracking-widest mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ITEMS
          </p>
          {items.length === 0 ? (
            <p className="text-ink-muted text-sm text-center py-4">
              Belum ada barang lagi — tekan + untuk tambah
            </p>
          ) : (
            <div className="space-y-1">
              {items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={addItem}
            className="mt-3 w-full h-11 border border-ink text-ink uppercase text-sm font-medium hover:opacity-70 transition-opacity"
          >
            + ADD ITEM
          </button>

          <div className="perforation my-4" />

          {/* TOTALS ZONE */}
          <p
            className="text-xs font-bold uppercase text-ink-muted tracking-widest mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            TOTALS
          </p>
          <div className="space-y-3 mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={applyServiceCharge}
                onChange={(e) => setApplyServiceCharge(e.target.checked)}
                className="w-4 h-4 accent-ink"
              />
              <span className="text-sm text-ink">Service Charge (10%)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={applySST}
                onChange={(e) => setApplySST(e.target.checked)}
                className="w-4 h-4 accent-ink"
              />
              <span className="text-sm text-ink">SST (6%)</span>
            </label>
          </div>
          <RunningTotal
            items={items}
            applySST={applySST}
            applyServiceCharge={applyServiceCharge}
          />

          <div className="perforation my-4" />

          {/* ATTACHMENTS ZONE */}
          <p
            className="text-xs font-bold uppercase text-ink-muted tracking-widest mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ATTACHMENTS
          </p>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-ink-muted mb-2">
                Receipt photo (optional)
              </p>
              <QRUpload onUpload={(id) => setReceiptStorageId(id)} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-ink-muted mb-2">
                DuitNow QR (optional)
              </p>
              <QRUpload onUpload={(id) => setQrStorageId(id)} />
            </div>
          </div>

          <div className="perforation my-4" />

          {/* GENERATE LINK — primary CTA, blue, disabled when no items */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerateDisabled}
            className="w-full h-12 bg-pen text-white uppercase font-bold text-sm tracking-widest flex items-center justify-center transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "GENERATING..." : "GENERATE LINK →"}
          </button>

          {items.length === 0 && (
            <p className="text-warning font-bold text-xs text-center mt-2">
              Kosong lah — tambah barang dulu baru boleh share
            </p>
          )}
          {validationError && (
            <p className="text-warning font-bold text-xs text-center mt-2">
              {validationError}
            </p>
          )}

        </div>
      </div>
    </main>
  );
}
