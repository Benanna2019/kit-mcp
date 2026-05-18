#!/usr/bin/env node
import "./env.js" // must be first
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import express from "express"
import type { IncomingMessage, ServerResponse } from "node:http"
import type { ZodRawShape } from "zod"
import { allTools } from "./tools/index.js"

function buildServer(): McpServer {
  const server = new McpServer({ name: "kit-mcp", version: "0.1.0" })
  for (const tool of allTools) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.inputSchema.shape as ZodRawShape },
      async (args: unknown) => tool.run(args as never),
    )
  }
  return server
}

async function startHttp(): Promise<void> {
  const port = Number(process.env.PORT ?? "3000")
  const app = express()
  app.use(express.json())

  // Omit sessionIdGenerator entirely for stateless mode (exactOptionalPropertyTypes)
  const transport = new StreamableHTTPServerTransport()
  const server = buildServer()
  // Cast needed: StreamableHTTPServerTransport.onclose getter returns `(() => void) | undefined`
  // which is incompatible with Transport's `onclose?: () => void` under exactOptionalPropertyTypes
  await server.connect(transport as never)

  app.post("/mcp", (req, res) => { void transport.handleRequest(req as unknown as IncomingMessage, res as unknown as ServerResponse, req.body) })
  app.get("/mcp", (req, res) => { void transport.handleRequest(req as unknown as IncomingMessage, res as unknown as ServerResponse) })
  app.delete("/mcp", (req, res) => { void transport.handleRequest(req as unknown as IncomingMessage, res as unknown as ServerResponse) })
  app.get("/health", (_req, res) => { res.json({ status: "ok" }) })

  await new Promise<void>((resolve) => { app.listen(port, () => { resolve() }) })
  process.stderr.write(`[kit-mcp] HTTP listening on :${port}/mcp\n`)
}

async function startStdio(): Promise<void> {
  const server = buildServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
  process.stderr.write(`[kit-mcp] stdio transport ready\n`)
}

async function main(): Promise<void> {
  if (!process.env.KIT_API_KEY) {
    process.stderr.write(
      `[kit-mcp] WARNING: KIT_API_KEY not set. Tools will fail with KitConfigError.\n`,
    )
  }
  const transportMode = process.env.MCP_TRANSPORT ?? "http"
  if (transportMode === "stdio") {
    await startStdio()
  } else {
    await startHttp()
  }
}

main().catch((err) => {
  process.stderr.write(`[kit-mcp] fatal: ${err instanceof Error ? err.stack : String(err)}\n`)
  process.exit(1)
})
