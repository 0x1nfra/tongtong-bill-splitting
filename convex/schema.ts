import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  bills: defineTable({
    organizerSecret: v.string(),
    title: v.string(),
    applySST: v.boolean(),
    applyServiceCharge: v.boolean(),
    qrStorageId: v.optional(v.id("_storage")),
    archivedAt: v.optional(v.number()),
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
