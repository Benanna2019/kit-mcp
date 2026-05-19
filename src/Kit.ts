import { Context, Effect, Layer, Redacted, Schema } from "effect"
import { Config } from "effect"

/**
 * Kit API client as an Effect service. Wraps the v4 REST API with
 * tagged errors and request scaffolding. Each method returns an
 * Effect that yields parsed JSON or a Kit error.
 *
 * Phase one keeps this thin: just enough to power the initial MCP tool set.
 * Phase two will swap the underlying transport for OAuth-issued tokens
 * routed per user.
 */

// ────────────────────── Errors ──────────────────────

export class KitConfigError extends Schema.TaggedError<KitConfigError>()(
  "KitConfigError",
  {
    message: Schema.String,
  },
) {}

export class KitRequestError extends Schema.TaggedError<KitRequestError>()(
  "KitRequestError",
  {
    method: Schema.String,
    path: Schema.String,
    status: Schema.Number,
    body: Schema.String,
  },
) {}

export class KitNetworkError extends Schema.TaggedError<KitNetworkError>()(
  "KitNetworkError",
  {
    method: Schema.String,
    path: Schema.String,
    reason: Schema.String,
  },
) {}

export const KitError = Schema.Union(KitConfigError, KitRequestError, KitNetworkError)
export type KitError = typeof KitError.Type

// ────────────────────── Domain models ──────────────────────

export class Subscriber extends Schema.Class<Subscriber>("Subscriber")({
  id: Schema.Number,
  first_name: Schema.NullOr(Schema.String),
  email_address: Schema.String,
  state: Schema.String, // "active" | "bounced" | "cancelled" | "complained" | "inactive"
  created_at: Schema.String,
  fields: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
}) {}

export class Tag extends Schema.Class<Tag>("Tag")({
  id: Schema.Number,
  name: Schema.String,
  created_at: Schema.String,
}) {}

export class Broadcast extends Schema.Class<Broadcast>("Broadcast")({
  id: Schema.Number,
  subject: Schema.NullOr(Schema.String),
  preview_text: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
  content: Schema.NullOr(Schema.String),
  created_at: Schema.String,
  published_at: Schema.NullOr(Schema.String),
  send_at: Schema.NullOr(Schema.String),
  thumbnail_alt: Schema.NullOr(Schema.String),
  thumbnail_url: Schema.NullOr(Schema.String),
  email_address: Schema.NullOr(Schema.String),
  email_template: Schema.optional(
    Schema.NullOr(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  ),
  publication_id: Schema.optional(Schema.NullOr(Schema.Number)),
}) {}

export class Sequence extends Schema.Class<Sequence>("Sequence")({
  id: Schema.Number,
  name: Schema.String,
  created_at: Schema.String,
}) {}

export class SequenceEmail extends Schema.Class<SequenceEmail>("SequenceEmail")({
  id: Schema.Number,
  sequence_id: Schema.Number,
  subject: Schema.NullOr(Schema.String),
  content: Schema.NullOr(Schema.String),
  delay_in_days: Schema.Number,
  position: Schema.Number,
  created_at: Schema.String,
}) {}

export class Form extends Schema.Class<Form>("Form")({
  id: Schema.Number,
  name: Schema.String,
  created_at: Schema.String,
  type: Schema.optional(Schema.String),
  format: Schema.optional(Schema.NullOr(Schema.String)),
  embed_js: Schema.optional(Schema.NullOr(Schema.String)),
  embed_url: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

export class CustomField extends Schema.Class<CustomField>("CustomField")({
  id: Schema.Number,
  name: Schema.String,
  key: Schema.String,
  label: Schema.String,
}) {}

export class Webhook extends Schema.Class<Webhook>("Webhook")({
  id: Schema.Number,
  account_id: Schema.Number,
  event: Schema.Unknown,
  target_url: Schema.String,
}) {}

export class Account extends Schema.Class<Account>("Account")({
  name: Schema.String,
  primary_email_address: Schema.String,
  plan_type: Schema.optional(Schema.String),
}) {}

export class EmailStats extends Schema.Class<EmailStats>("EmailStats")({
  sent: Schema.Number,
  clicked: Schema.Number,
  opened: Schema.Number,
  unsubscribed: Schema.Number,
}) {}

export class GrowthStats extends Schema.Class<GrowthStats>("GrowthStats")({
  cancellations: Schema.Number,
  net_new_subscribers: Schema.Number,
  new_subscribers: Schema.Number,
  subscribers: Schema.Number,
  churn: Schema.Number,
}) {}

export class Segment extends Schema.Class<Segment>("Segment")({
  id: Schema.Number,
  name: Schema.String,
  created_at: Schema.String,
}) {}

export class Purchase extends Schema.Class<Purchase>("Purchase")({
  id: Schema.Number,
  subscriber_id: Schema.NullOr(Schema.Number),
  status: Schema.String,
  currency: Schema.String,
  subtotal: Schema.Number,
  total: Schema.Number,
  transaction_id: Schema.String,
  transaction_time: Schema.String,
  products: Schema.optional(Schema.Unknown),
}) {}

const Pagination = Schema.Struct({
  has_previous_page: Schema.Boolean,
  has_next_page: Schema.Boolean,
  start_cursor: Schema.NullOr(Schema.String),
  end_cursor: Schema.NullOr(Schema.String),
  per_page: Schema.Number,
})

const SubscribersResponse = Schema.Struct({
  subscribers: Schema.Array(Subscriber),
  pagination: Pagination,
})

const TagsResponse = Schema.Struct({
  tags: Schema.Array(Tag),
})

const BroadcastsResponse = Schema.Struct({
  broadcasts: Schema.Array(Broadcast),
  pagination: Pagination,
})

const BroadcastResponse = Schema.Struct({ broadcast: Broadcast })
const SequenceResponse = Schema.Struct({ sequence: Sequence })
const SequenceEmailResponse = Schema.Struct({ sequence_email: SequenceEmail })
const SubscriberResponse = Schema.Struct({ subscriber: Subscriber })
const TagResponse = Schema.Struct({ tag: Tag })

const SubscriberStatsResponse = Schema.Struct({
  subscriber: Subscriber,
  stats: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
})

const FormsResponse = Schema.Struct({
  forms: Schema.Array(Form),
})

const CustomFieldsResponse = Schema.Struct({
  custom_fields: Schema.Array(CustomField),
})

const CustomFieldResponse = Schema.Struct({ custom_field: CustomField })

const WebhooksResponse = Schema.Struct({
  webhooks: Schema.Array(Webhook),
})

const WebhookResponse = Schema.Struct({ webhook: Webhook })

const AccountResponse = Schema.Struct({ account: Account })

const EmailStatsResponse = Schema.Struct({
  stats: EmailStats,
})

const GrowthStatsResponse = Schema.Struct({
  stats: GrowthStats,
})

const SegmentsResponse = Schema.Struct({
  segments: Schema.Array(Segment),
})

const PurchasesResponse = Schema.Struct({
  purchases: Schema.Array(Purchase),
  pagination: Pagination,
})

const PurchaseResponse = Schema.Struct({ purchase: Purchase })

const SequencesResponse = Schema.Struct({
  sequences: Schema.Array(Sequence),
  pagination: Pagination,
})

const SequenceEmailsResponse = Schema.Struct({
  sequence_emails: Schema.Array(SequenceEmail),
})

const BroadcastStatsResponse = Schema.Struct({
  broadcast: Broadcast,
  stats: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
})

// ────────────────────── Service ──────────────────────

export class Kit extends Context.Tag("@kit-mcp/Kit")<
  Kit,
  {
    readonly listSubscribers: (params?: {
      readonly per_page?: number
      readonly after?: string
      readonly email_address?: string
    }) => Effect.Effect<typeof SubscribersResponse.Type, KitError>
    readonly getSubscriberByEmail: (
      email: string,
    ) => Effect.Effect<Subscriber | null, KitError>
    readonly listTags: () => Effect.Effect<typeof TagsResponse.Type, KitError>
    readonly tagSubscriber: (
      subscriberId: number,
      tagId: number,
    ) => Effect.Effect<void, KitError>
    readonly listBroadcasts: (params?: {
      readonly per_page?: number
    }) => Effect.Effect<typeof BroadcastsResponse.Type, KitError>
    readonly createBroadcast: (params: {
      readonly subject: string
      readonly content?: string
      readonly description?: string
      readonly send_at?: string
      readonly preview_text?: string
    }) => Effect.Effect<Broadcast, KitError>
    readonly updateBroadcast: (
      id: number,
      params: {
        readonly subject?: string
        readonly content?: string
        readonly send_at?: string
        readonly preview_text?: string
      },
    ) => Effect.Effect<Broadcast, KitError>
    readonly createSequence: (name: string) => Effect.Effect<Sequence, KitError>
    readonly createSequenceEmail: (
      sequenceId: number,
      params: {
        readonly subject?: string
        readonly content?: string
        readonly delay_in_days?: number
        readonly position?: number
      },
    ) => Effect.Effect<SequenceEmail, KitError>
    readonly updateSequenceEmail: (
      id: number,
      params: {
        readonly subject?: string
        readonly content?: string
        readonly delay_in_days?: number
      },
    ) => Effect.Effect<SequenceEmail, KitError>
    readonly addSubscriberToSequence: (
      sequenceId: number,
      subscriberId: number,
    ) => Effect.Effect<void, KitError>
    readonly createSubscriber: (params: {
      readonly email_address: string
      readonly first_name?: string
      readonly last_name?: string
      readonly fields?: Record<string, string>
    }) => Effect.Effect<Subscriber, KitError>
    readonly updateSubscriber: (
      id: number,
      params: {
        readonly first_name?: string
        readonly last_name?: string
        readonly email_address?: string
        readonly fields?: Record<string, string>
      },
    ) => Effect.Effect<Subscriber, KitError>
    readonly createTag: (name: string) => Effect.Effect<Tag, KitError>
    readonly removeTagFromSubscriber: (
      tagId: number,
      subscriberId: number,
    ) => Effect.Effect<void, KitError>
    // Subscriber extensions
    readonly unsubscribeSubscriber: (id: number) => Effect.Effect<Subscriber, KitError>
    readonly getSubscriberStats: (subscriberId: number) => Effect.Effect<typeof SubscriberStatsResponse.Type, KitError>
    readonly listSubscriberTags: (subscriberId: number) => Effect.Effect<typeof TagsResponse.Type, KitError>
    // Broadcast extensions
    readonly getBroadcast: (id: number) => Effect.Effect<Broadcast, KitError>
    readonly deleteBroadcast: (id: number) => Effect.Effect<void, KitError>
    readonly getBroadcastStats: (id: number) => Effect.Effect<typeof BroadcastStatsResponse.Type, KitError>
    // Sequence extensions
    readonly listSequences: (params?: { per_page?: number; after?: string }) => Effect.Effect<typeof SequencesResponse.Type, KitError>
    readonly getSequence: (id: number) => Effect.Effect<Sequence, KitError>
    readonly updateSequence: (id: number, name: string) => Effect.Effect<Sequence, KitError>
    readonly deleteSequence: (id: number) => Effect.Effect<void, KitError>
    readonly listSequenceEmails: (sequenceId: number) => Effect.Effect<typeof SequenceEmailsResponse.Type, KitError>
    readonly listSequenceSubscribers: (sequenceId: number, params?: { per_page?: number; after?: string }) => Effect.Effect<typeof SubscribersResponse.Type, KitError>
    // Tag extensions
    readonly updateTag: (id: number, name: string) => Effect.Effect<Tag, KitError>
    readonly listSubscribersForTag: (tagId: number, params?: { per_page?: number; after?: string }) => Effect.Effect<typeof SubscribersResponse.Type, KitError>
    // Forms
    readonly listForms: () => Effect.Effect<typeof FormsResponse.Type, KitError>
    readonly listFormSubscribers: (formId: number, params?: { per_page?: number; after?: string }) => Effect.Effect<typeof SubscribersResponse.Type, KitError>
    readonly addSubscriberToForm: (formId: number, subscriberId: number) => Effect.Effect<void, KitError>
    readonly addSubscriberToFormByEmail: (formId: number, email: string) => Effect.Effect<void, KitError>
    // Custom fields
    readonly listCustomFields: () => Effect.Effect<typeof CustomFieldsResponse.Type, KitError>
    readonly createCustomField: (label: string) => Effect.Effect<CustomField, KitError>
    readonly updateCustomField: (id: number, label: string) => Effect.Effect<CustomField, KitError>
    readonly deleteCustomField: (id: number) => Effect.Effect<void, KitError>
    // Webhooks
    readonly listWebhooks: () => Effect.Effect<typeof WebhooksResponse.Type, KitError>
    readonly createWebhook: (params: { event: { name: string; subscriber_filter?: string }; target_url: string }) => Effect.Effect<Webhook, KitError>
    readonly deleteWebhook: (id: number) => Effect.Effect<void, KitError>
    // Account
    readonly getAccount: () => Effect.Effect<Account, KitError>
    readonly getEmailStats: () => Effect.Effect<typeof EmailStatsResponse.Type, KitError>
    readonly getGrowthStats: () => Effect.Effect<typeof GrowthStatsResponse.Type, KitError>
    // Segments
    readonly listSegments: () => Effect.Effect<typeof SegmentsResponse.Type, KitError>
    // Purchases
    readonly listPurchases: (params?: { per_page?: number; after?: string }) => Effect.Effect<typeof PurchasesResponse.Type, KitError>
    readonly getPurchase: (id: number) => Effect.Effect<Purchase, KitError>
    readonly createPurchase: (params: Record<string, unknown>) => Effect.Effect<Purchase, KitError>
  }
>() {
  static readonly layer: Layer.Layer<Kit, KitConfigError> = Layer.effect(
    Kit,
    Effect.gen(function* () {
      const apiKeyRedacted = yield* Config.redacted("KIT_API_KEY").pipe(
        Effect.catchAll(() =>
          new KitConfigError({
            message:
              "KIT_API_KEY is not set. Add it to .env or pass it through the MCP server config.",
          }),
        ),
      )
      const apiKey = Redacted.value(apiKeyRedacted)

      const baseUrl = "https://api.kit.com/v4"

      const request = Effect.fn("Kit.request")(function* (
        method: "GET" | "POST" | "PUT" | "DELETE",
        path: string,
        body?: Record<string, unknown>,
      ) {
        const url = `${baseUrl}${path}`
        const init: RequestInit = {
          method,
          headers: {
            "Content-Type": "application/json",
            "X-Kit-Api-Key": apiKey,
          },
        }
        if (body !== undefined) init.body = JSON.stringify(body)
        const response = yield* Effect.tryPromise({
          try: () => fetch(url, init),
          catch: (cause) =>
            new KitNetworkError({
              method,
              path,
              reason: cause instanceof Error ? cause.message : String(cause),
            }),
        })

        if (!response.ok) {
          const text = yield* Effect.promise(() => response.text().catch(() => ""))
          return yield* new KitRequestError({
            method,
            path,
            status: response.status,
            body: text.slice(0, 2000),
          })
        }

        // DELETE / 204 responses have no body
        if (response.status === 204) return null

        const json = yield* Effect.tryPromise({
          try: () => response.json() as Promise<unknown>,
          catch: (cause) =>
            new KitNetworkError({
              method,
              path,
              reason: `Failed to parse JSON: ${cause instanceof Error ? cause.message : String(cause)}`,
            }),
        })
        return json
      })

      const decode = <A, I>(schema: Schema.Schema<A, I>, value: unknown, ctx: string) =>
        Schema.decodeUnknown(schema)(value).pipe(
          Effect.mapError(
            (e) =>
              new KitNetworkError({
                method: "DECODE",
                path: ctx,
                reason: e.message,
              }),
          ),
        )

      const listSubscribers = Effect.fn("Kit.listSubscribers")(function* (
        params?: { per_page?: number; after?: string; email_address?: string },
      ) {
        const qs = new URLSearchParams()
        if (params?.per_page) qs.set("per_page", String(params.per_page))
        if (params?.after) qs.set("after", params.after)
        if (params?.email_address) qs.set("email_address", params.email_address)
        const path = `/subscribers${qs.toString() ? `?${qs}` : ""}`
        const raw = yield* request("GET", path)
        return yield* decode(SubscribersResponse, raw, path)
      })

      const getSubscriberByEmail = Effect.fn("Kit.getSubscriberByEmail")(function* (
        email: string,
      ) {
        const result = yield* listSubscribers({ email_address: email, per_page: 1 })
        return result.subscribers[0] ?? null
      })

      const listTags = Effect.fn("Kit.listTags")(function* () {
        const raw = yield* request("GET", "/tags")
        return yield* decode(TagsResponse, raw, "/tags")
      })

      const tagSubscriber = Effect.fn("Kit.tagSubscriber")(function* (
        subscriberId: number,
        tagId: number,
      ) {
        // Kit's v4 endpoint to tag a subscriber:
        //   POST /tags/:tag_id/subscribers/:subscriber_id
        const path = `/tags/${tagId}/subscribers/${subscriberId}`
        yield* request("POST", path)
      })

      const listBroadcasts = Effect.fn("Kit.listBroadcasts")(function* (
        params?: { per_page?: number },
      ) {
        const qs = new URLSearchParams()
        if (params?.per_page) qs.set("per_page", String(params.per_page))
        const path = `/broadcasts${qs.toString() ? `?${qs}` : ""}`
        const raw = yield* request("GET", path)
        return yield* decode(BroadcastsResponse, raw, path)
      })

      const createBroadcast = Effect.fn("Kit.createBroadcast")(function* (params: {
        subject: string
        content?: string
        description?: string
        send_at?: string
        preview_text?: string
      }) {
        const body: Record<string, unknown> = { subject: params.subject }
        if (params.content !== undefined) body.content = params.content
        if (params.description !== undefined) body.description = params.description
        if (params.send_at !== undefined) body.send_at = params.send_at
        if (params.preview_text !== undefined) body.preview_text = params.preview_text
        const raw = yield* request("POST", "/broadcasts", body)
        const result = yield* decode(BroadcastResponse, raw, "/broadcasts")
        return result.broadcast
      })

      const updateBroadcast = Effect.fn("Kit.updateBroadcast")(function* (
        id: number,
        params: { subject?: string; content?: string; send_at?: string; preview_text?: string },
      ) {
        const body: Record<string, unknown> = {}
        if (params.subject !== undefined) body.subject = params.subject
        if (params.content !== undefined) body.content = params.content
        if (params.send_at !== undefined) body.send_at = params.send_at
        if (params.preview_text !== undefined) body.preview_text = params.preview_text
        const path = `/broadcasts/${id}`
        const raw = yield* request("PUT", path, body)
        const result = yield* decode(BroadcastResponse, raw, path)
        return result.broadcast
      })

      const createSequence = Effect.fn("Kit.createSequence")(function* (name: string) {
        const raw = yield* request("POST", "/sequences", { name })
        const result = yield* decode(SequenceResponse, raw, "/sequences")
        return result.sequence
      })

      const createSequenceEmail = Effect.fn("Kit.createSequenceEmail")(function* (
        sequenceId: number,
        params: { subject?: string; content?: string; delay_in_days?: number; position?: number },
      ) {
        const body: Record<string, unknown> = {}
        if (params.subject !== undefined) body.subject = params.subject
        if (params.content !== undefined) body.content = params.content
        if (params.delay_in_days !== undefined) body.delay_in_days = params.delay_in_days
        if (params.position !== undefined) body.position = params.position
        const path = `/sequences/${sequenceId}/emails`
        const raw = yield* request("POST", path, body)
        const result = yield* decode(SequenceEmailResponse, raw, path)
        return result.sequence_email
      })

      const updateSequenceEmail = Effect.fn("Kit.updateSequenceEmail")(function* (
        id: number,
        params: { subject?: string; content?: string; delay_in_days?: number },
      ) {
        const body: Record<string, unknown> = {}
        if (params.subject !== undefined) body.subject = params.subject
        if (params.content !== undefined) body.content = params.content
        if (params.delay_in_days !== undefined) body.delay_in_days = params.delay_in_days
        const path = `/sequence_emails/${id}`
        const raw = yield* request("PUT", path, body)
        const result = yield* decode(SequenceEmailResponse, raw, path)
        return result.sequence_email
      })

      const addSubscriberToSequence = Effect.fn("Kit.addSubscriberToSequence")(function* (
        sequenceId: number,
        subscriberId: number,
      ) {
        const path = `/sequences/${sequenceId}/subscribers`
        yield* request("POST", path, { subscriber_id: subscriberId })
      })

      const createSubscriber = Effect.fn("Kit.createSubscriber")(function* (params: {
        email_address: string
        first_name?: string
        last_name?: string
        fields?: Record<string, string>
      }) {
        const body: Record<string, unknown> = { email_address: params.email_address }
        if (params.first_name !== undefined) body.first_name = params.first_name
        if (params.last_name !== undefined) body.last_name = params.last_name
        if (params.fields !== undefined) body.fields = params.fields
        const raw = yield* request("POST", "/subscribers", body)
        const result = yield* decode(SubscriberResponse, raw, "/subscribers")
        return result.subscriber
      })

      const updateSubscriber = Effect.fn("Kit.updateSubscriber")(function* (
        id: number,
        params: {
          first_name?: string
          last_name?: string
          email_address?: string
          fields?: Record<string, string>
        },
      ) {
        const body: Record<string, unknown> = {}
        if (params.first_name !== undefined) body.first_name = params.first_name
        if (params.last_name !== undefined) body.last_name = params.last_name
        if (params.email_address !== undefined) body.email_address = params.email_address
        if (params.fields !== undefined) body.fields = params.fields
        const path = `/subscribers/${id}`
        const raw = yield* request("PUT", path, body)
        const result = yield* decode(SubscriberResponse, raw, path)
        return result.subscriber
      })

      const createTag = Effect.fn("Kit.createTag")(function* (name: string) {
        const raw = yield* request("POST", "/tags", { name })
        const result = yield* decode(TagResponse, raw, "/tags")
        return result.tag
      })

      const removeTagFromSubscriber = Effect.fn("Kit.removeTagFromSubscriber")(function* (
        tagId: number,
        subscriberId: number,
      ) {
        const path = `/tags/${tagId}/subscribers/${subscriberId}`
        yield* request("DELETE", path)
      })

      // ── Subscriber extensions ──

      const unsubscribeSubscriber = Effect.fn("Kit.unsubscribeSubscriber")(function* (
        id: number,
      ) {
        const path = `/subscribers/${id}/unsubscribe`
        const raw = yield* request("POST", path)
        const result = yield* decode(SubscriberResponse, raw, path)
        return result.subscriber
      })

      const getSubscriberStats = Effect.fn("Kit.getSubscriberStats")(function* (
        subscriberId: number,
      ) {
        const path = `/subscribers/${subscriberId}/stats`
        const raw = yield* request("GET", path)
        return yield* decode(SubscriberStatsResponse, raw, path)
      })

      const listSubscriberTags = Effect.fn("Kit.listSubscriberTags")(function* (
        subscriberId: number,
      ) {
        const path = `/subscribers/${subscriberId}/tags`
        const raw = yield* request("GET", path)
        return yield* decode(TagsResponse, raw, path)
      })

      // ── Broadcast extensions ──

      const getBroadcast = Effect.fn("Kit.getBroadcast")(function* (id: number) {
        const path = `/broadcasts/${id}`
        const raw = yield* request("GET", path)
        const result = yield* decode(BroadcastResponse, raw, path)
        return result.broadcast
      })

      const deleteBroadcast = Effect.fn("Kit.deleteBroadcast")(function* (id: number) {
        const path = `/broadcasts/${id}`
        yield* request("DELETE", path)
      })

      const getBroadcastStats = Effect.fn("Kit.getBroadcastStats")(function* (id: number) {
        const path = `/broadcasts/${id}/stats`
        const raw = yield* request("GET", path)
        return yield* decode(BroadcastStatsResponse, raw, path)
      })

      // ── Sequence extensions ──

      const listSequences = Effect.fn("Kit.listSequences")(function* (
        params?: { per_page?: number; after?: string },
      ) {
        const qs = new URLSearchParams()
        if (params?.per_page) qs.set("per_page", String(params.per_page))
        if (params?.after) qs.set("after", params.after)
        const path = `/sequences${qs.toString() ? `?${qs}` : ""}`
        const raw = yield* request("GET", path)
        return yield* decode(SequencesResponse, raw, path)
      })

      const getSequence = Effect.fn("Kit.getSequence")(function* (id: number) {
        const path = `/sequences/${id}`
        const raw = yield* request("GET", path)
        const result = yield* decode(SequenceResponse, raw, path)
        return result.sequence
      })

      const updateSequence = Effect.fn("Kit.updateSequence")(function* (
        id: number,
        name: string,
      ) {
        const path = `/sequences/${id}`
        const raw = yield* request("PUT", path, { name })
        const result = yield* decode(SequenceResponse, raw, path)
        return result.sequence
      })

      const deleteSequence = Effect.fn("Kit.deleteSequence")(function* (id: number) {
        const path = `/sequences/${id}`
        yield* request("DELETE", path)
      })

      const listSequenceEmails = Effect.fn("Kit.listSequenceEmails")(function* (
        sequenceId: number,
      ) {
        const path = `/sequences/${sequenceId}/emails`
        const raw = yield* request("GET", path)
        return yield* decode(SequenceEmailsResponse, raw, path)
      })

      const listSequenceSubscribers = Effect.fn("Kit.listSequenceSubscribers")(function* (
        sequenceId: number,
        params?: { per_page?: number; after?: string },
      ) {
        const qs = new URLSearchParams()
        if (params?.per_page) qs.set("per_page", String(params.per_page))
        if (params?.after) qs.set("after", params.after)
        const path = `/sequences/${sequenceId}/subscribers${qs.toString() ? `?${qs}` : ""}`
        const raw = yield* request("GET", path)
        return yield* decode(SubscribersResponse, raw, path)
      })

      // ── Tag extensions ──

      const updateTag = Effect.fn("Kit.updateTag")(function* (id: number, name: string) {
        const path = `/tags/${id}`
        const raw = yield* request("PUT", path, { name })
        const result = yield* decode(TagResponse, raw, path)
        return result.tag
      })

      const listSubscribersForTag = Effect.fn("Kit.listSubscribersForTag")(function* (
        tagId: number,
        params?: { per_page?: number; after?: string },
      ) {
        const qs = new URLSearchParams()
        if (params?.per_page) qs.set("per_page", String(params.per_page))
        if (params?.after) qs.set("after", params.after)
        const path = `/tags/${tagId}/subscribers${qs.toString() ? `?${qs}` : ""}`
        const raw = yield* request("GET", path)
        return yield* decode(SubscribersResponse, raw, path)
      })

      // ── Forms ──

      const listForms = Effect.fn("Kit.listForms")(function* () {
        const raw = yield* request("GET", "/forms")
        return yield* decode(FormsResponse, raw, "/forms")
      })

      const listFormSubscribers = Effect.fn("Kit.listFormSubscribers")(function* (
        formId: number,
        params?: { per_page?: number; after?: string },
      ) {
        const qs = new URLSearchParams()
        if (params?.per_page) qs.set("per_page", String(params.per_page))
        if (params?.after) qs.set("after", params.after)
        const path = `/forms/${formId}/subscribers${qs.toString() ? `?${qs}` : ""}`
        const raw = yield* request("GET", path)
        return yield* decode(SubscribersResponse, raw, path)
      })

      const addSubscriberToForm = Effect.fn("Kit.addSubscriberToForm")(function* (
        formId: number,
        subscriberId: number,
      ) {
        const path = `/forms/${formId}/subscribers/${subscriberId}`
        yield* request("POST", path)
      })

      const addSubscriberToFormByEmail = Effect.fn("Kit.addSubscriberToFormByEmail")(function* (
        formId: number,
        email: string,
      ) {
        const path = `/forms/${formId}/subscribers`
        yield* request("POST", path, { email_address: email })
      })

      // ── Custom fields ──

      const listCustomFields = Effect.fn("Kit.listCustomFields")(function* () {
        const raw = yield* request("GET", "/custom_fields")
        return yield* decode(CustomFieldsResponse, raw, "/custom_fields")
      })

      const createCustomField = Effect.fn("Kit.createCustomField")(function* (label: string) {
        const raw = yield* request("POST", "/custom_fields", { label })
        const result = yield* decode(CustomFieldResponse, raw, "/custom_fields")
        return result.custom_field
      })

      const updateCustomField = Effect.fn("Kit.updateCustomField")(function* (
        id: number,
        label: string,
      ) {
        const path = `/custom_fields/${id}`
        const raw = yield* request("PUT", path, { label })
        const result = yield* decode(CustomFieldResponse, raw, path)
        return result.custom_field
      })

      const deleteCustomField = Effect.fn("Kit.deleteCustomField")(function* (id: number) {
        const path = `/custom_fields/${id}`
        yield* request("DELETE", path)
      })

      // ── Webhooks ──

      const listWebhooks = Effect.fn("Kit.listWebhooks")(function* () {
        const raw = yield* request("GET", "/webhooks")
        return yield* decode(WebhooksResponse, raw, "/webhooks")
      })

      const createWebhook = Effect.fn("Kit.createWebhook")(function* (params: {
        event: { name: string; subscriber_filter?: string }
        target_url: string
      }) {
        const body: Record<string, unknown> = {
          event: params.event,
          target_url: params.target_url,
        }
        const raw = yield* request("POST", "/webhooks", body)
        const result = yield* decode(WebhookResponse, raw, "/webhooks")
        return result.webhook
      })

      const deleteWebhook = Effect.fn("Kit.deleteWebhook")(function* (id: number) {
        const path = `/webhooks/${id}`
        yield* request("DELETE", path)
      })

      // ── Account ──

      const getAccount = Effect.fn("Kit.getAccount")(function* () {
        const raw = yield* request("GET", "/account")
        const result = yield* decode(AccountResponse, raw, "/account")
        return result.account
      })

      const getEmailStats = Effect.fn("Kit.getEmailStats")(function* () {
        const raw = yield* request("GET", "/account/email_stats")
        return yield* decode(EmailStatsResponse, raw, "/account/email_stats")
      })

      const getGrowthStats = Effect.fn("Kit.getGrowthStats")(function* () {
        const raw = yield* request("GET", "/account/growth_stats")
        return yield* decode(GrowthStatsResponse, raw, "/account/growth_stats")
      })

      // ── Segments ──

      const listSegments = Effect.fn("Kit.listSegments")(function* () {
        const raw = yield* request("GET", "/segments")
        return yield* decode(SegmentsResponse, raw, "/segments")
      })

      // ── Purchases ──

      const listPurchases = Effect.fn("Kit.listPurchases")(function* (
        params?: { per_page?: number; after?: string },
      ) {
        const qs = new URLSearchParams()
        if (params?.per_page) qs.set("per_page", String(params.per_page))
        if (params?.after) qs.set("after", params.after)
        const path = `/purchases${qs.toString() ? `?${qs}` : ""}`
        const raw = yield* request("GET", path)
        return yield* decode(PurchasesResponse, raw, path)
      })

      const getPurchase = Effect.fn("Kit.getPurchase")(function* (id: number) {
        const path = `/purchases/${id}`
        const raw = yield* request("GET", path)
        const result = yield* decode(PurchaseResponse, raw, path)
        return result.purchase
      })

      const createPurchase = Effect.fn("Kit.createPurchase")(function* (
        params: Record<string, unknown>,
      ) {
        const raw = yield* request("POST", "/purchases", params)
        const result = yield* decode(PurchaseResponse, raw, "/purchases")
        return result.purchase
      })

      return Kit.of({
        listSubscribers,
        getSubscriberByEmail,
        listTags,
        tagSubscriber,
        listBroadcasts,
        createBroadcast,
        updateBroadcast,
        createSequence,
        createSequenceEmail,
        updateSequenceEmail,
        addSubscriberToSequence,
        createSubscriber,
        updateSubscriber,
        createTag,
        removeTagFromSubscriber,
        unsubscribeSubscriber,
        getSubscriberStats,
        listSubscriberTags,
        getBroadcast,
        deleteBroadcast,
        getBroadcastStats,
        listSequences,
        getSequence,
        updateSequence,
        deleteSequence,
        listSequenceEmails,
        listSequenceSubscribers,
        updateTag,
        listSubscribersForTag,
        listForms,
        listFormSubscribers,
        addSubscriberToForm,
        addSubscriberToFormByEmail,
        listCustomFields,
        createCustomField,
        updateCustomField,
        deleteCustomField,
        listWebhooks,
        createWebhook,
        deleteWebhook,
        getAccount,
        getEmailStats,
        getGrowthStats,
        listSegments,
        listPurchases,
        getPurchase,
        createPurchase,
      })
    }),
  )
}
