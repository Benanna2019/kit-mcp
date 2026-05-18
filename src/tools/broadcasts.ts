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

export const broadcastTools: ReadonlyArray<ToolEntry> = [listBroadcasts]
