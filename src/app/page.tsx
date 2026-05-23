import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[--color-paper-table]">
      <div className="max-w-[480px] mx-auto px-4 py-12 text-center w-full">
        <h1 className="text-3xl font-bold text-[--color-ink] lowercase tracking-tight mb-2">
          tongtong.
        </h1>
        <p className="text-sm font-bold uppercase text-[--color-ink] tracking-widest mb-4">
          SPLIT THE BILL, NOT THE FRIENDSHIP.
        </p>
        <p className="text-sm text-[--color-ink] opacity-60 mb-8">
          Eh ya, no more &ldquo;you transfer ah?&rdquo; drama lah.
        </p>
        <Link
          href="/create"
          className="block w-full bg-[--color-pen] text-white uppercase font-bold text-sm tracking-widest py-3 min-h-[48px] flex items-center justify-center"
        >
          START NEW BILL
        </Link>
        <p className="text-xs text-[--color-ink] opacity-60 mt-3">
          No account needed.
        </p>
      </div>
    </main>
  );
}
