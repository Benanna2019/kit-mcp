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

export const sequenceTools: ReadonlyArray<ToolEntry> = [
  createSequence,
  createSequenceEmail,
  updateSequenceEmail,
  addSubscriberToSequence,
]
