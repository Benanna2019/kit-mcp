import { Effect } from "effect"
import { z } from "zod"
import { Kit } from "../Kit.js"
import { erase, runTool, type ToolEntry } from "./shared.js"

const listTags = erase({
  name: "list_tags",
  description:
    "List every tag in the Kit account. Required before tagging a subscriber — you need the tag id.",
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

const createTag = erase({
  name: "create_tag",
  description: "Create a new tag. Returns the tag id.",
  inputSchema: z.object({
    name: z.string().describe("Tag name. Must be unique within the account."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.createTag(args.name)
      }),
      (tag) => `Tag created: #${tag.id}  ·  "${tag.name}"`,
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
    tag_id: z.number().int().describe("Tag id (from list_tags or create_tag)."),
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

const removeTagFromSubscriber = erase({
  name: "remove_tag_from_subscriber",
  description: "Remove a tag from a subscriber.",
  inputSchema: z.object({
    subscriber_id: z.number().int().describe("Subscriber id."),
    tag_id: z.number().int().describe("Tag id to remove."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        yield* kit.removeTagFromSubscriber(args.tag_id, args.subscriber_id)
        return null
      }),
      () => `Removed tag #${args.tag_id} from subscriber #${args.subscriber_id}.`,
    ),
})

const updateTag = erase({
  name: "update_tag",
  description: "Rename a tag.",
  inputSchema: z.object({
    tag_id: z.number().int().describe("Tag id."),
    name: z.string().describe("New name for the tag."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.updateTag(args.tag_id, args.name)
      }),
      (tag) => `Tag #${tag.id} renamed to "${tag.name}".`,
    ),
})

const listSubscribersForTag = erase({
  name: "list_subscribers_for_tag",
  description: "List subscribers with a given tag. Paginated.",
  inputSchema: z.object({
    tag_id: z.number().int().describe("Tag id."),
    per_page: z.number().int().min(1).max(500).optional().describe("Results per page. Default 50."),
    after: z.string().optional().describe("Pagination cursor from a previous response."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.listSubscribersForTag(args.tag_id, {
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

export const tagTools: ReadonlyArray<ToolEntry> = [
  listTags,
  createTag,
  tagSubscriber,
  removeTagFromSubscriber,
  updateTag,
  listSubscribersForTag,
]
