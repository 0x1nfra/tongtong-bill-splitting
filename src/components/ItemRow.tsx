"use client";

export type ItemDraft = {
  id: string;
  name: string;
  price: string; // raw RM string input: "12.50" — converted to cents on submit
  quantity: number;
};

type ItemRowProps = Readonly<{
  item: ItemDraft;
  onUpdate: (id: string, field: keyof ItemDraft, value: string | number) => void;
  onDelete: (id: string) => void;
}>;

export function ItemRow({ item, onUpdate, onDelete }: ItemRowProps) {
  return (
    <div className="flex items-center gap-2 min-h-[48px] py-1">
      {/* Item name */}
      <input
        type="text"
        placeholder="Item name"
        value={item.name}
        onChange={(e) => onUpdate(item.id, "name", e.target.value)}
        className="flex-1 border border-[--color-ink] rounded px-2 py-1 bg-[--color-paper-chit] text-[--color-ink] text-sm"
      />

      {/* Price with RM prefix */}
      <div className="flex items-center gap-1">
        <span className="text-[--color-ink] text-xs font-medium">RM</span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={item.price}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9.]/g, "");
            onUpdate(item.id, "price", raw);
          }}
          className="w-20 border border-[--color-ink] rounded px-2 py-1 bg-[--color-paper-chit] text-[--color-ink] text-sm"
        />
      </div>

      {/* Quantity */}
      <input
        type="number"
        min="1"
        value={item.quantity}
        onChange={(e) =>
          onUpdate(item.id, "quantity", parseInt(e.target.value) || 1)
        }
        className="w-12 border border-[--color-ink] rounded px-2 py-1 bg-[--color-paper-chit] text-[--color-ink] text-sm text-center"
      />

      {/* Delete button — min 44×44px touch target, NOT red (red reserved for stamp/❋ only) */}
      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="flex items-center justify-center min-w-[44px] min-h-[44px] text-[--color-ink] text-lg font-bold hover:opacity-60 transition-opacity"
        aria-label="Delete item"
      >
        ×
      </button>
    </div>
  );
}
