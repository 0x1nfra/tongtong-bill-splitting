const DEMO_ITEMS = [
  { name: "Mee Goreng Mamak", price: 800, quantity: 1, claims: ["Azhar"] },
  { name: "Teh Tarik", price: 300, quantity: 1, claims: ["Azhar", "Siti"] },
  { name: "Roti Canai", price: 250, quantity: 1, claims: [] },
  { name: "Nasi Lemak Biasa", price: 500, quantity: 2, claims: ["Faiz"] },
] as const;

const subtotal = DEMO_ITEMS.reduce(
  (acc, item) => acc + item.price * item.quantity,
  0,
);
const serviceCharge = Math.round(subtotal * 0.1);
const sst = Math.round((subtotal + serviceCharge) * 0.06);
const grandTotal = subtotal + serviceCharge + sst;

export function DemoChit() {
  return (
    <div className="chit p-6 w-full max-w-[320px] mx-auto">
      {/* BILL IDENTITY */}
      <p
        className="text-sm font-bold uppercase text-ink tracking-wide"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Dinner @ Pelita
      </p>
      <p className="text-xs text-ink-muted uppercase tracking-widest mt-0.5">
        PELITA NASI KANDAR
      </p>
      <p
        className="text-[0.625rem] text-ink-muted mt-0.5"
        style={{ fontFamily: "var(--font-display)" }}
      >
        #TT-DEMO
      </p>

      <div className="perforation my-4" />

      {/* ITEMS ZONE */}
      <p
        className="text-xs font-bold uppercase text-ink-muted tracking-widest mb-3"
        style={{ fontFamily: "var(--font-display)" }}
      >
        ITEMS
      </p>

      {DEMO_ITEMS.map((item, index) => {
        const claimed = item.claims.length > 0;
        const splitPrice = claimed
          ? Math.round((item.price * item.quantity) / item.claims.length)
          : item.price * item.quantity;

        return (
          <div key={item.name}>
            <div className="dot-leader flex items-center min-h-[40px] py-1">
              <span className="flex items-center gap-1 text-sm text-ink">
                {!claimed && <span className="text-warning mr-0.5">❋</span>}
                {item.name}
                {item.quantity > 1 && (
                  <span className="text-ink-muted ml-1 text-xs">
                    x{item.quantity}
                  </span>
                )}
              </span>
              <span className="text-sm text-ink">
                RM{(splitPrice / 100).toFixed(2)}
              </span>
            </div>

            {claimed ? (
              <div className="flex flex-wrap gap-1 pb-1">
                {item.claims.map((name) => (
                  <span
                    key={name}
                    className="text-pen text-sm"
                    style={{ fontFamily: "var(--font-handwriting)" }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-warning uppercase tracking-widest pb-1">
                CLAIM
              </p>
            )}

            {index < DEMO_ITEMS.length - 1 && (
              <hr className="rule-hairline" />
            )}
          </div>
        );
      })}

      <div className="perforation my-4" />

      {/* BILL TOTAL ZONE */}
      <p
        className="text-xs font-bold uppercase text-ink-muted tracking-widest mb-3"
        style={{ fontFamily: "var(--font-display)" }}
      >
        BILL TOTAL
      </p>

      <div className="dot-leader flex justify-between text-sm text-ink mb-1">
        <span className="text-ink-muted">Subtotal</span>
        <span>RM{(subtotal / 100).toFixed(2)}</span>
      </div>
      <div className="dot-leader flex justify-between text-sm text-ink mb-1">
        <span className="text-ink-muted">Service Charge (10%)</span>
        <span>RM{(serviceCharge / 100).toFixed(2)}</span>
      </div>
      <div className="dot-leader flex justify-between text-sm text-ink mb-1">
        <span className="text-ink-muted">SST (6%)</span>
        <span>RM{(sst / 100).toFixed(2)}</span>
      </div>
      <div className="dot-leader flex justify-between font-bold text-base text-ink border-t border-ink mt-2 pt-2">
        <span className="uppercase tracking-widest">GRAND TOTAL</span>
        <span>RM{(grandTotal / 100).toFixed(2)}</span>
      </div>

      <div className="perforation my-4" />

      {/* SETTLE STAMP */}
      <div className="text-center">
        <div
          className="inline-block border-2 border-stamp px-4 py-2"
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
