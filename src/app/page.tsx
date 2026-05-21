export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#EEEAE2]">
      <div
        className="chit p-8 rounded-sm max-w-xs w-full text-center"
        style={{ transform: "rotate(-1deg)" }}
      >
        <p
          className="text-2xl tracking-widest text-[#1F1B17]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          TONGTONG
        </p>
        <p
          className="text-xs mt-2 text-[#1F1B17] opacity-60"
          style={{ fontFamily: "var(--font-body)" }}
        >
          BILL SPLITTER — KONGSI TAK SUSAH
        </p>
        <div className="perforation my-4" />
        <p
          className="text-xs text-[#1F1B17] opacity-40"
          style={{ fontFamily: "var(--font-body)" }}
        >
          dev environment ready
        </p>
      </div>
    </main>
  );
}
