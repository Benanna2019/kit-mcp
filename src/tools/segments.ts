import { Effect } from "effect"
import { z } from "zod"
import { Kit } from "../Kit.js"
import { erase, runTool, type ToolEntry } from "./shared.js"

const listSegments = erase({
  name: "list_segments",
  description: "List all segments in the Kit account.",
  inputSchema: z.object({}),
  run: () =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.listSegments()
      }),
      (result) =>
        result.segments.length
          ? result.segments
              .map((s) => `#${s.id}  ${s.name}  (created ${s.created_at.slice(0, 10)})`)
              .join("\n")
          : "No segments yet.",
    ),
})

export const segmentTools: ReadonlyArray<ToolEntry> = [listSegments]
