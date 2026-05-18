import { Effect, Match } from "effect"
import { z, type ZodRawShape } from "zod"
import { Kit, type KitError } from "../Kit.js"
import { runEffect } from "../runtime.js"

export type ToolResult = {
  content: Array<{ type: "text"; text: string }>
  isError?: boolean
}

export type Tool<Args extends ZodRawShape> = {
  readonly name: string
  readonly description: string
  readonly inputSchema: z.ZodObject<Args>
  readonly run: (args: z.infer<z.ZodObject<Args>>) => Promise<ToolResult>
}

export type ToolEntry = {
  readonly name: string
  readonly description: string
  readonly inputSchema: z.ZodObject<ZodRawShape>
  readonly run: (args: unknown) => Promise<ToolResult>
}

export const erase = <Args extends ZodRawShape>(tool: Tool<Args>): ToolEntry => ({
  name: tool.name,
  description: tool.description,
  inputSchema: tool.inputSchema as z.ZodObject<ZodRawShape>,
  run: (args: unknown) => tool.run(args as z.infer<z.ZodObject<Args>>),
})

const formatKitError = (e: KitError): string =>
  Match.value(e).pipe(
    Match.tag("KitConfigError", (err) => `Kit configuration: ${err.message}`),
    Match.tag(
      "KitRequestError",
      (err) =>
        `Kit ${err.method} ${err.path} → HTTP ${err.status}${err.body ? `\n${err.body}` : ""}`,
    ),
    Match.tag(
      "KitNetworkError",
      (err) => `Kit network error on ${err.method} ${err.path}: ${err.reason}`,
    ),
    Match.exhaustive,
  )

export const runTool = async <A>(
  effect: Effect.Effect<A, KitError, Kit>,
  render: (value: A) => string,
): Promise<ToolResult> => {
  const exit = await runEffect(Effect.exit(effect))
  if (exit._tag === "Failure") {
    const failure = exit.cause
    const error = failure._tag === "Fail" ? failure.error : null
    const message = error
      ? formatKitError(error)
      : `Unexpected failure: ${JSON.stringify(failure, null, 2)}`
    return { isError: true, content: [{ type: "text", text: message }] }
  }
  return { content: [{ type: "text", text: render(exit.value) }] }
}
