const DEMO_ITEMS = [
  { name: "Mee Goreng Mamak", price: 800, quantity: 1 },
  { name: "Teh Tarik", price: 300, quantity: 1 },
  { name: "Roti Canai", price: 250, quantity: 1 },
  { name: "Nasi Lemak Biasa", price: 500, quantity: 2 },
] as const;

const grandTotal = DEMO_ITEMS.reduce(
  (acc, item) => acc + item.price * item.quantity,
  0
);

export function DemoChit() {
  return (
    <div
      className="chit p-4 max-w-[320px] mx-auto"
      style={{ transform: "rotate(1.5deg)" }}
    >
      <p className="text-xs font-bold uppercase tracking-widest text-ink opacity-60 mb-3">
        #TT-DEMO
      </p>

      {DEMO_ITEMS.map((item) => (
        <div key={item.name} className="dot-leader py-1">
          <span className="text-sm text-ink">
            {item.name}
            {item.quantity > 1 && (
              <span className="opacity-60 ml-1 text-xs">x{item.quantity}</span>
            )}
          </span>
          <span className="text-sm text-ink">
            RM{((item.price * item.quantity) / 100).toFixed(2)}
          </span>
        </div>
      ))}

      <div className="perforation my-3" />

      <div className="flex justify-between font-bold text-base text-ink">
        <span className="uppercase tracking-widest">GRAND TOTAL</span>
        <span>RM{(grandTotal / 100).toFixed(2)}</span>
      </div>

      <div className="text-center mt-4">
        <div
          className="inline-block border-2 border-stamp rounded px-4 py-2"
          style={{ transform: "rotate(-6deg)", filter: "url(#ink-bleed)" }}
        >
          <span
            className="text-3xl font-bold text-stamp uppercase tracking-widest"
            style={{ fontFamily: "var(--font-stamp)" }}
          >
            SETTLE
          </span>
        </div>
      </div>
    </div>
  );
}
