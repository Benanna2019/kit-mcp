#!/usr/bin/env node
import "./env.js" // must be first
import { randomUUID } from "node:crypto"
import type { IncomingMessage, ServerResponse } from "node:http"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js"
import express from "express"
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

  const sessions = new Map<string, StreamableHTTPServerTransport>()

  app.post("/mcp", async (req, res) => {
    process.stderr.write(`[kit-mcp] POST /mcp host=${req.headers.host} session=${req.headers["mcp-session-id"]} bodyType=${typeof req.body}\n`)
    try {
      const sessionId = req.headers["mcp-session-id"] as string | undefined
      let transport: StreamableHTTPServerTransport

      if (sessionId !== undefined && sessions.has(sessionId)) {
        transport = sessions.get(sessionId)!
      } else if (sessionId === undefined && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => { sessions.set(id, transport) },
        })
        transport.onclose = () => {
          const id = transport.sessionId
          if (id !== undefined) sessions.delete(id)
        }
        transport.onerror = (err) => {
          process.stderr.write(`[kit-mcp] transport onerror: ${err.stack ?? err.message}\n`)
        }
        const server = buildServer()
        // Cast: SDK's onclose getter returns `(() => void) | undefined` but Transport expects `?: () => void`
        // under exactOptionalPropertyTypes — structural mismatch in the SDK declaration, not a logic error
        await server.connect(transport as never)
      } else {
        res.status(400).json({ jsonrpc: "2.0", error: { code: -32000, message: "Bad Request: missing or invalid session" }, id: null })
        return
      }

      process.stderr.write(`[kit-mcp] calling handleRequest\n`)
      await transport.handleRequest(req as unknown as IncomingMessage, res as unknown as ServerResponse, req.body)
      process.stderr.write(`[kit-mcp] handleRequest returned, headersSent=${res.headersSent}\n`)
    } catch (err) {
      process.stderr.write(`[kit-mcp] /mcp POST error: ${err instanceof Error ? err.stack : String(err)}\n`)
      if (!res.headersSent) res.status(500).json({ error: "Internal server error" })
    }
  })

  app.get("/mcp", async (req, res) => {
    try {
      const sessionId = req.headers["mcp-session-id"] as string | undefined
      if (sessionId === undefined || !sessions.has(sessionId)) {
        res.status(400).json({ error: "No active session" })
        return
      }
      await sessions.get(sessionId)!.handleRequest(req as unknown as IncomingMessage, res as unknown as ServerResponse)
    } catch (err) {
      process.stderr.write(`[kit-mcp] /mcp GET error: ${err instanceof Error ? err.stack : String(err)}\n`)
    }
  })

  app.delete("/mcp", async (req, res) => {
    try {
      const sessionId = req.headers["mcp-session-id"] as string | undefined
      if (sessionId !== undefined && sessions.has(sessionId)) {
        await sessions.get(sessionId)!.handleRequest(req as unknown as IncomingMessage, res as unknown as ServerResponse)
      } else {
        res.status(404).json({ error: "Session not found" })
      }
    } catch (err) {
      process.stderr.write(`[kit-mcp] /mcp DELETE error: ${err instanceof Error ? err.stack : String(err)}\n`)
    }
  })

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
