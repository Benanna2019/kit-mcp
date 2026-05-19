import { Effect } from "effect"
import { z } from "zod"
import { Kit } from "../Kit.js"
import { erase, runTool, type ToolEntry } from "./shared.js"

const listBroadcasts = erase({
  name: "list_broadcasts",
  description:
    "List recent broadcasts. Returns subject, send time, and ids. Useful for finding a broadcast to inspect.",
  inputSchema: z.object({
    per_page: z
      .number()
      .int()
      .min(1)
      .max(500)
      .optional()
      .describe("How many broadcasts to return. Default 50."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.listBroadcasts(
          args.per_page !== undefined ? { per_page: args.per_page } : undefined,
        )
      }),
      (result) => {
        if (result.broadcasts.length === 0) return "No broadcasts yet."
        return result.broadcasts
          .map((b) => {
            const sent = b.published_at ?? b.send_at ?? "(draft)"
            return `#${b.id}  ·  ${b.subject ?? "(no subject)"}  ·  ${sent}`
          })
          .join("\n")
      },
    ),
})

const createBroadcast = erase({
  name: "create_broadcast",
  description:
    "Create a broadcast (draft or scheduled). Returns the broadcast id. Omit send_at to save as draft.",
  inputSchema: z.object({
    subject: z.string().describe("Email subject line."),
    content: z.string().optional().describe("HTML email body."),
    description: z
      .string()
      .optional()
      .describe("Internal description visible only in Kit — not sent to subscribers."),
    send_at: z
      .string()
      .optional()
      .describe("ISO 8601 datetime to schedule sending, e.g. 2026-06-01T10:00:00Z."),
    preview_text: z.string().optional().describe("Preview text shown in inbox below subject."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        const params: {
          subject: string
          content?: string
          description?: string
          send_at?: string
          preview_text?: string
        } = { subject: args.subject }
        if (args.content !== undefined) params.content = args.content
        if (args.description !== undefined) params.description = args.description
        if (args.send_at !== undefined) params.send_at = args.send_at
        if (args.preview_text !== undefined) params.preview_text = args.preview_text
        return yield* kit.createBroadcast(params)
      }),
      (b) => `Broadcast created: #${b.id}  ·  "${b.subject ?? "(no subject)"}"`,
    ),
})

const updateBroadcast = erase({
  name: "update_broadcast",
  description: "Update a draft broadcast's subject, content, scheduled time, or preview text.",
  inputSchema: z.object({
    broadcast_id: z
      .number()
      .int()
      .describe("Broadcast id (from list_broadcasts or create_broadcast)."),
    subject: z.string().optional().describe("New subject line."),
    content: z.string().optional().describe("New HTML body."),
    send_at: z
      .string()
      .optional()
      .describe("New ISO 8601 send time. Pass empty string to unschedule."),
    preview_text: z.string().optional().describe("New preview text."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        const { broadcast_id, ...rest } = args
        const params: {
          subject?: string
          content?: string
          send_at?: string
          preview_text?: string
        } = {}
        if (rest.subject !== undefined) params.subject = rest.subject
        if (rest.content !== undefined) params.content = rest.content
        if (rest.send_at !== undefined) params.send_at = rest.send_at
        if (rest.preview_text !== undefined) params.preview_text = rest.preview_text
        return yield* kit.updateBroadcast(broadcast_id, params)
      }),
      (b) => `Broadcast #${b.id} updated.`,
    ),
})

const getBroadcast = erase({
  name: "get_broadcast",
  description: "Fetch a single broadcast by id.",
  inputSchema: z.object({
    broadcast_id: z.number().int().describe("Broadcast id."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.getBroadcast(args.broadcast_id)
      }),
      (b) => {
        const sent = b.published_at ?? b.send_at ?? "(draft)"
        return [
          `Broadcast #${b.id}`,
          `  subject: ${b.subject ?? "(none)"}`,
          `  send_at: ${sent}`,
          `  preview: ${b.preview_text ?? "(none)"}`,
        ].join("\n")
      },
    ),
})

const deleteBroadcast = erase({
  name: "delete_broadcast",
  description: "Delete a broadcast by id. This is permanent.",
  inputSchema: z.object({
    broadcast_id: z.number().int().describe("Broadcast id."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        yield* kit.deleteBroadcast(args.broadcast_id)
        return null
      }),
      () => `Broadcast #${args.broadcast_id} deleted.`,
    ),
})

const getBroadcastStats = erase({
  name: "get_broadcast_stats",
  description: "Get send, open, and click stats for a broadcast.",
  inputSchema: z.object({
    broadcast_id: z.number().int().describe("Broadcast id."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.getBroadcastStats(args.broadcast_id)
      }),
      (result) => {
        const b = result.broadcast
        const lines = Object.entries(result.stats).map(([k, v]) => `  ${k}: ${v}`)
        return [
          `Stats for broadcast #${b.id} "${b.subject ?? "(no subject)"}"`,
          ...lines,
        ].join("\n")
      },
    ),
})

export const broadcastTools: ReadonlyArray<ToolEntry> = [
  listBroadcasts,
  createBroadcast,
  updateBroadcast,
  getBroadcast,
  deleteBroadcast,
  getBroadcastStats,
]
