import { Effect } from "effect"
import { z } from "zod"
import { Kit } from "../Kit.js"
import { erase, runTool, type ToolEntry } from "./shared.js"

const listWebhooks = erase({
  name: "list_webhooks",
  description: "List all webhooks configured for this Kit account.",
  inputSchema: z.object({}),
  run: () =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.listWebhooks()
      }),
      (result) =>
        result.webhooks.length
          ? result.webhooks.map((w) => `#${w.id}  ${w.target_url}`).join("\n")
          : "No webhooks configured.",
    ),
})

const createWebhook = erase({
  name: "create_webhook",
  description:
    "Create a webhook that fires on a Kit event. Kit will POST to target_url when the event occurs.",
  inputSchema: z.object({
    event_name: z
      .string()
      .describe(
        "Event name to subscribe to, e.g. subscriber.subscriber_activate, subscriber.subscriber_unsubscribe.",
      ),
    target_url: z.string().url().describe("URL Kit will POST to when the event fires."),
    subscriber_filter: z
      .string()
      .optional()
      .describe("Optional filter to scope the webhook to a specific tag or segment."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        const event: { name: string; subscriber_filter?: string } = { name: args.event_name }
        if (args.subscriber_filter !== undefined) event.subscriber_filter = args.subscriber_filter
        return yield* kit.createWebhook({ event, target_url: args.target_url })
      }),
      (w) => `Webhook created: #${w.id}  target: ${w.target_url}`,
    ),
})

const deleteWebhook = erase({
  name: "delete_webhook",
  description: "Delete a webhook by id.",
  inputSchema: z.object({
    webhook_id: z.number().int().describe("Webhook id (from list_webhooks)."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        yield* kit.deleteWebhook(args.webhook_id)
        return null
      }),
      () => `Webhook #${args.webhook_id} deleted.`,
    ),
})

export const webhookTools: ReadonlyArray<ToolEntry> = [listWebhooks, createWebhook, deleteWebhook]
