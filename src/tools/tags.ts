import { Effect } from "effect"
import { z } from "zod"
import { Kit } from "../Kit.js"
import { erase, runTool, type ToolEntry } from "./shared.js"

const listTags = erase({
  name: "list_tags",
  description:
    "List every tag in the Kit account. Required if you want to tag a subscriber (you need the tag id).",
  inputSchema: z.object({}),
  run: () =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.listTags()
      }),
      (result) =>
        result.tags.length
          ? result.tags.map((t) => `#${t.id}  ${t.name}`).join("\n")
          : "No tags yet.",
    ),
})

const tagSubscriber = erase({
  name: "tag_subscriber",
  description: "Apply a tag to a subscriber.",
  inputSchema: z.object({
    subscriber_id: z
      .number()
      .int()
      .describe("Subscriber id (from get_subscriber or list_subscribers)."),
    tag_id: z.number().int().describe("Tag id (from list_tags)."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        yield* kit.tagSubscriber(args.subscriber_id, args.tag_id)
        return null
      }),
      () => `Tagged subscriber #${args.subscriber_id} with tag #${args.tag_id}.`,
    ),
})

export const tagTools: ReadonlyArray<ToolEntry> = [listTags, tagSubscriber]
