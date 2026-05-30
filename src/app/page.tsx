import Link from "next/link";
import { DemoChit } from "@/components/DemoChit";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-paper-table px-4 py-12">
      <svg
        viewBox="0 0 168 36"
        width="168"
        height="36"
        role="img"
        aria-label="tongtong."
        className="mb-1"
        overflow="visible"
      >
        <text
          x="0"
          y="28"
          fontSize="28"
          fontFamily="'Departure Mono', monospace"
          filter="url(#ink-bleed)"
        >
          <tspan fill="currentColor">tongtong</tspan>
          <tspan fill="#B91C1C">.</tspan>
        </text>
      </svg>

      <p className="text-[10px] uppercase tracking-widest text-ink-muted mb-3">
        A BILL FOR EVERYONE
      </p>

      <p className="text-lg font-bold uppercase tracking-wider text-ink mb-6 text-center max-w-[320px]">
        SPLIT THE BILL, NOT THE FRIENDSHIP.
      </p>

      <Link
        href="/create"
        className="mb-6 block w-full max-w-[320px] bg-pen text-white uppercase font-bold text-xs tracking-widest min-h-[48px] flex items-center justify-center"
      >
        START NEW BILL
      </Link>

      <DemoChit />

      <p
        className="mt-6 text-sm text-ink-muted text-center max-w-[280px]"
        style={{ fontFamily: "var(--font-handwriting)" }}
      >
        Eh ya, no more &ldquo;you transfer ah?&rdquo; drama lah. One bill.
        Everyone tandakan. Beres.
      </p>

      <div className="perforation my-6" />

      <div className="chit p-6 w-full max-w-[320px] mx-auto rotate-[-0.2deg]">
        <p
          className="text-xs uppercase tracking-widest text-ink-muted mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          HOW IT WORKS
        </p>
        <div className="flex gap-3 items-start py-2">
          <span
            className="text-2xl font-bold text-pen shrink-0"
            style={{ fontFamily: "var(--font-display)" }}
          >
            01.
          </span>
          <div>
            <p className="text-sm text-ink font-bold uppercase">
              Create your bill
            </p>
            <p className="text-xs text-ink-muted">
              Add items, upload QR. Takes 2 minutes.
            </p>
          </div>
        </div>
        <hr className="rule-hairline my-1" />
        <div className="flex gap-3 items-start py-2">
          <span
            className="text-2xl font-bold text-pen shrink-0"
            style={{ fontFamily: "var(--font-display)" }}
          >
            02.
          </span>
          <div>
            <p className="text-sm text-ink font-bold uppercase">
              Share the link
            </p>
            <p className="text-xs text-ink-muted">
              Everyone claims what they ordered lah.
            </p>
          </div>
        </div>
        <hr className="rule-hairline my-1" />
        <div className="flex gap-3 items-start py-2">
          <span
            className="text-2xl font-bold text-pen shrink-0"
            style={{ fontFamily: "var(--font-display)" }}
          >
            03.
          </span>
          <div>
            <p className="text-sm text-ink font-bold uppercase">
              Stamp settled
            </p>
            <p className="text-xs text-ink-muted">
              Confirm payments. No more chasing.
            </p>
          </div>
        </div>
      </div>

      <Link
        href="/create"
        className="mt-6 block w-full max-w-[320px] border border-pen text-pen uppercase font-bold text-xs tracking-widest min-h-[48px] flex items-center justify-center"
      >
        START NEW BILL
      </Link>
    </main>
  );
}
