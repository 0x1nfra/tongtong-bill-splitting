import Link from "next/link";
import { DemoChit } from "@/components/DemoChit";

const HOW_IT_WORKS = [
  {
    num: "01.",
    title: "CREATE YOUR BILL",
    benefit: "Add items, upload QR. Takes 2 minutes, not 20.",
  },
  {
    num: "02.",
    title: "SHARE THE LINK",
    benefit: "Everyone claims what they ordered. No confusion.",
  },
  {
    num: "03.",
    title: "COLLECT PAYMENT",
    benefit: "Confirm via DuitNow. No more chasing.",
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-paper-table px-4 py-12">
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

      <div className="perforation my-6 w-full max-w-[320px]" />

      <div className="chit p-6 w-full max-w-[320px] mx-auto">
        <p
          className="text-xs uppercase tracking-widest text-ink-muted mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          HOW IT WORKS
        </p>

        {HOW_IT_WORKS.map((step, i) => (
          <div key={step.num}>
            <div className="flex gap-3 items-start py-2">
              <span
                className="text-2xl font-bold text-pen shrink-0"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {step.num}
              </span>
              <div>
                <p className="text-sm text-ink font-bold uppercase">
                  {step.title}
                </p>
                <p className="text-xs text-ink-muted">{step.benefit}</p>
              </div>
            </div>
            {i < HOW_IT_WORKS.length - 1 && (
              <hr className="rule-hairline my-1" />
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
