# kit-mcp v2: Write Tools + Railway Deployment

**Date:** 2026-05-17
**Status:** Approved
**Scope:** Extend existing kit-mcp with write tools, dual transport (stdio/HTTP), Railway template

---

## Goal

Turn kit-mcp from a read-only personal tool into a Railway-deployable MCP server anyone can self-host with their own Kit API key. An agent connected via Cowork (or any MCP client) can author broadcasts, build sequences, and manage subscribers -- all from a conversation.

Secondary goal: a clean public artifact for the Kit/Nathan Barry conversation.

---

## Architecture

Extend `personal-apps/kit-mcp` in place. No new repo. The Effect service layer (`Kit.ts`, `runtime.ts`) is solid and stays -- we add write methods to the existing service. `server.ts` gains transport switching. Tools are reorganized from a single file into a `src/tools/` directory by domain.

### Transport switching

`server.ts` reads `MCP_TRANSPORT` at startup:

- `MCP_TRANSPORT=http` (Railway default): Express server + `StreamableHTTPServerTransport` on `$PORT`
- `MCP_TRANSPORT=stdio` (local dev default): existing `StdioServerTransport` behavior

No other code changes for transport. The tool layer is transport-agnostic.

---

## Tools

### Existing (5 read tools, unchanged)
- `list_subscribers`
- `get_subscriber`
- `list_tags`
- `tag_subscriber`
- `list_broadcasts`

### New write tools (10)

**Broadcasts (2)**
- `create_broadcast` -- draft or schedule a broadcast; accepts subject, content, subscriber_filter, send_at
- `update_broadcast` -- edit a draft broadcast; accepts broadcast_id plus any fields to change

**Sequences (4)**
- `create_sequence` -- create an empty sequence container; accepts name
- `create_sequence_email` -- add an email to a sequence; accepts sequence_id, subject, content, delay_in_days, position
- `update_sequence_email` -- edit a sequence email; accepts sequence_email_id plus any fields to change
- `add_subscriber_to_sequence` -- enroll a subscriber; accepts subscriber_id, sequence_id

**Subscribers (2)**
- `create_subscriber` -- upsert a subscriber; accepts email, first_name, custom fields
- `update_subscriber` -- update subscriber info; accepts subscriber_id plus fields to change

**Tags (2)**
- `create_tag` -- create a new tag; accepts name
- `remove_tag_from_subscriber` -- untag a subscriber; accepts subscriber_id, tag_id

**Total: 15 tools**

### Deferred to v2
Delete operations, bulk operations, webhooks (Inngest integration), custom fields, snippets, form enrollment.

---

## Project Structure

```
src/
├── server.ts          transport switching (stdio vs HTTP)
├── env.ts             dotenv loader (unchanged)
├── Kit.ts             Effect service + all API methods (read + write)
├── runtime.ts         layer composition (unchanged)
└── tools/
    ├── index.ts       re-exports allTools array
    ├── broadcasts.ts  create_broadcast, update_broadcast
    ├── sequences.ts   create_sequence, create_sequence_email, update_sequence_email, add_subscriber_to_sequence
    ├── subscribers.ts create_subscriber, update_subscriber, list_subscribers, get_subscriber
    └── tags.ts        list_tags, create_tag, tag_subscriber, remove_tag_from_subscriber
```

`list_broadcasts` moves into `broadcasts.ts` for consistency.

---

## Railway Deployment

### Files added
- `railway.json` -- build command (`npm run build`), start command (`npm start`), healthcheck
- `.env.example` -- updated with `KIT_API_KEY`, `MCP_TRANSPORT=http`, `PORT=3000`
- `README.md` -- one-click Railway deploy button, setup steps, Cowork config snippet

### Required env var
- `KIT_API_KEY` -- user's Kit API key (the only required input)

### Defaults
- `MCP_TRANSPORT` defaults to `http` when unset (Railway never sets it; local devs set `MCP_TRANSPORT=stdio` in `.env` to use the stdio path)
- `PORT` is injected by Railway automatically; defaults to `3000` locally

### User setup flow
1. Click deploy to Railway
2. Set `KIT_API_KEY` in Railway environment
3. Copy the Railway URL into Cowork MCP config as `{ "url": "https://your-kit-mcp.up.railway.app/mcp" }`
4. Restart Cowork -- Kit tools appear

---

## What this is NOT

- Not multi-tenant. One API key per deployment.
- No OAuth (v2 concern).
- No Inngest integration (v2 concern).
- No UI. MCP tools only.

---

## Error handling

All write tools follow the same pattern as existing read tools: Effect-tagged errors (`KitConfigError`, `KitRequestError`, `KitNetworkError`), formatted as human-readable MCP error responses. No raw throws.

---

## Testing

Manual: build locally in stdio mode, connect to Cowork, exercise each tool. No automated tests added in v1 -- the Effect service layer validates types at compile time and the MCP SDK validates input schemas at runtime.
