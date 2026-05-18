#!/usr/bin/env node
import "./env.js" // must be first: populates process.env before Effect.Config reads it
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import type { ZodRawShape } from "zod"
import { allTools } from "./tools/index.js"

const server = new McpServer({ name: "kit-mcp", version: "0.0.1" })

for (const tool of allTools) {
  server.registerTool(
    tool.name,
    {
      description: tool.description,
      inputSchema: tool.inputSchema.shape as ZodRawShape,
    },
    async (args: unknown) => tool.run(args as never),
  )
}

async function main(): Promise<void> {
  process.stderr.write(`[kit-mcp] starting kit-mcp ${process.env.npm_package_version ?? ""}\n`)
  if (!process.env.KIT_API_KEY) {
    process.stderr.write(
      `[kit-mcp] WARNING: KIT_API_KEY not set. Tools will fail with KitConfigError.\n`,
    )
  }
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => {
  process.stderr.write(`[kit-mcp] fatal: ${err instanceof Error ? err.stack : String(err)}\n`)
  process.exit(1)
})
