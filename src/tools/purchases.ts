import { Effect } from "effect"
import { z } from "zod"
import { Kit } from "../Kit.js"
import { erase, runTool, type ToolEntry } from "./shared.js"

const listPurchases = erase({
  name: "list_purchases",
  description: "List purchases recorded in the Kit account. Paginated.",
  inputSchema: z.object({
    per_page: z.number().int().min(1).max(500).optional().describe("Results per page. Default 50."),
    after: z.string().optional().describe("Pagination cursor from a previous response."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.listPurchases({
          ...(args.per_page !== undefined ? { per_page: args.per_page } : {}),
          ...(args.after !== undefined ? { after: args.after } : {}),
        })
      }),
      (result) => {
        if (result.purchases.length === 0) return "No purchases yet."
        const lines = result.purchases.map(
          (p) =>
            `#${p.id}  ${p.transaction_id}  ${p.currency} ${p.total}  ${p.status}  ${p.transaction_time.slice(0, 10)}`,
        )
        const pageInfo = `${result.purchases.length} purchases, has_next=${result.pagination.has_next_page}`
        return [pageInfo, ...lines].join("\n")
      },
    ),
})

const getPurchase = erase({
  name: "get_purchase",
  description: "Fetch a single purchase by id.",
  inputSchema: z.object({
    purchase_id: z.number().int().describe("Purchase id (from list_purchases)."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.getPurchase(args.purchase_id)
      }),
      (p) =>
        [
          `Purchase #${p.id}`,
          `  transaction_id: ${p.transaction_id}`,
          `  status:         ${p.status}`,
          `  currency:       ${p.currency}`,
          `  subtotal:       ${p.subtotal}`,
          `  total:          ${p.total}`,
          `  transaction_at: ${p.transaction_time}`,
          `  subscriber_id:  ${p.subscriber_id ?? "(none)"}`,
        ].join("\n"),
    ),
})

const createPurchase = erase({
  name: "create_purchase",
  description:
    "Record a purchase in Kit. Requires transaction_id, transaction_time, subtotal, total, status, currency, and products array at minimum. See Kit docs for full schema.",
  inputSchema: z.object({
    transaction_id: z.string().describe("Unique transaction identifier from your payment system."),
    transaction_time: z
      .string()
      .describe("ISO 8601 datetime of the transaction, e.g. 2026-06-01T10:00:00Z."),
    email_address: z
      .string()
      .email()
      .optional()
      .describe("Subscriber email to associate the purchase with."),
    currency: z.string().describe("ISO 4217 currency code, e.g. USD."),
    subtotal: z.number().describe("Subtotal before tax/shipping."),
    total: z.number().describe("Total charged."),
    status: z.string().describe("Purchase status, e.g. paid."),
    products: z
      .array(
        z.object({
          name: z.string(),
          sku: z.string().optional(),
          pid: z.number().optional(),
          unit_price: z.number(),
          quantity: z.number().int(),
        }),
      )
      .describe("Array of purchased products."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        const params: Record<string, unknown> = {
          transaction_id: args.transaction_id,
          transaction_time: args.transaction_time,
          currency: args.currency,
          subtotal: args.subtotal,
          total: args.total,
          status: args.status,
          products: args.products,
        }
        if (args.email_address !== undefined) params.email_address = args.email_address
        return yield* kit.createPurchase(params)
      }),
      (p) => `Purchase recorded: #${p.id}  transaction: ${p.transaction_id}  status: ${p.status}`,
    ),
})

export const purchaseTools: ReadonlyArray<ToolEntry> = [listPurchases, getPurchase, createPurchase]
