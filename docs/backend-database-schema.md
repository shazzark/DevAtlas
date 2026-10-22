# DevAtlas backend and database schema

> **Purpose:** Describe module ownership, request flow and persistent data concepts. **Related:** [`prd.md`](prd.md) defines business rules; [`trd.md`](trd.md) sets technical requirements; [`implementation-plan.md`](implementation-plan.md) sequences delivery. Detailed choices follow `$backend-architecture` and `$database-engineering` guidance.

**Status:** Approved architecture constraints; schema evolves by phase | **Technical/data owner:** Engineering | **Version:** 1.0

## System boundaries and module ownership

**[Confirmed]** A small npm-workspaces monorepo contains independently runnable web and API applications. The browser uses the Next.js web app; server-side BFF routes call Fastify. Fastify alone owns Mongoose and MongoDB access. A future source-monitoring worker can be a separate process/workspace if its lifecycle or scaling needs justify one; no queue or worker infrastructure is introduced yet.

```text
Browser
  +-- Next.js App Router (Server Components / interactive Client Components)
       +-- server-only typed API client / BFF handlers
            +-- Fastify routes -> Zod -> feature services -> repositories (Mongoose)
                                                        +-- MongoDB Atlas

packages/shared: Zod request/response contracts and TypeScript types only
```

- **Fastify API (`apps/api`):** Owns health/readiness, request validation, services, repositories and database connections. Route handlers map requests to stable response/status contracts.
- **Next.js web (`apps/web`):** Owns page rendering, navigation and presentation. Narrow Route Handlers proxy typed backend calls from the server. Do not access Mongoose, `MONGODB_URI` or MongoDB from this workspace.
- **Shared package (`packages/shared`):** Owns contracts shared across workspace boundaries. It has no environment reads, credentials, database package or server-only implementation.
- **Feature services:** Enforce content lifecycle and use cases without depending on Next.js request/response objects.
- **Repositories:** Located in the backend and own Mongoose queries for their feature; avoid generic CRUD abstractions that hide query intent.
- **Validation:** Zod schemas validate untrusted API input at the Fastify boundary; shared response schemas validate backend responses consumed by the web app.
- **Authentication/authorization:** Server-side GitHub OAuth allow-list, short-lived signed service assertions, and backend action checks; operator credentials are described in [`admin-access.md`](admin-access.md).
- **Content processing:** Official source ingestion/detection can produce review drafts. It cannot publish. External content is untrusted input.
- **UI:** Server Components load public content through the server-only API client; Client Components are reserved for interaction such as theme control, search controls and copy buttons. Tailwind CSS is the primary styling system; theme variables are exposed as semantic utilities.

## Data concepts and ownership

| Entity/record | Meaning | Authoritative owner | Sensitive/retention notes |
|---|---|---|---|
| Technology | A catalog entry with descriptions, use cases, limitations, alternatives, relations, official docs and version metadata. | Technology module | Public when published; source and verification timestamps retained. |
| Release | A versioned source-backed change breakdown linked to a technology. | Release module | Draft/review/published lifecycle; preserve source URL, applicability, reviewer and last checked/verified times. |
| Stack Guide | A verified integration guide linked to technologies. | Stack-guide module | Public when published; include prerequisites through production concerns. |
| Build Guide | A practical project guide with ordered steps and code examples. | Build-guide module | Public when published; examples require verification. |
| Admin identity/audit event | Authenticated administrator and editorial action provenance. | Admin/auth module | Restricted data; retain only required identity and review history. Exact retention policy is open. |

## Relationships and lifecycle

- A technology may relate to other technologies and have many releases, guides and build guides; store stable references (IDs/slugs) rather than embedding unbounded histories.
- Release belongs to a technology and carries one or more source references plus version applicability and editorial verification evidence.
- Stack Guide relates two or more technologies; Build Guide may relate one or more technologies and stack guides.
- Content lifecycle is `draft -> review -> published`; an authorized correction may return published content to review or withdraw it. Public readers query published content only.
- **[Recommendation]** Use UTC `createdAt`/`updatedAt`, stable slug uniqueness, explicit publication/review/verification timestamps and a revision/editor attribution strategy. Detailed fields are introduced with their owning phase.

## Access patterns and integrity needs

- Public access: lookup by slug, paginated catalog/feed, category or related-content lookup, and text/title search.
- Editorial access: list/filter by status, inspect sources and version metadata, create/update/review/publish/withdraw with server-side authorization.
- **[Recommendation]** Candidate indexes: unique slug for each public content type; compound status/date indexes for published pagination and editorial queues; text or normalized search indexes selected after query shape is implemented. Revisit against actual access paths.
- **[Confirmed]** MongoDB Atlas is the only primary database, with Mongoose. Do not fabricate connection credentials or report a live connection without one.
- **[Recommendation]** Keep content references bounded and use pagination for growing collections. Use atomic updates for lifecycle transitions where concurrent editors could violate review state.

## Acceptance and verification

Introduce schemas and indexes alongside each vertical slice. Verify schema validation and uniqueness against an isolated database when available; test services with focused unit tests and route behavior at HTTP boundaries. Verify public queries exclude draft/review content. Never run destructive operations against production during development.

### Implemented Phase 1.5 boundary

- Fastify owns `GET /api/health` and `GET /api/health/ready`. Readiness connects through Mongoose and pings MongoDB; its public error response is generic and does not include driver details.
- Next.js BFF handlers expose same-path health calls to the web origin and use a server-only typed client with a four-second request timeout. No browser-to-Fastify CORS path is required or enabled.
- Backend environment is isolated in `apps/api` (`MONGODB_URI`, compatible `DATABASE_URL`, per-phase test URIs, `HOST`, `PORT`, `LOG_LEVEL`). Web environment uses server-only `API_BASE_URL` in `apps/web`.
- `packages/shared` publishes compiled health response schemas/types. Root scripts build it before API/web builds and local development.

### Implemented Phase 2 Technology module

`apps/api/src/features/technologies` owns the Mongoose model, repository, service, Zod-validated Fastify routes, integration tests and idempotent seed command. MongoDB collection `technologies` has a unique `slug` index, published-list indexes on `{status, category, name, _id}` and `{status, name, _id}`, and a text index over `name`, `shortDescription` and `overview`. Public reads filter on `status: published`; the response mapper removes lifecycle and database fields. The model also carries human-readable `alternatives`, `relatedSlugs`, nullable `version.current` / `version.releasedAt` / `version.sourceUrl` / `version.lastVerifiedAt`, and fields ready for future release and guide references.

Shared Zod contracts define the query and response shapes. `GET /api/technologies?q=&category=&page=&limit=` returns `{items, pagination, categories}`; `GET /api/technologies/:slug` returns `{item}`. The list defaults to page 1 and 12 items, with a 48-item maximum and page numbers capped at 10,000. Search uses MongoDB text search and stable name and MongoDB `_id` ordering; category is an optional enum filter. Invalid queries return `400`, unpublished or missing slugs return `404`, and unexpected failures use the API's generic `500` handler. The safe seed command upserts only the 12 approved slugs. Seed version values stay null; `lastVerifiedAt` records the source-review date independently.

The web app renders `/tools` and `/tools/[slug]` with Server Components, and provides matching same-origin BFF endpoints. Highlight.js runs on the server with an allowlist of supported languages; its escaped output is inserted as markup, and only the clipboard action uses client-side JavaScript.

### Implemented Phase 3 Release module

`releases` stores technology reference/slug, version and stable source identity, source title/URL/publication metadata, untrusted source excerpt, last detection time, editorial breakdown, `draft|review|published` status, and verification/review/publication attribution timestamps. Indexes: unique slug; unique `{sourceKey, sourceReleaseId}`; published feed `{status, sourcePublishedAt, _id}`; per-technology feed `{status, technologySlug, sourcePublishedAt, _id}`; review queue `{status, updatedAt}`. `release_sources` stores one source per unique `sourceKey`, its technology, fixed source kind/official URL, enablement, ETag, last-check time and safe status/error code; an `{enabled, kind}` index supports monitoring.

Release lists default to page 1 and 12 items, limit 48, optionally filter by `technologySlug`, and return `{items, pagination}`. Public detail returns `{item}`. `GET /api/admin/releases/candidates` returns `{items}`; `POST /api/admin/releases/monitor` returns the source report; `PATCH /api/admin/releases/:slug/review` accepts a validated transition and editorial body. All three HTTP administration routes require the injected authorizer and fail closed until Phase 6 auth is configured. Source state distinguishes `lastCheckedAt` (latest attempt) from `lastSuccessfulAt` (incremental release cutoff), so an outage does not advance the cutoff and hide releases. Source detection uses upserts and only inserts draft records; no automated publishing or destructive migration exists. Integration tests use only the dedicated `PHASE3_MONGODB_TEST_URI` database.

### Phase 4 Stack Guide module

`stack_guides` stores a unique slug, editorial title/summary, related technology slugs, prerequisites, compatibility notes, architecture, ordered steps and code examples, troubleshooting, official references, nullable verification time and `draft|review|published` status. Verification time stays null on unverified seeds; admin publication requires a timestamp and explicit confirmation. Indexes support published title listing, technology filtering and MongoDB text search. Public list/detail reads require `published` and non-null verification time; they resolve each relation against currently published technologies and suppress a guide if a relation is missing or unpublished. The public mapper selects only contract fields, excluding MongoDB subdocument IDs and editorial fields. The insert-only seed prepares eight source-linked records in `review`; examples are not claimed as execution-tested.

### Phase 5 Build Guide module

`build_guides` stores a unique slug, learning objectives, prerequisites, technology slugs, architecture, ordered steps and examples, testing instructions, common errors, outcome, official references, nullable verification time and `draft|review|published` status. Indexes support published title listing, technology filtering and MongoDB text search. Public reads include only published guides with a verification timestamp whose related technologies remain published. The insert-only seed prepares the three requested project guides in `review` with no claimed verification timestamp; their examples require execution and editorial verification before publication.

### Phase 6 administration and audit module

`admin_audit_events` stores actor ID, action, content type/slug, previous and next status, changed field names and creation time. It avoids copying submitted content into the audit record. Its indexes support recent-event and per-content history reads. The Next.js BFF verifies the Auth.js session and allow-list before minting a 30-second JWT; Fastify independently verifies its HS256 signature, issuer, audience, age, role and numeric actor ID. Admin routes validate content through strict Mongoose schemas and enforce compare-and-set status transitions. Public repositories continue to require `published`.

## Related documents and decisions

See [`prd.md`](prd.md), [`trd.md`](trd.md), [`appflow.md`](appflow.md), [`design-system.md`](design-system.md) and [`implementation-plan.md`](implementation-plan.md). Search indexes and the admin provider are implemented; audit retention and host selection remain operational decisions.

### Phase 7 unified search and metrics

`GET /api/search?q=&category=&technologySlug=&page=&limit=` searches four public content collections using MongoDB text indexes and text score. It supports `technology|release|stack|build`, an optional published technology slug, and global page/limit parameters. Releases and guides require a verification timestamp; guides also require every referenced technology to remain published. Search result projections contain only public title/summary/path and technology slugs. Related results are found through shared published technologies. The web proxy validates the same shared Zod query and response types. `search_daily_metrics` aggregates UTC day, category, keyword-present flag and count with a 366-day TTL; it stores no query values or user identifiers.

### Phase 8 runtime configuration

The separate services and launch environment are documented in [`deployment.md`](deployment.md). The API requires Atlas configuration for readiness; only it receives `MONGODB_URI`. The web requires private `API_BASE_URL`, public `SITE_URL`, and admin OAuth/signing values before private publishing is available. Robots and dynamic sitemap handlers use Next.js metadata file conventions.
