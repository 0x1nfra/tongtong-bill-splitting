---
phase: 01-working-bill
plan: "03"
subsystem: ui-bill-builder
tags: [react, next.js, convex, form, client-components, bill-builder]
dependency_graph:
  requires:
    - phase: 01-01
      provides: convex/bills.ts createBill mutation with venueName + billDate args
    - phase: 01-02
      provides: src/app/create/page.tsx shell with useOrganizerSecret hook
  provides:
    - src/components/ItemRow.tsx with ItemDraft type re-export
    - src/components/RunningTotal.tsx with live calculateTotals
    - src/app/create/page.tsx full bill builder form
  affects:
    - 01-04 (QR upload — extends create/page.tsx to wire qrStorageId)
tech_stack:
  added: []
  patterns:
    - React useCallback for stable item handler references
    - ItemDraft local state array with crypto.randomUUID() keys
    - Math.round(parseFloat(price) * 100) for integer-cent conversion before Convex write
    - Service charge (10%) applied before SST (6%) — Malaysian restaurant convention
    - Disabled primary CTA via disabled attribute + opacity-50 + pointer-events-none
key_files:
  created:
    - src/components/ItemRow.tsx
    - src/components/RunningTotal.tsx
  modified:
    - src/app/create/page.tsx
decisions:
  - "ItemDraft type exported from ItemRow.tsx (re-export) so RunningTotal and create page share the same type definition"
  - "useCallback on addItem/updateItem/deleteItem prevents ItemRow re-renders when parent re-renders on unrelated state changes"
  - "isGenerateDisabled combines items.length === 0 and isSubmitting for both the disabled attribute and styling classes"
  - "venueName and billDate passed as undefined (not empty string) to createBill when user leaves fields blank — undefined fields omitted from Convex write"
metrics:
  duration: "155s"
  completed_date: "2026-05-23"
  tasks_completed: 2
  files_created: 2
  files_modified: 1
---

# Phase 01 Plan 03: Bill Builder Form Summary

**One-liner:** Full /create bill builder with ItemRow (name/price/qty/delete) and RunningTotal (live subtotal/SST/SC/total), createBill mutation wired to GENERATE LINK button, redirects to /share/[billId] on success.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create ItemRow and RunningTotal components | a82fbdd | src/components/ItemRow.tsx, src/components/RunningTotal.tsx |
| 2 | Complete /create page — bill details, items state, toggles, createBill mutation, redirect | a0f18ea | src/app/create/page.tsx |

## What Was Built

### src/components/ItemRow.tsx
- Named export `ItemDraft` type (id, name, price as RM string, quantity)
- Named export `ItemRow` function component with `Readonly<ItemRowProps>`
- name input (flex-1), price input (w-20, inputMode="decimal"), qty input (w-12, type="number")
- × delete button with 44×44px minimum touch target in `--color-ink` (NOT red — red reserved for stamp/❋)
- All inputs use `border-[--color-ink]`, `bg-[--color-paper-chit]`, `text-[--color-ink]` tokens

### src/components/RunningTotal.tsx
- Named export `RunningTotal` function component
- `calculateTotals` helper: `Math.round(parseFloat(price || "0") * 100) * quantity` for integer-cent subtotal
- Service charge (10%) applied to subtotal first, then SST (6%) on post-SC total — Malaysian convention
- Conditional rows: SERVICE CHARGE only shown when `applyServiceCharge=true`, SST only when `applySST=true`
- All amounts displayed as `RM` + `(cents / 100).toFixed(2)` — never raw integers
- TOTAL row uses `font-bold text-lg` per layout contract

### src/app/create/page.tsx
- Replaced stub shell with full bill builder
- Bill details: BILL TITLE (required), RESTAURANT / VENUE (optional), DATE type="date" (optional)
- Items section: ItemRow list + ADD ITEM button (neutral `border-[--color-ink]` — not blue)
- Tax toggles: SERVICE CHARGE (10%) and SST (6%) HTML checkboxes
- RunningTotal component wired with items + toggle state for live calculation
- GENERATE LINK button: `bg-[--color-pen]` primary CTA, `disabled` attribute + `opacity-50 cursor-not-allowed pointer-events-none` when `items.length === 0 || isSubmitting`
- handleGenerate: null-guards organizerSecret (T-03-03), guards empty items (T-03-04/BILL-06), converts prices to cents (T-03-01), passes `venueName || undefined` and `billDate || undefined`, redirects to `/share/${billId}` (D-02)

## Threat Mitigations Applied

| Threat ID | Mitigation Implemented |
|-----------|----------------------|
| T-03-01 | `Math.round(parseFloat(item.price || "0") * 100)` converts RM string to integer cents before Convex write |
| T-03-03 | `if (!organizerSecret) return` guard at top of handleGenerate |
| T-03-04 | `if (items.length === 0) return` guard in handleGenerate; button also has `disabled` attribute |
| T-03-02 | Accepted (demo scale) |
| T-03-SC | No new packages installed |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all functionality is fully wired. qrStorageId is explicitly deferred to Plan 04 (the plan documents this with a code comment).

## Threat Flags

None — no new security surface beyond what the plan's threat model covers. No network calls, no file access, no new auth paths in the UI components.

## Self-Check

**Files exist:**
- src/components/ItemRow.tsx — FOUND (created)
- src/components/RunningTotal.tsx — FOUND (created)
- src/app/create/page.tsx — FOUND (modified)

**Commits exist:**
- a82fbdd — Task 1 commit (ItemRow + RunningTotal)
- a0f18ea — Task 2 commit (complete /create page)

## Self-Check: PASSED
