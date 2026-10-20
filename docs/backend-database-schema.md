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
- **Authentication/authorization:** Server-side admin identity and action checks; provider choice remains open until Phase 6.
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
- Backend environment is isolated in `apps/api` (`MONGODB_URI`, `PHASE15_MONGODB_TEST_URI`, `HOST`, `PORT`, `LOG_LEVEL`). Web environment uses server-only `API_BASE_URL` in `apps/web`.
- `packages/shared` publishes compiled health response schemas/types. Root scripts build it before API/web builds and local development.

## Related documents and decisions

See [`prd.md`](prd.md), [`trd.md`](trd.md), [`appflow.md`](appflow.md), [`design-system.md`](design-system.md) and [`implementation-plan.md`](implementation-plan.md). Search indexes, admin provider, audit retention and production deployment are deferred until their implementation phases and evidence.
