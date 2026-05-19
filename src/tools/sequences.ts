import { Effect } from "effect"
import { z } from "zod"
import { Kit } from "../Kit.js"
import { erase, runTool, type ToolEntry } from "./shared.js"

const createSequence = erase({
  name: "create_sequence",
  description:
    "Create a new empty sequence (automated email series). Returns the sequence id and name.",
  inputSchema: z.object({
    name: z.string().describe("Display name for the sequence."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.createSequence(args.name)
      }),
      (seq) => `Sequence created: #${seq.id}  ·  "${seq.name}"`,
    ),
})

const createSequenceEmail = erase({
  name: "create_sequence_email",
  description:
    "Add an email to an existing sequence. delay_in_days controls when it sends relative to the previous email (or subscription for the first email).",
  inputSchema: z.object({
    sequence_id: z
      .number()
      .int()
      .describe("Sequence id (from create_sequence or your Kit dashboard)."),
    subject: z.string().optional().describe("Email subject line."),
    content: z.string().optional().describe("HTML email body."),
    delay_in_days: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe(
        "Days after the previous email (or subscription) to send this. Default 0.",
      ),
    position: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe("Position in the sequence. Omit to append at the end."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        const params: {
          subject?: string
          content?: string
          delay_in_days?: number
          position?: number
        } = {}
        if (args.subject !== undefined) params.subject = args.subject
        if (args.content !== undefined) params.content = args.content
        if (args.delay_in_days !== undefined) params.delay_in_days = args.delay_in_days
        if (args.position !== undefined) params.position = args.position
        return yield* kit.createSequenceEmail(args.sequence_id, params)
      }),
      (email) =>
        `Sequence email created: #${email.id}  ·  "${email.subject ?? "(no subject)"}"  ·  delay ${email.delay_in_days}d  ·  position ${email.position}`,
    ),
})

const updateSequenceEmail = erase({
  name: "update_sequence_email",
  description: "Edit an existing sequence email's subject, body, or send delay.",
  inputSchema: z.object({
    sequence_email_id: z
      .number()
      .int()
      .describe("Sequence email id (from create_sequence_email)."),
    subject: z.string().optional().describe("New subject line."),
    content: z.string().optional().describe("New HTML body."),
    delay_in_days: z.number().int().min(0).optional().describe("New delay in days."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        const params: {
          subject?: string
          content?: string
          delay_in_days?: number
        } = {}
        if (args.subject !== undefined) params.subject = args.subject
        if (args.content !== undefined) params.content = args.content
        if (args.delay_in_days !== undefined) params.delay_in_days = args.delay_in_days
        return yield* kit.updateSequenceEmail(args.sequence_email_id, params)
      }),
      (email) => `Sequence email #${email.id} updated.`,
    ),
})

const addSubscriberToSequence = erase({
  name: "add_subscriber_to_sequence",
  description:
    "Enroll a subscriber in a sequence. They will receive emails starting from position 1.",
  inputSchema: z.object({
    sequence_id: z.number().int().describe("Sequence id."),
    subscriber_id: z
      .number()
      .int()
      .describe("Subscriber id (from get_subscriber or create_subscriber)."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        yield* kit.addSubscriberToSequence(args.sequence_id, args.subscriber_id)
        return null
      }),
      () =>
        `Subscriber #${args.subscriber_id} enrolled in sequence #${args.sequence_id}.`,
    ),
})

const listSequences = erase({
  name: "list_sequences",
  description: "List all sequences in the Kit account. Paginated.",
  inputSchema: z.object({
    per_page: z.number().int().min(1).max(500).optional().describe("Results per page. Default 50."),
    after: z.string().optional().describe("Pagination cursor from a previous response."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.listSequences({
          ...(args.per_page !== undefined ? { per_page: args.per_page } : {}),
          ...(args.after !== undefined ? { after: args.after } : {}),
        })
      }),
      (result) => {
        if (result.sequences.length === 0) return "No sequences yet."
        const lines = result.sequences.map((s) => `#${s.id}  ${s.name}  (created ${s.created_at.slice(0, 10)})`)
        const pageInfo = `has_next=${result.pagination.has_next_page}, end_cursor=${result.pagination.end_cursor ?? "(none)"}`
        return [...lines, "", pageInfo].join("\n")
      },
    ),
})

const getSequence = erase({
  name: "get_sequence",
  description: "Fetch a single sequence by id.",
  inputSchema: z.object({
    sequence_id: z.number().int().describe("Sequence id."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.getSequence(args.sequence_id)
      }),
      (seq) => `Sequence #${seq.id}  ·  "${seq.name}"  ·  created ${seq.created_at.slice(0, 10)}`,
    ),
})

const updateSequence = erase({
  name: "update_sequence",
  description: "Rename a sequence.",
  inputSchema: z.object({
    sequence_id: z.number().int().describe("Sequence id."),
    name: z.string().describe("New name for the sequence."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.updateSequence(args.sequence_id, args.name)
      }),
      (seq) => `Sequence #${seq.id} renamed to "${seq.name}".`,
    ),
})

const deleteSequence = erase({
  name: "delete_sequence",
  description: "Delete a sequence by id. This is permanent.",
  inputSchema: z.object({
    sequence_id: z.number().int().describe("Sequence id."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        yield* kit.deleteSequence(args.sequence_id)
        return null
      }),
      () => `Sequence #${args.sequence_id} deleted.`,
    ),
})

const listSequenceEmails = erase({
  name: "list_sequence_emails",
  description: "List all emails in a sequence.",
  inputSchema: z.object({
    sequence_id: z.number().int().describe("Sequence id."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.listSequenceEmails(args.sequence_id)
      }),
      (result) => {
        if (result.sequence_emails.length === 0) return "No emails in this sequence."
        return result.sequence_emails
          .map(
            (e) =>
              `#${e.id}  pos ${e.position}  delay ${e.delay_in_days}d  ·  ${e.subject ?? "(no subject)"}`,
          )
          .join("\n")
      },
    ),
})

const listSequenceSubscribers = erase({
  name: "list_sequence_subscribers",
  description: "List subscribers enrolled in a sequence. Paginated.",
  inputSchema: z.object({
    sequence_id: z.number().int().describe("Sequence id."),
    per_page: z.number().int().min(1).max(500).optional().describe("Results per page. Default 50."),
    after: z.string().optional().describe("Pagination cursor from a previous response."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.listSequenceSubscribers(args.sequence_id, {
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

export const sequenceTools: ReadonlyArray<ToolEntry> = [
  createSequence,
  createSequenceEmail,
  updateSequenceEmail,
  addSubscriberToSequence,
  listSequences,
  getSequence,
  updateSequence,
  deleteSequence,
  listSequenceEmails,
  listSequenceSubscribers,
]
