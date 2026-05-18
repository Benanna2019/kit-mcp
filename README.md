# kit-mcp

MCP server for [Kit](https://kit.com) (ConvertKit). Gives any MCP client (Cowork, Claude Desktop, Cursor) tools to manage your Kit account — query subscribers, draft and schedule broadcasts, build sequences — all from a conversation.

## Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/Benanna2019/kit-mcp)

1. Click the button above
2. Set `KIT_API_KEY` to your Kit API key (get one at [app.kit.com/account/edit](https://app.kit.com/account/edit) → Developer → API)
3. Copy your Railway deployment URL (e.g. `https://kit-mcp-production.up.railway.app`)
4. Add it to your MCP client config (see below)

## Connect to Cowork / Claude Desktop

In your `claude_desktop_config.json` (or Cowork MCP settings):

```json
{
  "mcpServers": {
    "kit": {
      "url": "https://your-kit-mcp.up.railway.app/mcp"
    }
  }
}
```

Restart Cowork. The Kit tools will appear.

## Run locally (stdio)

```bash
cp .env.example .env
# Edit .env: set KIT_API_KEY and MCP_TRANSPORT=stdio
npm install
npm run build
node dist/server.js
```

Then add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kit": {
      "command": "node",
      "args": ["/absolute/path/to/kit-mcp/dist/server.js"],
      "env": { "KIT_API_KEY": "your_key_here", "MCP_TRANSPORT": "stdio" }
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `list_subscribers` | List subscribers with pagination |
| `get_subscriber` | Look up a subscriber by email |
| `create_subscriber` | Add or update a subscriber |
| `update_subscriber` | Update subscriber fields |
| `list_tags` | List all tags |
| `create_tag` | Create a new tag |
| `tag_subscriber` | Apply a tag to a subscriber |
| `remove_tag_from_subscriber` | Remove a tag from a subscriber |
| `list_broadcasts` | List recent broadcasts |
| `create_broadcast` | Draft or schedule a broadcast |
| `update_broadcast` | Edit a draft broadcast |
| `create_sequence` | Create a new sequence |
| `create_sequence_email` | Add an email to a sequence |
| `update_sequence_email` | Edit a sequence email |
| `add_subscriber_to_sequence` | Enroll a subscriber in a sequence |

## Stack

TypeScript · [Effect](https://effect.website) · [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) · Express · Kit REST API v4
