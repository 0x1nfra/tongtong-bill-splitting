import { mutation, query } from "./_generated/server";
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

    const qrUrl = bill.qrStorageId
      ? await ctx.storage.getUrl(bill.qrStorageId)
      : null;

    // Explicitly exclude organizerSecret — members must not see it (T-01-04)
    const {
      organizerSecret: _excluded,
      ...billWithoutSecret
    } = bill;

    return { ...billWithoutSecret, items, qrUrl };
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

    return { bill, items, payments, qrUrl };
  },
});
