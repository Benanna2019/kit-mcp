import { Effect } from "effect"
import { z } from "zod"
import { Kit } from "../Kit.js"
import { erase, runTool, type ToolEntry } from "./shared.js"

const listForms = erase({
  name: "list_forms",
  description: "List all forms in the Kit account.",
  inputSchema: z.object({}),
  run: () =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.listForms()
      }),
      (result) =>
        result.forms.length
          ? result.forms.map((f) => `#${f.id}  ${f.name}  (${f.type ?? "form"})`).join("\n")
          : "No forms yet.",
    ),
})

const listFormSubscribers = erase({
  name: "list_form_subscribers",
  description: "List subscribers who opted in through a specific form. Paginated.",
  inputSchema: z.object({
    form_id: z.number().int().describe("Form id (from list_forms)."),
    per_page: z.number().int().min(1).max(500).optional().describe("Results per page. Default 50."),
    after: z.string().optional().describe("Pagination cursor from a previous response."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.listFormSubscribers(args.form_id, {
          ...(args.per_page !== undefined ? { per_page: args.per_page } : {}),
          ...(args.after !== undefined ? { after: args.after } : {}),
        })
      }),
      (result) => {
        const lines = result.subscribers.map(
          (s) => `${s.email_address}  ·  ${s.first_name ?? "(none)"}  ·  ${s.state}`,
        )
        const pageInfo = `${result.subscribers.length} subscribers, has_next=${result.pagination.has_next_page}`
        return [pageInfo, ...lines].join("\n")
      },
    ),
})

const addSubscriberToForm = erase({
  name: "add_subscriber_to_form",
  description: "Subscribe an existing subscriber to a form by subscriber id.",
  inputSchema: z.object({
    form_id: z.number().int().describe("Form id."),
    subscriber_id: z.number().int().describe("Subscriber id."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        yield* kit.addSubscriberToForm(args.form_id, args.subscriber_id)
        return null
      }),
      () => `Subscriber #${args.subscriber_id} added to form #${args.form_id}.`,
    ),
})

const addSubscriberToFormByEmail = erase({
  name: "add_subscriber_to_form_by_email",
  description: "Subscribe (or create) a subscriber to a form by email address.",
  inputSchema: z.object({
    form_id: z.number().int().describe("Form id."),
    email: z.string().email().describe("Subscriber email address."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        yield* kit.addSubscriberToFormByEmail(args.form_id, args.email)
        return null
      }),
      () => `${args.email} added to form #${args.form_id}.`,
    ),
})

export const formTools: ReadonlyArray<ToolEntry> = [
  listForms,
  listFormSubscribers,
  addSubscriberToForm,
  addSubscriberToFormByEmail,
]
