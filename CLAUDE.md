# kit-mcp

An MCP server exposing Kit (ConvertKit) as tools for Cowork and other Claude clients. Built with Effect for service composition, layered configuration, schema-validated I/O, and tagged-error handling.

## What this is

The Kit API, wrapped as Effect services and surfaced as MCP tools. A Cowork user (or any MCP client) can manage their Kit account from a chat conversation: query subscribers, draft and send broadcasts, run sequences, tag and segment.

Phase one (this package): a stdio MCP server that runs locally, reads a `KIT_API_KEY` from `.env`, exposes ten or so tools.

Phase two (later, hosted): same Effect services, swapped behind an HTTP transport with Kit OAuth on top so non-technical users can connect via a hosted URL without ever touching an API key.

## Stack

- TypeScript, NodeNext modules
- Effect for everything that isn't the MCP SDK
- `@modelcontextprotocol/sdk` for the MCP transport
- `dotenv` for local-dev env loading
- `@effect/language-service` for build-time Effect diagnostics

## Run

```bash
cp .env.example .env  # add KIT_API_KEY
npm install
npm run build
node dist/server.js
```

## Project structure

```
src/
├── server.ts            MCP server entry, wires McpServer to the tool layer
├── env.ts               dotenv loader (must be imported first in entry points)
├── KitClient.ts         Effect service: Kit API HTTP client + tagged errors
├── KitConfig.ts         Effect Config: reads KIT_API_KEY from env
├── tools/               one file per tool, each builds on KitClient
└── runtime.ts           composes the Layers and runs the Effect program
```

## Conventions

- Every external call is wrapped in Effect. No raw `await fetch`. Use `KitClient` methods.
- Errors are `Schema.TaggedError`. Catch and pattern-match, don't `try/catch`.
- Configuration is read via `Effect.Config`, not `process.env` directly (except in `env.ts`).
- Tools return `Effect<MCPToolResult, KitError | ConfigError>`. The server layer translates errors to MCP error responses.

<!-- effect-solutions:start -->

## Effect Best Practices

**IMPORTANT:** Always consult effect-solutions before writing Effect code.

1. Run `effect-solutions list` to see available guides
2. Run `effect-solutions show <topic>...` for relevant patterns (supports multiple topics)
3. Search `~/.local/share/effect-solutions/effect` for real implementations

Topics: quick-start, project-setup, tsconfig, basics, services-and-layers, data-modeling, error-handling, config, testing, cli.

Never guess at Effect patterns - check the guide first.

<!-- effect-solutions:end -->

## Local Effect Source

The Effect v4 repository is cloned to `~/.local/share/effect-solutions/effect`. Use it to explore APIs, find usage examples, and understand implementation details when documentation isn't enough.
