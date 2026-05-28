import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

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
    }

    const billId = await ctx.db.insert("bills", {
      organizerSecret: args.organizerSecret,
      title: args.title,
      applySST: args.applySST,
      applyServiceCharge: args.applyServiceCharge,
      qrStorageId: args.qrStorageId,
      venueName: args.venueName,
      billDate: args.billDate,
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
  },
  handler: async (ctx, { billId, itemId, claimantName, claimantSession }) => {
    // Verify bill exists
    const bill = await ctx.db.get(billId);
    if (!bill) throw new Error("Bill not found");

    // Verify item exists and belongs to this bill
    const item = await ctx.db.get(itemId);
    if (!item || item.billId !== billId) throw new Error("Item not found on this bill");

    // Idempotency guard: return existing claim _id if session already claimed this item (T-02-03)
    const existing = await ctx.db
      .query("claims")
      .withIndex("by_session", (q) =>
        q.eq("billId", billId).eq("claimantSession", claimantSession)
      )
      .filter((q) => q.eq(q.field("itemId"), itemId))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("claims", {
      billId,
      itemId,
      claimantName,
      claimantSession,
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

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_bill", (q) => q.eq("billId", billId))
      .collect();

    // CLAIMED: unique sessions that have claims but no pending/settled payment (D-08)
    // Rejected payments do NOT count as paid — member must re-submit
    const claimingSessions = new Set(claims.map((c) => c.claimantSession));
    const paidSessions = new Set(
      payments
        .filter((p) => p.status === "pending" || p.status === "settled")
        .map((p) => p.claimantSession)
    );
    const claimedCount = [...claimingSessions].filter(
      (s) => !paidSessions.has(s)
    ).length;

    // UNCLAIMED: items with zero claim records
    const claimedItemIds = new Set(claims.map((c) => c.itemId));
    const unclaimedCount = items.filter((i) => !claimedItemIds.has(i._id)).length;

    return { claimedCount, unclaimedCount };
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
    await ctx.db.patch(billId, { receiptStorageId });
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
