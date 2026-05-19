import { Effect, Layer, ManagedRuntime } from "effect"
import { Kit } from "./Kit.js"

/**
 * The MCP server is not an Effect program top-to-bottom — it's driven by
 * the MCP SDK's request handlers, which are plain async functions. So we
 * keep a long-lived ManagedRuntime that the handlers can use to run
 * individual effects without re-building the layer graph per call.
 */
const MainLayer = Layer.mergeAll(Kit.layer)

export const runtime = ManagedRuntime.make(MainLayer)

/**
 * Run an Effect program with the Kit service available. Errors are surfaced
 * as the Effect's error channel; the caller (typically a tool handler)
 * formats them as MCP responses.
 */
export const runEffect = <A, E>(effect: Effect.Effect<A, E, Kit>): Promise<A> =>
  runtime.runPromise(effect)
