# TongTong

Bill-splitting app for group dining. Organizers create a bill, share a WhatsApp link, and track payments as friends claim items and confirm via DuitNow QR.

## Features

- Create bills with items, SST/service charge toggles, and DuitNow QR upload
- Shareable member link — friends claim items they ordered
- Proportional split: tax/SC divided by subtotal share, not equal split
- Live realtime updates via Convex WebSocket
- Chit/receipt visual identity — warm paper, handwritten names, SETTLE stamp

## Stack

- Next.js 16 (App Router) + React 19
- Convex (backend, realtime DB, file storage)
- Tailwind CSS v4
- TypeScript strict mode

## Dev Setup

1. Install deps: `pnpm install`
2. Set `NEXT_PUBLIC_CONVEX_URL` in `.env.local`
3. Run in two terminals:
   - `pnpm dev` — Next.js frontend
   - `pnpm dev:convex` — Convex backend

Open [http://localhost:3000](http://localhost:3000)

## Version

v1.0.0 — all 3 roadmap phases complete (Working Bill, Item Claiming, TongTong Aesthetic)
