"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

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
  const _router = useRouter();
  const organizerSecret = useOrganizerSecret();
  const _createBill = useMutation(api.bills.createBill);

  return (
    <main className="min-h-screen bg-[--color-paper-table]">
      <div className="max-w-[480px] mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold uppercase text-[--color-ink] tracking-widest mb-6">
          CREATE NEW CHIT
        </h1>
        <p className="text-sm text-[--color-ink] opacity-60">
          {organizerSecret ? "Bill builder coming soon" : "Loading..."}
        </p>
      </div>
    </main>
  );
}
