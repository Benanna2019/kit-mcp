import { Effect } from "effect"
import { z } from "zod"
import { Kit } from "../Kit.js"
import { erase, runTool, type ToolEntry } from "./shared.js"

const listSubscribers = erase({
  name: "list_subscribers",
  description:
    "List subscribers on the Kit account. Returns email, name, state, and creation date for each. Paginated.",
  inputSchema: z.object({
    per_page: z
      .number()
      .int()
      .min(1)
      .max(500)
      .optional()
      .describe("How many subscribers to return. Default 50. Max 500."),
    after: z
      .string()
      .optional()
      .describe(
        "Pagination cursor from a previous response's pagination.end_cursor. Omit on the first call.",
      ),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.listSubscribers({
          ...(args.per_page !== undefined ? { per_page: args.per_page } : {}),
          ...(args.after !== undefined ? { after: args.after } : {}),
        })
      }),
      (result) => {
        const lines = result.subscribers.map(
          (s) =>
            `${s.email_address}  ·  ${s.first_name ?? "—"}  ·  ${s.state}  ·  joined ${s.created_at.slice(0, 10)}`,
        )
        const pageInfo = `Page: per_page=${result.pagination.per_page}, has_next=${result.pagination.has_next_page}, end_cursor=${result.pagination.end_cursor ?? "(none)"}`
        return [`${result.subscribers.length} subscribers`, "", ...lines, "", pageInfo].join("\n")
      },
    ),
})

const getSubscriber = erase({
  name: "get_subscriber",
  description:
    "Look up a single subscriber by email address. Returns the full subscriber record or a not-found message.",
  inputSchema: z.object({
    email: z.string().email().describe("Subscriber email address."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.getSubscriberByEmail(args.email)
      }),
      (s) => {
        if (!s) return `No subscriber found for ${args.email}.`
        return [
          `Subscriber #${s.id}`,
          `  email:   ${s.email_address}`,
          `  name:    ${s.first_name ?? "(none)"}`,
          `  state:   ${s.state}`,
          `  joined:  ${s.created_at}`,
        ].join("\n")
      },
    ),
})

export const subscriberTools: ReadonlyArray<ToolEntry> = [listSubscribers, getSubscriber]
