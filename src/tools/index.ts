import { accountTools } from "./account.js"
import { broadcastTools } from "./broadcasts.js"
import { customFieldTools } from "./custom_fields.js"
import { formTools } from "./forms.js"
import { purchaseTools } from "./purchases.js"
import { segmentTools } from "./segments.js"
import { sequenceTools } from "./sequences.js"
import { subscriberTools } from "./subscribers.js"
import { tagTools } from "./tags.js"
import { webhookTools } from "./webhooks.js"
import type { ToolEntry } from "./shared.js"

export type { ToolEntry }

export const allTools: ReadonlyArray<ToolEntry> = [
  ...accountTools,
  ...broadcastTools,
  ...customFieldTools,
  ...formTools,
  ...purchaseTools,
  ...segmentTools,
  ...sequenceTools,
  ...subscriberTools,
  ...tagTools,
  ...webhookTools,
]
