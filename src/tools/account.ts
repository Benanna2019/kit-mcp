import { Effect } from "effect"
import { z } from "zod"
import { Kit } from "../Kit.js"
import { erase, runTool, type ToolEntry } from "./shared.js"

const getAccount = erase({
  name: "get_account",
  description: "Get basic information about the connected Kit account.",
  inputSchema: z.object({}),
  run: () =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.getAccount()
      }),
      (a) =>
        [
          `Account: ${a.name}`,
          `  email: ${a.primary_email_address}`,
          `  plan:  ${a.plan_type ?? "(unknown)"}`,
        ].join("\n"),
    ),
})

const getEmailStats = erase({
  name: "get_email_stats",
  description: "Get aggregate email stats for the account: sent, opened, clicked, unsubscribed.",
  inputSchema: z.object({}),
  run: () =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.getEmailStats()
      }),
      (result) => {
        const s = result.stats
        return [
          "Email stats:",
          `  sent:         ${s.sent}`,
          `  opened:       ${s.opened}`,
          `  clicked:      ${s.clicked}`,
          `  unsubscribed: ${s.unsubscribed}`,
        ].join("\n")
      },
    ),
})

const getGrowthStats = erase({
  name: "get_growth_stats",
  description: "Get subscriber growth stats for the account.",
  inputSchema: z.object({}),
  run: () =>
    runTool(
      Effect.gen(function* () {
        const kit = yield* Kit
        return yield* kit.getGrowthStats()
      }),
      (result) => {
        const s = result.stats
        return [
          "Growth stats:",
          `  subscribers:         ${s.subscribers}`,
          `  new_subscribers:     ${s.new_subscribers}`,
          `  net_new_subscribers: ${s.net_new_subscribers}`,
          `  cancellations:       ${s.cancellations}`,
          `  churn:               ${s.churn}`,
        ].join("\n")
      },
    ),
})

export const accountTools: ReadonlyArray<ToolEntry> = [getAccount, getEmailStats, getGrowthStats]
