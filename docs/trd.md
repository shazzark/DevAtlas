# DevAtlas technical requirements document

> **Purpose:** Define testable technical constraints, dependencies and acceptance checks. **Related:** [`prd.md`](prd.md) owns product behavior; [`backend-database-schema.md`](backend-database-schema.md) describes module and data boundaries; [`implementation-plan.md`](implementation-plan.md) sequences delivery.

**Status:** Approved for phased implementation | **Technical owner:** Engineering | **Version:** 1.0

## Scope and links

Applies to the full-stack DevAtlas MVP in [`prd.md`](prd.md), beginning with the Phase 1 foundation in [`implementation-plan.md`](implementation-plan.md). This is a single Next.js application with backend and frontend delivered together in vertical slices.

## Technical requirements

| ID | Requirement | Rationale | Priority/status | Acceptance and verification |
|---|---|---|---|---|
| TR-01 | Use Next.js App Router, React, TypeScript strict mode and Tailwind CSS. Use React Icons for iconography. | Fixed product technology requirements. | Must; confirmed | Inspect package/configuration; strict typecheck and production build. |
| TR-02 | Use MongoDB Atlas as the sole primary database, accessed through Mongoose. | Fixed persistence requirement; content is interconnected and document-shaped. | Must; confirmed | Review connection and schemas; isolated database integration checks when a test URI is available. |
| TR-03 | Validate external input with Zod and keep route handlers, services, repositories, validation, authentication and content processing in clear modules. | Stable API boundaries and safe input handling. | Must; confirmed | Review module contracts and test valid, invalid and failure responses. |
| TR-04 | Use Vitest for automated tests and Playwright for browser-level end-to-end tests. | Fixed verification requirements. | Must; confirmed | Run installed project scripts and record results; end-to-end runs use a local app and synthetic content. |
| TR-05 | Render public content primarily with Server Components; use Client Components only for interactive behavior such as theme controls, search input and copy buttons. | Keep client JavaScript proportionate. | Must; confirmed | Inspect component boundaries and exercise responsive user journeys. |
| TR-06 | Support light and dark themes, semantic accessible controls, responsive navigation, and loading/empty/error states. | Required product experience. | Must; confirmed | Keyboard and semantic review; viewport checks at mobile, tablet and desktop sizes; automated checks where available. |
| TR-07 | Public content endpoints return published material only. Administrative mutations require server-side authentication and authorization. | Editorial integrity and private administration. | Must; confirmed | Endpoint tests cover draft exclusion and unauthorized denial before admin launch. |
| TR-08 | Release source data is traceable; unverified automated findings remain review drafts. Secrets are read only from server-side environment variables and never logged or committed. | Avoid false release claims and credential exposure. | Must; confirmed | Inspect data flow/configuration and test review gates; scan changed files for accidental secrets. |
| TR-09 | Include `.env.example` with variable names and safe placeholders only. Missing optional database credentials must produce an explicit unavailable/degraded state, not a fake successful connection. | Setup clarity without fabricated credentials. | Must; confirmed | Configuration tests and readiness endpoint behavior with missing and valid test configuration. |

## Constraints

- [Confirmed] MongoDB Atlas + Mongoose is the primary and only database. Do not introduce PostgreSQL or another primary store.
- [Confirmed] Use App Router and a modular monolith within Next.js; API route handlers are the HTTP boundary.
- [Confirmed] No external release feed, registry, analytics provider, authentication service or cloud account is presumed available.
- [Recommendation] Keep public shell/liveness usable without a configured database; readiness reports database status honestly. Database-backed pages must show a clear unavailable state when disconnected.
- [Recommendation] Avoid a background queue, search service, cache or paid provider until a demonstrated need exists.

## Dependencies

| Dependency | Purpose | Access/credential status | Fallback |
|---|---|---|---|
| MongoDB Atlas | Persistent content and readiness checks | `MONGODB_URI` must be supplied by project owner for live Atlas use; none is assumed here. | Local shell and unit tests can run; DB-backed behavior remains unverified until an isolated database is available. |
| Official technology documentation and release sources | Traceable editorial content | Public sources can be researched individually; no API credential or feed access is assumed. | Manual source links and editorial review; no fabricated release data. |
| Admin identity mechanism | Secure private content management | Provider and credentials not selected; resolve before Phase 6. | No admin publishing until selected and configured. |
| Hosting platform | Production deployment | Not selected. | Local development continues; deployment preparation remains Phase 8. |

## Technical acceptance

- Strict TypeScript checks, Vitest suite and production build pass in the available local environment for each completed phase.
- Important database behavior is verified against an isolated test database when access exists; unavailable database integration is reported explicitly.
- Browser checks cover key public journeys, keyboard interaction, loading/empty/error states and responsive reflow. Do not claim visual fidelity or accessibility conformance without the corresponding checks.
- Error responses do not expose credentials, stack traces or internal database details.
- Release publication and admin authorization tests verify denial paths as well as success paths.

## Open technical decisions

- Admin identity provider and provisioning: owner decision, before Phase 6; affects auth implementation and credentials.
- Hosting and deployment target: owner decision, before Phase 8; affects runtime and operational verification.
- Atlas URI and isolated test database availability: required for live database verification; owner supplies a development/test credential through local environment configuration when ready.
