import { Effect } from "effect"
import { z } from "zod"
import { Kit } from "../Kit.js"
import { erase, runTool, type ToolEntry } from "./shared.js"

const listCustomFields = erase({
  name: "list_custom_fields",
  description: "List all custom subscriber fields in the Kit account.",
  inputSchema: z.object({}),
  run: () =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.listCustomFields()
      }),
      (result) =>
        result.custom_fields.length
          ? result.custom_fields
              .map((f) => `#${f.id}  key: ${f.key}  label: ${f.label}`)
              .join("\n")
          : "No custom fields yet.",
    ),
})

const createCustomField = erase({
  name: "create_custom_field",
  description: "Create a new custom subscriber field.",
  inputSchema: z.object({
    label: z.string().describe("Human-readable label for the field. Kit derives the key from this."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.createCustomField(args.label)
      }),
      (f) => `Custom field created: #${f.id}  key: ${f.key}  label: ${f.label}`,
    ),
})

const updateCustomField = erase({
  name: "update_custom_field",
  description: "Rename a custom field.",
  inputSchema: z.object({
    custom_field_id: z.number().int().describe("Custom field id (from list_custom_fields)."),
    label: z.string().describe("New label for the field."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.updateCustomField(args.custom_field_id, args.label)
      }),
      (f) => `Custom field #${f.id} updated. New label: "${f.label}"`,
    ),
})

const deleteCustomField = erase({
  name: "delete_custom_field",
  description: "Delete a custom field by id. This is permanent.",
  inputSchema: z.object({
    custom_field_id: z.number().int().describe("Custom field id."),
  }),
  run: (args) =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        yield* kit.deleteCustomField(args.custom_field_id)
        return null
      }),
      () => `Custom field #${args.custom_field_id} deleted.`,
    ),
})

export const customFieldTools: ReadonlyArray<ToolEntry> = [
  listCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
]
