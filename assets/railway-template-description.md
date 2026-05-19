# Deploy and Host Kit MCP Server on Railway

Kit MCP Server is an open-source MCP server that connects your Kit (ConvertKit) account to any AI assistant. Give Claude or another MCP client the ability to manage subscribers, draft broadcasts, and build sequences without leaving the conversation.

## About Hosting Kit MCP Server

Hosting Kit MCP Server on Railway gives you a persistent, always-on endpoint your AI clients can connect to. You bring your Kit API key, Railway handles the rest. The server runs as a Node.js process, listens for MCP connections over HTTP, and routes tool calls directly to the Kit REST API. No database, no queue, no background workers. One service, one env var, and you have a personal Kit automation layer that any MCP-compatible client can talk to.

## Common Use Cases

- Draft and schedule email broadcasts from a conversation
- Query and update subscriber records without opening the Kit dashboard
- Build out sequence emails by describing what you want to an AI agent

## Dependencies for Kit MCP Server Hosting

- A Kit account with an API key
- An MCP-compatible client (Claude Desktop, Cowork, Cursor, etc.)

### Deployment Dependencies

- [Kit API documentation](https://developers.kit.com/docs)
- [Model Context Protocol specification](https://modelcontextprotocol.io)
- [mcp-remote](https://www.npmjs.com/package/mcp-remote) (required for Claude Desktop users to connect to a remote MCP server)

### Implementation Details

Connect Claude Desktop using `mcp-remote`:

```json
{
  "mcpServers": {
    "kit": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://your-deployment.up.railway.app/mcp"]
    }
  }
}
```

Connect Cowork or Claude Code using the native URL format:

```json
{
  "mcpServers": {
    "kit": {
      "url": "https://your-deployment.up.railway.app/mcp"
    }
  }
}
```

## Why Deploy Kit MCP Server on Railway?

Railway is a singular platform to deploy your infrastructure stack. Railway will host your infrastructure so you don't have to deal with configuration, while allowing you to vertically and horizontally scale it.

By deploying Kit MCP Server on Railway, you are one step closer to supporting a complete full-stack application with minimal burden. Host your servers, databases, AI agents, and more on Railway.
