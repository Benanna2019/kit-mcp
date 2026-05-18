import { broadcastTools } from "./broadcasts.js"
import { sequenceTools } from "./sequences.js"
import { subscriberTools } from "./subscribers.js"
import { tagTools } from "./tags.js"
import type { ToolEntry } from "./shared.js"

export type { ToolEntry }

export const allTools: ReadonlyArray<ToolEntry> = [
  ...broadcastTools,
  ...subscriberTools,
  ...tagTools,
  ...sequenceTools,
]
