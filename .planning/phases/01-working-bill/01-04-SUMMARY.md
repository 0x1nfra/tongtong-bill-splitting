---
phase: "01"
plan: "04"
subsystem: "share-flow"
tags: ["qr-upload", "share-screen", "file-storage", "clipboard"]
dependency_graph:
  requires: ["01-03"]
  provides: ["BillSummaryCard", "CopyLinkField", "QRUpload", "share-screen"]
  affects: ["/create", "/share/[billId]"]
tech_stack:
  added: []
  patterns:
    - "Convex 3-step file storage upload (generateUploadUrl -> POST -> storageId)"
    - "window.location.origin inside useEffect (SSR-safe browser API)"
    - "navigator.clipboard.writeText with setTimeout 2s feedback"
key_files:
  created:
    - "src/components/QRUpload.tsx"
    - "src/components/BillSummaryCard.tsx"
    - "src/components/CopyLinkField.tsx"
  modified:
    - "src/app/create/page.tsx"
    - "src/app/share/[billId]/page.tsx"
decisions:
  - "QRUpload uses local blob URL (URL.createObjectURL) for inline preview - avoids Convex storage round-trip for preview"
  - "shareUrl initialized as empty string and set in useEffect - avoids SSR window access"
  - "CopyLinkField input height matches button height via h-10 so the row aligns without flex hacks"
metrics:
  duration: "3m"
  completed: "2026-05-23"
  tasks_completed: 2
  files_created: 3
  files_modified: 2
---

# Phase 01 Plan 04: QR Upload and Share Screen Summary

**One-liner:** Convex 3-step QR upload wired into /create, full share screen with BillSummaryCard + CopyLinkField + WhatsApp link using the /c/[billId] URL.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create QRUpload component and wire into /create page | 40e8418 | src/components/QRUpload.tsx, src/app/create/page.tsx |
| 2 | Create BillSummaryCard, CopyLinkField, complete /share/[billId] page | 268d9c7 | src/components/BillSummaryCard.tsx, src/components/CopyLinkField.tsx, src/app/share/[billId]/page.tsx |

## What Was Built

### QRUpload component (`src/components/QRUpload.tsx`)
Implements the Convex 3-step file storage upload pattern:
1. `generateUploadUrl({})` gets a short-lived upload URL from Convex
2. `fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file })` - Content-Type header required per RESEARCH.md Pitfall 5 so Convex stores correct file metadata
3. `storageId` from JSON response passed to `onUpload` callback

States: default (dashed 160x160px drop zone), uploading ("UPLOADING..."), preview (img tag + CHANGE button). Try/catch wraps the entire upload flow with inline "UPLOAD FAILED" error message on failure.

### /create page update (`src/app/create/page.tsx`)
- Added `qrStorageId` state (`useState<string | undefined>(undefined)`)
- Imported and placed `QRUpload` between items section and tax toggles with label "DUITNOW QR (OPTIONAL)"
- QRUpload's `onUpload` callback stores the returned `storageId` in state
- `qrStorageId` now passed to `createBill` mutation (previously the comment noted "Plan 04 adds QR upload")

### BillSummaryCard component (`src/components/BillSummaryCard.tsx`)
Chit-surface card (`bg-[--color-paper-chit]`) showing:
- Display code (`#TT-XXXX`) in `text-xs opacity-60`
- Bill title in `text-base font-bold uppercase`
- Item count: "X ITEMS" (with correct singular/plural)
- Grand total: "TOTAL RM X.XX" - calculated using same service charge (10%) before SST (6%) order as RunningTotal

### CopyLinkField component (`src/components/CopyLinkField.tsx`)
- Monospace read-only input (`font-mono`) showing the share URL in `text-[--color-pen]`
- "COPY LINK" / "COPIED!" button (`bg-[--color-pen]`) that calls `navigator.clipboard.writeText(url)`
- `setTimeout(2000)` reverts button back to "COPY LINK" after 2 seconds (SHARE-03)

### Share page (`src/app/share/[billId]/page.tsx`)
Full share screen replacing the Plan 02 shell:
- `useEffect` sets `shareUrl = ${window.location.origin}/c/${billId}` (browser-only, not at render time)
- BillSummaryCard with bill data from `getBillForMember` Convex query
- CopyLinkField with `shareUrl` (copies the `/c/[billId]` URL, not `/share/`)
- WhatsApp link: `https://wa.me/?text=${encodeURIComponent(shareUrl)}` target="_blank" rel="noopener noreferrer" (SHARE-04)
- "VIEW MY DASHBOARD" button navigates to `/dashboard/${billId}` (D-09)

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. All components receive live data from Convex queries. The QR upload flow is end-to-end wired. The share URL is constructed from the real `billId` and `window.location.origin`.

## Threat Surface Scan

No new threat surface introduced beyond what was planned in the threat model:
- T-04-01 mitigation (input `accept="image/*"`) is implemented in QRUpload
- T-04-03 risk (clipboard on HTTP) is accepted as documented; Vercel deployment is HTTPS

## Self-Check: PASSED

Files exist:
- src/components/QRUpload.tsx: FOUND
- src/components/BillSummaryCard.tsx: FOUND
- src/components/CopyLinkField.tsx: FOUND
- src/app/create/page.tsx: FOUND (modified)
- src/app/share/[billId]/page.tsx: FOUND (replaced)

Commits exist:
- 40e8418: FOUND (feat(01-04): add QRUpload component and wire into /create page)
- 268d9c7: FOUND (feat(01-04): add BillSummaryCard, CopyLinkField, complete /share/[billId] page)

TypeScript: zero errors across all five files.
