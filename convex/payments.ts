import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * markPaid — creates a pending payment for the member's session (PAY-01).
 * Idempotent: if a non-rejected payment already exists for this session, returns its ID
 * without creating a duplicate (T-01-03 threat mitigation).
 */
export const markPaid = mutation({
  args: {
    billId: v.id("bills"),
    claimantSession: v.string(),
    claimantName: v.string(),
  },
  handler: async (ctx, { billId, claimantSession, claimantName }) => {
    // Verify bill exists before creating any payment record (CR-02)
    const bill = await ctx.db.get(billId);
    if (!bill) throw new Error("Bill not found");
    if (bill.archivedAt !== undefined) throw new Error("Bill is archived");

    // Check for existing pending/settled payment for this session (T-01-03)
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_session", (q) =>
        q.eq("billId", billId).eq("claimantSession", claimantSession)
      )
      .first();

    if (existing && existing.status !== "rejected") {
      return existing._id;
    }

    return await ctx.db.insert("payments", {
      billId,
      claimantSession,
      claimantName,
      status: "pending",
      paidAt: Date.now(),
    });
  },
});

/**
 * confirmPayment — organizer confirms a pending payment (PAY-04, AUTH-03).
 * Verifies organizerSecret server-side before writing (T-01-01 threat mitigation).
 */
export const confirmPayment = mutation({
  args: {
    paymentId: v.id("payments"),
    organizerSecret: v.string(),
  },
  handler: async (ctx, { paymentId, organizerSecret }) => {
    const payment = await ctx.db.get(paymentId);
    if (!payment) throw new Error("Payment not found");

    const bill = await ctx.db.get(payment.billId);
    // Server-side secret verification (T-01-01)
    if (!bill || bill.organizerSecret !== organizerSecret) {
      throw new Error("Unauthorized");
    }
    if (bill.archivedAt !== undefined) throw new Error("Bill is archived");

    // WR-01: enforce state machine — only pending payments can be confirmed
    if (payment.status !== "pending") {
      throw new Error(`Cannot confirm a payment with status: ${payment.status}`);
    }

    await ctx.db.patch(paymentId, {
      status: "settled",
      confirmedAt: Date.now(),
    });
  },
});

/**
 * rejectPayment — organizer rejects a payment (PAY-05, AUTH-03).
 * Same organizerSecret verification as confirmPayment (T-01-02 threat mitigation).
 * Member can tap "I've Paid" again after rejection.
 */
export const rejectPayment = mutation({
  args: {
    paymentId: v.id("payments"),
    organizerSecret: v.string(),
  },
  handler: async (ctx, { paymentId, organizerSecret }) => {
    const payment = await ctx.db.get(paymentId);
    if (!payment) throw new Error("Payment not found");

    const bill = await ctx.db.get(payment.billId);
    // Server-side secret verification (T-01-02)
    if (!bill || bill.organizerSecret !== organizerSecret) {
      throw new Error("Unauthorized");
    }
    if (bill.archivedAt !== undefined) throw new Error("Bill is archived");

    // WR-01: enforce state machine — only pending payments can be rejected
    if (payment.status !== "pending") {
      throw new Error(`Cannot reject a payment with status: ${payment.status}`);
    }

    await ctx.db.patch(paymentId, {
      status: "rejected",
    });
  },
});

/**
 * getPaymentsForBill — organizer query returning all payments for a bill (DASH-01, DASH-02, DASH-03).
 * Verifies organizerSecret before returning payment data.
 */
export const getPaymentsForBill = query({
  args: {
    billId: v.id("bills"),
    organizerSecret: v.string(),
  },
  handler: async (ctx, { billId, organizerSecret }) => {
    const bill = await ctx.db.get(billId);
    // WR-06: return null instead of throwing — useQuery stays stuck on undefined when queries throw
    if (!bill || bill.organizerSecret !== organizerSecret) {
      return null;
    }

    return await ctx.db
      .query("payments")
      .withIndex("by_bill", (q) => q.eq("billId", billId))
      .collect();
  },
});

/**
 * getMyPayment — member query returning their own payment status (PAY-02).
 * No auth check — member queries by their own unguessable session UUID.
 */
export const getMyPayment = query({
  args: {
    billId: v.id("bills"),
    claimantSession: v.string(),
  },
  handler: async (ctx, { billId, claimantSession }) => {
    const all = await ctx.db
      .query("payments")
      .withIndex("by_session", (q) =>
        q.eq("billId", billId).eq("claimantSession", claimantSession)
      )
      .collect();
    if (all.length === 0) return null;
    const priority = { settled: 3, pending: 2, rejected: 1 } as const;
    return all.reduce((best, p) =>
      priority[p.status] > priority[best.status] ? p : best
    );
  },
});
