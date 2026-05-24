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
    <main className="min-h-screen bg-[--color-paper-table]">
      <div className="max-w-[480px] mx-auto px-4 py-8">
        {/* Page heading */}
        <h1 className="text-2xl font-bold uppercase text-[--color-ink] tracking-widest mb-6">
          CREATE NEW CHIT
        </h1>

        {/* Bill details section */}
        <div className="space-y-4">
          {/* Bill title */}
          <div className="flex flex-col gap-1">
            <label className="uppercase text-xs text-[--color-ink]">
              Bill Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Team Lunch"
              className="w-full border border-[--color-ink] bg-[--color-paper-chit] px-3 py-2 text-[--color-ink] text-sm rounded"
            />
          </div>

          {/* Venue / restaurant name (optional) */}
          <div className="flex flex-col gap-1">
            <label className="uppercase text-xs text-[--color-ink]">
              Restaurant / Venue
            </label>
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="e.g. Pak Mat Nasi Lemak"
              className="w-full border border-[--color-ink] bg-[--color-paper-chit] px-3 py-2 text-[--color-ink] text-sm rounded"
            />
          </div>

          {/* Date (optional) */}
          <div className="flex flex-col gap-1">
            <label className="uppercase text-xs text-[--color-ink]">
              Date
            </label>
            <input
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              className="w-full border border-[--color-ink] bg-[--color-paper-chit] px-3 py-2 text-[--color-ink] text-sm rounded"
            />
          </div>
        </div>

        {/* Items section */}
        <div className="mt-6">
          <h2 className="uppercase text-sm font-bold text-[--color-ink] mb-2">
            Items
          </h2>

          {/* Item list */}
          {items.length === 0 ? (
            <p className="text-[--color-ink] opacity-60 text-sm text-center py-4">
              ADD YOUR FIRST ITEM
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

          {/* ADD ITEM button — neutral styling, NOT blue (blue is reserved for primary CTAs) */}
          <button
            type="button"
            onClick={addItem}
            className="mt-3 w-full h-11 border border-[--color-ink] text-[--color-ink] uppercase text-sm font-medium rounded hover:opacity-70 transition-opacity"
          >
            + ADD ITEM
          </button>
        </div>

        {/* DuitNow QR upload — BILL-04: optional QR image for payment */}
        <div className="mt-6">
          <label className="uppercase text-xs text-[--color-ink] block mb-2">
            DUITNOW QR (OPTIONAL)
          </label>
          <QRUpload onUpload={(id) => setQrStorageId(id)} />
        </div>

        {/* Tax toggles */}
        <div className="mt-6 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={applyServiceCharge}
              onChange={(e) => setApplyServiceCharge(e.target.checked)}
              className="w-4 h-4 accent-[--color-ink]"
            />
            <span className="text-sm text-[--color-ink] uppercase">
              Service Charge (10%)
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={applySST}
              onChange={(e) => setApplySST(e.target.checked)}
              className="w-4 h-4 accent-[--color-ink]"
            />
            <span className="text-sm text-[--color-ink] uppercase">
              SST (6%)
            </span>
          </label>
        </div>

        {/* Running totals */}
        <RunningTotal
          items={items}
          applySST={applySST}
          applyServiceCharge={applyServiceCharge}
        />

        {/* GENERATE LINK button — primary CTA, blue bg, disabled when no items */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerateDisabled}
            className={`w-full h-12 bg-[--color-pen] text-white uppercase font-bold text-base rounded transition-opacity ${
              isGenerateDisabled
                ? "opacity-50 cursor-not-allowed pointer-events-none"
                : "hover:opacity-90"
            }`}
          >
            {isSubmitting ? "GENERATING..." : "GENERATE LINK →"}
          </button>

          {/* Inline validation message when no items */}
          {items.length === 0 && (
            <p className="text-[--color-ink] opacity-70 text-xs text-center mt-2">
              ADD AT LEAST ONE ITEM — You cannot share an empty chit.
            </p>
          )}

          {/* WR-04: inline validation message for invalid items */}
          {validationError && (
            <p className="text-[--color-ink] opacity-70 text-xs text-center mt-2">
              {validationError}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
