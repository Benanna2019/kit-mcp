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

const createSubscriber = erase({
  name: "create_subscriber",
  description:
    "Create or update a subscriber (upsert by email). If the email already exists, updates the provided fields.",
  inputSchema: z.object({
    email_address: z.string().email().describe("Subscriber email address."),
    first_name: z.string().optional().describe("First name."),
    last_name: z.string().optional().describe("Last name."),
    fields: z
      .record(z.string(), z.string())
      .optional()
      .describe("Custom field key/value pairs, e.g. { company: 'Acme' }."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        const params: {
          readonly email_address: string
          readonly first_name?: string
          readonly last_name?: string
          readonly fields?: Record<string, string>
        } = { email_address: args.email_address,
          ...(args.first_name !== undefined ? { first_name: args.first_name } : {}),
          ...(args.last_name !== undefined ? { last_name: args.last_name } : {}),
          ...(args.fields !== undefined ? { fields: args.fields } : {}),
        }
        return yield* kit.createSubscriber(params)
      }),
      (s) => `Subscriber #${s.id}  ·  ${s.email_address}  ·  state: ${s.state}`,
    ),
})

const updateSubscriber = erase({
  name: "update_subscriber",
  description: "Update an existing subscriber's name, email, or custom fields.",
  inputSchema: z.object({
    subscriber_id: z
      .number()
      .int()
      .describe("Subscriber id (from get_subscriber or list_subscribers)."),
    first_name: z.string().optional().describe("New first name."),
    last_name: z.string().optional().describe("New last name."),
    email_address: z.string().email().optional().describe("New email address."),
    fields: z
      .record(z.string(), z.string())
      .optional()
      .describe("Custom field key/value pairs to set."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        const params: {
          readonly first_name?: string
          readonly last_name?: string
          readonly email_address?: string
          readonly fields?: Record<string, string>
        } = {
          ...(args.first_name !== undefined ? { first_name: args.first_name } : {}),
          ...(args.last_name !== undefined ? { last_name: args.last_name } : {}),
          ...(args.email_address !== undefined ? { email_address: args.email_address } : {}),
          ...(args.fields !== undefined ? { fields: args.fields } : {}),
        }
        return yield* kit.updateSubscriber(args.subscriber_id, params)
      }),
      (s) => `Subscriber #${s.id} updated.`,
    ),
})

export const subscriberTools: ReadonlyArray<ToolEntry> = [
  listSubscribers,
  getSubscriber,
  createSubscriber,
  updateSubscriber,
]
