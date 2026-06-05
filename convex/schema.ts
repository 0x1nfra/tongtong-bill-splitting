import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  bills: defineTable({
    organizerSecret: v.string(),
    title: v.string(),
    applySST: v.boolean(),
    applyServiceCharge: v.boolean(),
    qrStorageId: v.optional(v.id("_storage")),
    receiptStorageId: v.optional(v.id("_storage")),
    archivedAt: v.optional(v.number()),
    roundingAdjustmentCents: v.optional(v.number()), // integer RM cents; may be negative
    venueName: v.optional(v.string()),
    billDate: v.optional(v.string()), // ISO date string "YYYY-MM-DD"
    // Banking info for transfer payment display (Phase 07)
    // v.null() allows explicit field clear via updateBankingInfo (CR-02)
    bankName: v.optional(v.union(v.string(), v.null())),
    accountNumber: v.optional(v.union(v.string(), v.null())),
    accountHolderName: v.optional(v.union(v.string(), v.null())),
    duitNowId: v.optional(v.union(v.string(), v.null())),
  }),

  items: defineTable({
    billId: v.id("bills"),
    name: v.string(),
    price: v.number(), // RM cents (integer)
    quantity: v.number(),
    orderIndex: v.number(),
  }).index("by_bill", ["billId"]),

  claims: defineTable({
    billId: v.id("bills"),
    itemId: v.id("items"),
    claimantName: v.string(),
    claimantSession: v.string(),
    claimQty: v.optional(v.number()), // units claimed; absent = 1 (backward compat)
    createdAt: v.number(),
  })
    .index("by_bill", ["billId"])
    .index("by_item", ["itemId"])
    .index("by_session", ["billId", "claimantSession"]),

  payments: defineTable({
    billId: v.id("bills"),
    claimantSession: v.string(),
    claimantName: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("settled"),
      v.literal("rejected")
    ),
    paidAt: v.number(),
    confirmedAt: v.optional(v.number()),
    proofStorageId: v.optional(v.id("_storage")),
  })
    .index("by_bill", ["billId"])
    .index("by_session", ["billId", "claimantSession"]),
});
