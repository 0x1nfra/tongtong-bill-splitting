import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * createBill — atomically inserts bill + all items in one transaction.
 * Per D-08: items are held in React local state during building; this mutation
 * writes everything atomically when "GENERATE LINK" is tapped.
 */
export const createBill = mutation({
  args: {
    organizerSecret: v.string(),
    title: v.string(),
    applySST: v.boolean(),
    applyServiceCharge: v.boolean(),
    qrStorageId: v.optional(v.id("_storage")),
    venueName: v.optional(v.string()),
    billDate: v.optional(v.string()), // ISO date string "YYYY-MM-DD"
    receiptStorageId: v.optional(v.id("_storage")),
    roundingAdjustmentCents: v.optional(v.number()),
    bankName: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    accountHolderName: v.optional(v.string()),
    duitNowId: v.optional(v.string()),
    items: v.array(
      v.object({
        name: v.string(),
        price: v.number(), // integer RM cents
        quantity: v.number(),
        orderIndex: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // WR-04: server-side item validation — catches any bypass of client-side checks
    for (const item of args.items) {
      if (!item.name.trim()) throw new Error("Item name cannot be empty");
      if (!Number.isInteger(item.price) || item.price < 0) {
        throw new Error("Item price must be a non-negative integer (RM cents)");
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new Error("Item quantity must be a positive integer");
      }
    }

    // T-07-05-01: XSS sanitization for banking info fields (mirrors updateBankingInfo T-04-04 pattern)
    const sanitizedBankName = args.bankName !== undefined ? args.bankName.replace(/[<>"]/g, "").trim() : undefined;
    const sanitizedAccountNumber = args.accountNumber !== undefined ? args.accountNumber.replace(/[<>"]/g, "").trim() : undefined;
    const sanitizedAccountHolderName = args.accountHolderName !== undefined ? args.accountHolderName.replace(/[<>"]/g, "").trim() : undefined;
    const sanitizedDuitNowId = args.duitNowId !== undefined ? args.duitNowId.replace(/[<>"]/g, "").trim() : undefined;

    const billId = await ctx.db.insert("bills", {
      organizerSecret: args.organizerSecret,
      title: args.title,
      applySST: args.applySST,
      applyServiceCharge: args.applyServiceCharge,
      qrStorageId: args.qrStorageId,
      venueName: args.venueName,
      billDate: args.billDate,
      receiptStorageId: args.receiptStorageId,
      roundingAdjustmentCents: args.roundingAdjustmentCents,
      bankName: sanitizedBankName,
      accountNumber: sanitizedAccountNumber,
      accountHolderName: sanitizedAccountHolderName,
      duitNowId: sanitizedDuitNowId,
    });
    for (const item of args.items) {
      await ctx.db.insert("items", { billId, ...item });
    }
    return billId;
  },
});

/**
 * generateUploadUrl — first step in the 3-step Convex file storage upload flow.
 * Client calls this to get a short-lived upload URL, then POSTs the file directly
 * to Convex storage, then passes the storageId to createBill.
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * getBillForMember — public query, no auth required (SHARE-04).
 * Intentionally excludes organizerSecret from the result (T-01-04 threat mitigation).
 * Also returns claims[] so the member view has one subscription for items + claims (CLAIM-06).
 * Claims data is intentionally public — members viewing a bill can see all claimant names
 * (T-02-05 accepted: this is the product feature; organizerSecret still excluded).
 */
export const getBillForMember = query({
  args: { billId: v.id("bills") },
  handler: async (ctx, { billId }) => {
    const bill = await ctx.db.get(billId);
    if (!bill) return null;

    const items = await ctx.db
      .query("items")
      .withIndex("by_bill", (q) => q.eq("billId", billId))
      .collect();

    const claims = await ctx.db
      .query("claims")
      .withIndex("by_bill", (q) => q.eq("billId", billId))
      .collect();

    const qrUrl = bill.qrStorageId
      ? await ctx.storage.getUrl(bill.qrStorageId)
      : null;

    const receiptUrl = bill.receiptStorageId
      ? await ctx.storage.getUrl(bill.receiptStorageId)
      : null;

    // Explicitly exclude organizerSecret — members must not see it (T-01-04)
    const {
      organizerSecret: _excluded,
      ...billWithoutSecret
    } = bill;

    return { ...billWithoutSecret, items, claims, qrUrl, receiptUrl };
  },
});

/**
 * getBillForOrganizer — organizer-only query, verifies secret server-side (AUTH-03, T-01-05).
 * Returns full bill data including organizerSecret, all items, and all payments.
 */
export const getBillForOrganizer = query({
  args: {
    billId: v.id("bills"),
    organizerSecret: v.string(),
  },
  handler: async (ctx, { billId, organizerSecret }) => {
    const bill = await ctx.db.get(billId);
    if (!bill) return null;

    // Server-side secret verification (T-01-05)
    // WR-06: return null instead of throwing — useQuery stays stuck on undefined when queries throw
    if (bill.organizerSecret !== organizerSecret) {
      return null;
    }

    const items = await ctx.db
      .query("items")
      .withIndex("by_bill", (q) => q.eq("billId", billId))
      .collect();

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_bill", (q) => q.eq("billId", billId))
      .collect();

    const qrUrl = bill.qrStorageId
      ? await ctx.storage.getUrl(bill.qrStorageId)
      : null;

    const receiptUrl = bill.receiptStorageId
      ? await ctx.storage.getUrl(bill.receiptStorageId)
      : null;

    return { bill, items, payments, qrUrl, receiptUrl };
  },
});

/**
 * claimItem — creates a claim record for a member's item selection (CLAIM-01, CLAIM-02).
 * Idempotent: if the same session+item combination already exists, returns the existing _id
 * without creating a duplicate (T-02-03 threat mitigation — prevents INSERT storms).
 * Validates billId and itemId belong together to prevent cross-bill tampering (T-02-01).
 */
export const claimItem = mutation({
  args: {
    billId: v.id("bills"),
    itemId: v.id("items"),
    claimantName: v.string(),
    claimantSession: v.string(),
    claimQty: v.optional(v.number()),
  },
  handler: async (ctx, { billId, itemId, claimantName, claimantSession, claimQty }) => {
    const effectiveQty = claimQty ?? 1;

    if (!Number.isInteger(effectiveQty) || effectiveQty < 1) {
      throw new Error("claimQty must be a positive integer");
    }

    if (!claimantName.trim()) throw new Error("Claimant name cannot be empty");

    // Verify bill exists
    const bill = await ctx.db.get(billId);
    if (!bill) throw new Error("Bill not found");
    if (bill.archivedAt !== undefined) throw new Error("Bill is archived");

    // Verify item exists and belongs to this bill
    const item = await ctx.db.get(itemId);
    if (!item || item.billId !== billId) throw new Error("Item not found on this bill");

    // NOTE: capacity check and insert are not atomic. Under very high concurrency
    // (multiple simultaneous mutations on the same item) total claimed units could
    // briefly exceed item.quantity. Acceptable for MVP; revisit if contention observed.
    // For multi-qty items: validate total claimed units won't exceed item.quantity
    if (item.quantity > 1) {
      const allClaims = await ctx.db
        .query("claims")
        .withIndex("by_item", (q) => q.eq("itemId", itemId))
        .collect();
      // Exclude this session's own existing claim from the capacity check
      const othersClaimed = allClaims
        .filter((c) => c.claimantSession !== claimantSession)
        .reduce((sum, c) => sum + (c.claimQty ?? 1), 0);
      if (othersClaimed + effectiveQty > item.quantity) {
        throw new Error(
          `Only ${item.quantity - othersClaimed} unit(s) remaining for this item`
        );
      }
    }

    // Idempotency / upsert: if session already claimed this item, update claimQty (T-02-03)
    const existing = await ctx.db
      .query("claims")
      .withIndex("by_session", (q) =>
        q.eq("billId", billId).eq("claimantSession", claimantSession)
      )
      .filter((q) => q.eq(q.field("itemId"), itemId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { claimQty: effectiveQty });
      return existing._id;
    }

    return await ctx.db.insert("claims", {
      billId,
      itemId,
      claimantName,
      claimantSession,
      claimQty: effectiveQty,
      createdAt: Date.now(),
    });
  },
});

/**
 * unclaimItem — deletes a claim record, session-gated (CLAIM-01, T-02-02).
 * Only the originating session can unclaim — prevents other members from
 * removing someone else's claim (T-02-02 threat mitigation).
 */
export const unclaimItem = mutation({
  args: {
    claimId: v.id("claims"),
    claimantSession: v.string(),
  },
  handler: async (ctx, { claimId, claimantSession }) => {
    const claim = await ctx.db.get(claimId);
    if (!claim) throw new Error("Claim not found");
    const bill = await ctx.db.get(claim.billId);
    if (bill?.archivedAt !== undefined) throw new Error("Bill is archived");

    // Session ownership gate (T-02-02)
    if (claim.claimantSession !== claimantSession) {
      throw new Error("Unauthorized: can only unclaim your own items");
    }

    await ctx.db.delete(claimId);
  },
});

/**
 * getClaimsForBill — organizer-authenticated query returning CLAIMED and UNCLAIMED counts (DASH-02).
 * - CLAIMED: unique claimantSessions with ≥1 claim that have NOT submitted a pending/settled payment
 * - UNCLAIMED: items with zero associated claim records
 * WR-06: returns null on auth failure (not a throw) — keeps useQuery from getting stuck on undefined.
 * T-02-04: organizerSecret verified server-side before any claims data is returned.
 */
export const getClaimsForBill = query({
  args: {
    billId: v.id("bills"),
    organizerSecret: v.string(),
  },
  handler: async (ctx, { billId, organizerSecret }) => {
    const bill = await ctx.db.get(billId);
    // WR-06 + T-02-04: return null on missing bill or secret mismatch — never throw
    if (!bill || bill.organizerSecret !== organizerSecret) {
      return null;
    }

    const claims = await ctx.db
      .query("claims")
      .withIndex("by_bill", (q) => q.eq("billId", billId))
      .collect();

    const items = await ctx.db
      .query("items")
      .withIndex("by_bill", (q) => q.eq("billId", billId))
      .collect();

    // CLAIMED: unique sessions with ≥1 claim, regardless of payment status (D-09 / WR-02 fix)
    const claimingSessions = new Set(claims.map((c) => c.claimantSession));
    const claimedCount = claimingSessions.size;

    // UNCLAIMED: items with zero claim records
    const claimedItemIds = new Set(claims.map((c) => c.itemId));
    const unclaimedCount = items.filter((i) => !claimedItemIds.has(i._id)).length;

    return { claimedCount, unclaimedCount };
  },
});

/**
 * getClaimantsForBill — organizer-authenticated query returning all claimants grouped by session (DASH-03).
 * Populates the dashboard PEOPLE tab from claims data — shows all members who claimed at least one item,
 * not just those who submitted payment.
 * - Groups claims by claimantSession; resolves item details from items table
 * - Per session, prefers payment priority: settled > pending > rejected (keeps highest-priority payment)
 * - Sorted by firstClaimAt ascending (earliest claimant first)
 * WR-06: returns null on auth failure (not a throw).
 * T-02-04: organizerSecret verified server-side before any claims data is returned.
 */
export const getClaimantsForBill = query({
  args: {
    billId: v.id("bills"),
    organizerSecret: v.string(),
  },
  handler: async (ctx, { billId, organizerSecret }) => {
    const bill = await ctx.db.get(billId);
    // WR-06 + T-02-04: return null on missing bill or secret mismatch — never throw
    if (!bill || bill.organizerSecret !== organizerSecret) {
      return null;
    }

    const claims = await ctx.db
      .query("claims")
      .withIndex("by_bill", (q) => q.eq("billId", billId))
      .collect();

    if (claims.length === 0) return [];

    const items = await ctx.db
      .query("items")
      .withIndex("by_bill", (q) => q.eq("billId", billId))
      .collect();

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_bill", (q) => q.eq("billId", billId))
      .collect();

    // Build item lookup by _id for fast resolution
    const itemById = new Map(items.map((i) => [i._id, i]));

    // Priority ordering for payment status: settled wins over pending wins over rejected
    const paymentPriority = { settled: 3, pending: 2, rejected: 1 } as const;

    // Per session: keep only the highest-priority payment
    const bestPaymentBySession = new Map<
      string,
      { _id: string; status: "pending" | "settled" | "rejected" }
    >();
    for (const p of payments) {
      const existing = bestPaymentBySession.get(p.claimantSession);
      const currentPriority = paymentPriority[p.status];
      const existingPriority = existing ? paymentPriority[existing.status] : 0;
      if (currentPriority > existingPriority) {
        bestPaymentBySession.set(p.claimantSession, {
          _id: p._id,
          status: p.status,
        });
      }
    }

    // Group claims by session, track earliest createdAt per session
    type SessionData = {
      claimantSession: string;
      claimantName: string;
      firstClaimAt: number;
      claimRecords: Array<{ itemId: Id<"items">; claimQty: number }>;
    };
    const sessionMap = new Map<string, SessionData>();
    for (const claim of claims) {
      const existing = sessionMap.get(claim.claimantSession);
      if (existing) {
        existing.claimRecords.push({ itemId: claim.itemId, claimQty: claim.claimQty ?? 1 });
        if (claim.createdAt < existing.firstClaimAt) {
          existing.firstClaimAt = claim.createdAt;
        }
      } else {
        sessionMap.set(claim.claimantSession, {
          claimantSession: claim.claimantSession,
          claimantName: claim.claimantName,
          firstClaimAt: claim.createdAt,
          claimRecords: [{ itemId: claim.itemId, claimQty: claim.claimQty ?? 1 }],
        });
      }
    }

    // Build result array, resolve item details, sort by firstClaimAt ascending
    const result = [...sessionMap.values()]
      .sort((a, b) => a.firstClaimAt - b.firstClaimAt)
      .map(({ claimantSession, claimantName, claimRecords }) => {
        const claimedItems = claimRecords
          .map(({ itemId, claimQty }) => {
            const item = itemById.get(itemId);
            if (!item) return null;
            return {
              _id: item._id as string,
              name: item.name,
              price: item.price,
              claimedQty: claimQty,
            };
          })
          .filter((i): i is NonNullable<typeof i> => i !== null);

        return {
          claimantSession,
          claimantName,
          claimedItems,
          payment: bestPaymentBySession.get(claimantSession) ?? null,
        };
      });

    return result;
  },
});

export const setBillReceipt = mutation({
  args: {
    billId: v.id("bills"),
    organizerSecret: v.string(),
    receiptStorageId: v.id("_storage"),
  },
  handler: async (ctx, { billId, organizerSecret, receiptStorageId }) => {
    const bill = await ctx.db.get(billId);
    if (!bill || bill.organizerSecret !== organizerSecret) {
      throw new Error("Unauthorized");
    }
    if (bill.archivedAt !== undefined) throw new Error("Bill is archived");
    await ctx.db.patch(billId, { receiptStorageId });
  },
});

/**
 * updateQR — allows organizer to upload or replace the DuitNow QR after bill creation.
 * Mirrors setBillReceipt pattern: auth guard + archive freeze check + patch. D-14, D-15.
 */
export const updateQR = mutation({
  args: {
    billId: v.id("bills"),
    organizerSecret: v.string(),
    qrStorageId: v.id("_storage"),
  },
  handler: async (ctx, { billId, organizerSecret, qrStorageId }) => {
    const bill = await ctx.db.get(billId);
    if (!bill || bill.organizerSecret !== organizerSecret) {
      throw new Error("Unauthorized");
    }
    if (bill.archivedAt !== undefined) throw new Error("Bill is archived");
    await ctx.db.patch(billId, { qrStorageId });
  },
});

/**
 * updateRoundingAdjustment — allows organizer to set or update the rounding adjustment cents.
 * Mirrors updateQR pattern: auth guard + archive freeze check + integer validation + patch.
 * ADJ-02, D-03: integer RM cents; may be negative.
 */
export const updateRoundingAdjustment = mutation({
  args: {
    billId: v.id("bills"),
    organizerSecret: v.string(),
    roundingAdjustmentCents: v.number(),
  },
  handler: async (ctx, { billId, organizerSecret, roundingAdjustmentCents }) => {
    const bill = await ctx.db.get(billId);
    if (!bill || bill.organizerSecret !== organizerSecret) {
      throw new Error("Unauthorized");
    }
    if (bill.archivedAt !== undefined) throw new Error("Bill is archived");
    if (!Number.isInteger(roundingAdjustmentCents)) {
      throw new Error("roundingAdjustmentCents must be an integer");
    }
    await ctx.db.patch(billId, { roundingAdjustmentCents });
  },
});

/**
 * updateBankingInfo — allows organizer to save banking transfer details for member display.
 * Mirrors updateRoundingAdjustment pattern. XSS-safe: strips <, >, and " from all string inputs (T-04-04).
 */
export const updateBankingInfo = mutation({
  args: {
    billId: v.id("bills"),
    organizerSecret: v.string(),
    // CR-02: accept null to allow explicit field clear; undefined = not in patch (no-op)
    bankName: v.optional(v.union(v.string(), v.null())),
    accountNumber: v.optional(v.union(v.string(), v.null())),
    accountHolderName: v.optional(v.union(v.string(), v.null())),
    duitNowId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, { billId, organizerSecret, bankName, accountNumber, accountHolderName, duitNowId }) => {
    const bill = await ctx.db.get(billId);
    if (!bill || bill.organizerSecret !== organizerSecret) {
      throw new Error("Unauthorized");
    }
    if (bill.archivedAt !== undefined) throw new Error("Bill is archived");
    // CR-02: empty string after sanitize → null (clears field); undefined → no-op
    const sanitizedBankName = bankName !== undefined ? (bankName !== null ? bankName.replace(/[<>"]/g, "").trim() || null : null) : undefined;
    const sanitizedAccountNumber = accountNumber !== undefined ? (accountNumber !== null ? accountNumber.replace(/[<>"]/g, "").trim() || null : null) : undefined;
    const sanitizedAccountHolderName = accountHolderName !== undefined ? (accountHolderName !== null ? accountHolderName.replace(/[<>"]/g, "").trim() || null : null) : undefined;
    const sanitizedDuitNowId = duitNowId !== undefined ? (duitNowId !== null ? duitNowId.replace(/[<>"]/g, "").trim() || null : null) : undefined;
    await ctx.db.patch(billId, {
      bankName: sanitizedBankName,
      accountNumber: sanitizedAccountNumber,
      accountHolderName: sanitizedAccountHolderName,
      duitNowId: sanitizedDuitNowId,
    });
  },
});

/**
 * archiveStale — internalMutation called by the daily cron job (BONUS-03).
 * Archives bills older than 30 days by setting archivedAt timestamp.
 * Uses JS-side filter instead of Convex q.eq filter on optional field to avoid
 * undefined field edge cases (Pitfall 1 from RESEARCH.md).
 * Declared as internalMutation — not callable via public api.* namespace (T-04-03).
 */
export const archiveStale = internalMutation({
  args: {},
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    // Safe approach: collect all bills and JS-filter — avoids undefined optional field
    // filter edge cases in Convex (do NOT use Convex filter on archivedAt)
    const allBills = await ctx.db.query("bills").collect();
    const staleBills = allBills.filter(
      (b) => !b.archivedAt && b._creationTime < thirtyDaysAgo
    );
    for (const bill of staleBills) {
      await ctx.db.patch(bill._id, { archivedAt: Date.now() });
    }
  },
});
