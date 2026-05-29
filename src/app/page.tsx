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

      <p className="text-xs font-bold uppercase tracking-widest text-ink mb-6 opacity-60">
        A CHIT FOR EVERYONE
      </p>

      <p className="text-xs font-bold uppercase tracking-widest text-ink mb-6 text-center max-w-[320px]">
        SPLIT THE BILL, NOT THE FRIENDSHIP.
      </p>

      <DemoChit />

      <p
        className="mt-6 text-sm text-ink opacity-70 text-center max-w-[280px]"
        style={{ fontFamily: "var(--font-handwriting)" }}
      >
        Eh ya, no more &ldquo;you transfer ah?&rdquo; drama lah. One chit.
        Everyone tandakan. Beres.
      </p>

      <Link
        href="/create"
        className="mt-6 block w-full max-w-[320px] bg-pen text-white uppercase font-bold text-xs tracking-widest min-h-[48px] flex items-center justify-center"
      >
        START NEW BILL
      </Link>
    </main>
  );
}
