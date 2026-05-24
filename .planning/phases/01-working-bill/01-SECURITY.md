---
phase: 1
slug: working-bill
status: verified
threats_open: 0
asvs_level: 1
created: 2026-05-24
---

# Phase 1 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser → Convex | WebSocket/HTTPS; all mutations validated server-side | billId, organizerSecret (hashed via UUID), claimantSession UUID, payment status |
| localStorage → Component | Client-only; organizerSecret and claimantSession read via useEffect (SSR-safe) | organizerSecret UUID, claimantSession UUID |
| Convex → Storage | Internal; QR image stored via Convex file storage | DuitNow QR image binary |
| Public URL | `/c/[billId]` is intentionally shareable; billId is Convex-generated (unguessable) | Bill title, items, totals, QR URL |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-01-01 | Spoofing | confirmPayment mutation | mitigate | `bill.organizerSecret !== organizerSecret` throws "Unauthorized" before any write — `convex/payments.ts:57` | closed |
| T-01-02 | Spoofing | rejectPayment mutation | mitigate | Same organizerSecret check as confirmPayment — `convex/payments.ts:89` | closed |
| T-01-03 | Tampering | markPaid — duplicate payments | mitigate | `by_session` index query before insert; returns existing paymentId if pending/settled — `convex/payments.ts:20-33` | closed |
| T-01-04 | Information Disclosure | getBillForMember returns organizerSecret | mitigate | Explicit destructure excludes organizerSecret; only getBillForOrganizer returns it after secret verification | closed |
| T-01-05 | Elevation of Privilege | getBillForOrganizer without secret | mitigate | Handler returns null if organizerSecret arg does not match stored value — `convex/bills.ts:112` | closed |
| T-01-06 | Denial of Service | Convex free tier (1M calls/month) | accept | Demo scale; free tier sufficient per PROJECT.md constraint | closed |
| T-01-SC | Tampering | npm installs | accept | No new packages installed in Plan 01 | closed |
| T-02-01 | Spoofing | /dashboard/[billId] — organizerSecret from localStorage | mitigate | Query uses ternary skip (null/empty secret = "skip") preventing request until secret loads; Convex verifies server-side — `dashboard/[billId]/page.tsx:56` | closed |
| T-02-02 | Information Disclosure | /c/[billId] page — auto-redirect leaks organizer device identity | accept | Organizer owns the device; redirect to their own dashboard is intentional UX | closed |
| T-02-03 | Tampering | billId URL parameter — user modifies path to access different bill | accept | getBillForMember is public by design (SHARE-04); getBillForOrganizer validates organizerSecret; no sensitive data in public query | closed |
| T-02-04 | Denial of Service | Invalid billId in URL | accept | useQuery returns null for non-existent Convex IDs; UI renders "THIS CHIT HAS BEEN TORN UP" | closed |
| T-02-SC | Tampering | npm installs | accept | No new packages installed in Plan 02 | closed |
| T-03-01 | Tampering | Item price input — float vs int | mitigate | `Math.round(parseFloat(price) * 100)` converts to integer cents before Convex write — `create/page.tsx:117` | closed |
| T-03-02 | Denial of Service | Organizer adds 1000+ items | accept | Demo scale; Convex free tier sufficient; no item-count limit needed for MVP | closed |
| T-03-03 | Spoofing | organizerSecret null on first render causes silent no-op | mitigate | Guard: `if (!organizerSecret) return` in handleGenerate — `create/page.tsx:84` | closed |
| T-03-04 | Tampering | createBill called with empty items array | mitigate | Client-side guard `items.length === 0` prevents handleGenerate from calling mutation; server-side validation added (WR-04) — `create/page.tsx:87` | closed |
| T-03-SC | Tampering | npm installs | accept | No new packages installed in Plan 03 | closed |
| T-04-01 | Tampering | QRUpload — arbitrary file type upload | mitigate | `accept="image/*"` limits file picker; `Content-Type: file.type` header set on upload — `QRUpload.tsx:29,92` | closed |
| T-04-02 | Information Disclosure | Share URL exposes billId | accept | billId is a Convex-generated unguessable ID; URL is intentionally shareable (SHARE-04) | closed |
| T-04-03 | Spoofing | CopyLinkField — clipboard API unavailable (HTTP) | accept | navigator.clipboard requires HTTPS; Vercel deployment is HTTPS; no fallback needed for MVP | closed |
| T-04-04 | Denial of Service | Large QR image upload (>10MB) | accept | Demo scale; Convex storage handles limits server-side | closed |
| T-04-SC | Tampering | npm installs | accept | No new packages installed in Plan 04 | closed |
| T-05-01 | Spoofing | markPaid — member presents fake claimantSession | accept | Session is a crypto.randomUUID() stored in localStorage; guessing another session UUID is computationally infeasible; MVP trust model sufficient | closed |
| T-05-02 | Tampering | markPaid called multiple times (double-tap) | mitigate | `by_session` index query before insert returns existing paymentId if pending/settled — `convex/payments.ts:20-33` | closed |
| T-05-03 | Information Disclosure | bill.qrUrl exposed to member view | accept | DuitNow QR is intentionally shared — it is how members pay; URL is a signed Convex storage URL | closed |
| T-05-04 | Denial of Service | Member submits empty claimantName | mitigate | `isButtonDisabled` check + `handlePay` early return on empty trim — `c/[billId]/page.tsx:92,143` | closed |
| T-05-05 | Spoofing | Organizer opens /c/[billId] and sees member view instead of redirect | mitigate | Bill-specific redirect: `getBillForOrganizer` query in member view; redirects to dashboard only when secret matches this bill — `c/[billId]/page.tsx` (fixed 2026-05-24, see audit trail) | closed |
| T-05-SC | Tampering | npm installs | accept | No new packages installed in Plan 05 | closed |
| T-06-01 | Spoofing | confirmPayment/rejectPayment called without valid secret | mitigate | Both mutations verify `bill.organizerSecret !== arg.organizerSecret` and throw "Unauthorized" — `convex/payments.ts:57,89` | closed |
| T-06-02 | Elevation of Privilege | /dashboard/[billId] page visible without correct secret | mitigate | `getBillForOrganizer` returns null on invalid secret; page renders "DASHBOARD NOT ACCESSIBLE" with no data — `dashboard/[billId]/page.tsx:82` | closed |
| T-06-03 | Tampering | confirmPayment called on already-settled payment | accept | Convex DB patch is idempotent for same status; confirmedAt overwrites with newer timestamp — acceptable at demo scale | closed |
| T-06-04 | Denial of Service | Dashboard polls getPaymentsForBill continuously | accept | Convex useQuery is WebSocket subscription, not polling — free tier handles demo scale | closed |
| T-06-05 | Information Disclosure | BillSummaryCard shows all items to organizer | accept | Organizer created the bill — seeing their own data is expected | closed |
| T-06-SC | Tampering | npm installs | accept | No new packages installed in Plan 06 | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-01-06 | Convex free tier (1M calls/month) sufficient for demo scale per PROJECT.md constraint | organizer | 2026-05-24 |
| AR-02 | T-03-02 | No item-count limit; demo scale, Convex free tier sufficient | organizer | 2026-05-24 |
| AR-03 | T-05-01 | Member session is crypto.randomUUID(); guessing is computationally infeasible at MVP scale | organizer | 2026-05-24 |
| AR-04 | T-06-03 | confirmPayment idempotency on already-settled payments acceptable at demo scale | organizer | 2026-05-24 |
| AR-05 | T-04-03 | Clipboard API requires HTTPS; Vercel deployment enforces HTTPS; no local HTTP risk for MVP | organizer | 2026-05-24 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-05-24 | 34 | 34 | 0 | gsd-security-auditor (automated) |

**Notes:**
- T-05-05: Original mitigation (any-bill organizer redirect, WR-05) was removed because it incorrectly redirected any device that had ever created a bill. Fix implemented 2026-05-24: `getBillForOrganizer` query added to member view, redirects only when secret matches this specific bill.
- All "accept" dispositions reviewed; no accept risk exceeds LOW severity at MVP/demo scope.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-05-24
