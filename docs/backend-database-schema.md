# DevAtlas backend and database schema

> **Purpose:** Describe module ownership, request flow and persistent data concepts. **Related:** [`prd.md`](prd.md) defines business rules; [`trd.md`](trd.md) sets technical requirements; [`implementation-plan.md`](implementation-plan.md) sequences delivery. Detailed choices follow `$backend-architecture` and `$database-engineering` guidance.

**Status:** Approved architecture constraints; schema evolves by phase | **Technical/data owner:** Engineering | **Version:** 1.0

## System boundaries and module ownership

**[Confirmed]** One modular Next.js App Router application serves the web UI and internal API. Keep it a modular monolith until an observed requirement justifies separate processes.

```text
Browser
  +-- Server Components / interactive Client Components
  +-- App Router API handlers (HTTP parsing, status and response)
       +-- Zod validation -> feature service -> feature repository (Mongoose)
                                               +-- MongoDB Atlas
```

- **HTTP handlers:** Parse and validate requests, invoke one use case and map stable errors/status codes; do not contain persistence or editorial policy.
- **Feature services:** Enforce content lifecycle and use cases without depending on Next.js request/response objects.
- **Repositories:** Own Mongoose queries and persistence for their feature; avoid a generic repository abstraction unless it expresses real shared behavior.
- **Validation:** Zod schemas validate untrusted route and admin input at the boundary.
- **Authentication/authorization:** Server-side admin identity and action checks; provider choice remains open until Phase 6.
- **Content processing:** Official source ingestion/detection can produce review drafts. It cannot publish. External content is untrusted input.
- **UI:** Server Components load public content; Client Components are reserved for interaction such as theme control, search controls and copy buttons.

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

## Related documents and decisions

See [`prd.md`](prd.md), [`trd.md`](trd.md), [`appflow.md`](appflow.md), [`design-system.md`](design-system.md) and [`implementation-plan.md`](implementation-plan.md). Search indexes, admin provider, audit retention and production deployment are deferred until their implementation phases and evidence.
