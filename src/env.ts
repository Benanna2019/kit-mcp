/**
 * Load `.env` from the package root before any other module reads
 * `process.env`. Import this first in any entry point.
 *
 * `quiet: true` is essential — dotenv's banner goes to stdout, which would
 * corrupt the MCP JSON protocol on the stdio transport.
 */
import { config as loadEnv } from "dotenv"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
loadEnv({ path: resolve(PACKAGE_ROOT, ".env"), quiet: true })
