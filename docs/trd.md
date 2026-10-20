# DevAtlas technical requirements document

> **Purpose:** Define testable technical constraints, dependencies and acceptance checks. **Related:** [`prd.md`](prd.md) owns product behavior; [`backend-database-schema.md`](backend-database-schema.md) describes module and data boundaries; [`implementation-plan.md`](implementation-plan.md) sequences delivery.

**Status:** Approved for phased implementation | **Technical owner:** Engineering | **Version:** 1.0

## Scope and links

Applies to the full-stack DevAtlas MVP in [`prd.md`](prd.md). The frontend and backend are independently deployable npm workspaces, delivered together as vertical slices.

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
| TR-10 | Run the frontend in `apps/web` with Next.js App Router, React, strict TypeScript and Tailwind CSS as the primary styling system. Keep React Icons for iconography. | The original frontend stack remains in place within the monorepo. | Must; confirmed | Tailwind utilities compile after relocation; theme, viewport, typecheck and production-build checks pass. |
| TR-11 | Run the backend in `apps/api` as a Node.js/Fastify application with strict TypeScript, Zod validation and Mongoose. MongoDB access belongs only to this workspace. | Isolates persistence and backend business logic from presentation. | Must; confirmed | Repository search shows no Mongoose or `MONGODB_URI` access in the web app; API tests cover health and readiness. |
| TR-12 | Use npm workspaces at the repository root. `packages/shared` may contain API contracts/types only; it must not contain secrets, environment access or server implementations. | Shared contracts should not couple deployable applications. | Must; confirmed | Root scripts build the shared package before dependent workspaces; verify imports and package contents. |
| TR-13 | The web app uses a typed, server-only API client and Next.js BFF route handlers for backend calls. Keep `API_BASE_URL` server-side. Do not enable CORS unless a browser-to-Fastify path is introduced. | Avoids exposing API routing configuration and database services to browser code. | Must; confirmed | Frontend health BFF reaches Fastify; response contracts are parsed by shared Zod schemas; no public client secret. |
| TR-14 | Use Tailwind CSS v4.3.3 with the official `@tailwindcss/postcss` PostCSS integration. Map design-system theme variables into Tailwind tokens; retain global CSS for theme values, base rules and bespoke artwork. | Tailwind is the primary styling system while preserving the established DevAtlas design. | Must; confirmed | Verify utility styles at runtime, light/dark computed colors, mobile/desktop reflow and production CSS output. |

## Constraints

- [Confirmed] MongoDB Atlas + Mongoose is the primary and only database. Do not introduce PostgreSQL or another primary store.
- [Confirmed] Use separate web and API apps in a modular monorepo. Fastify route handlers are the backend HTTP boundary; Next.js handlers are narrow BFF proxies.
- [Confirmed] Only `apps/api` may connect to MongoDB. Shared packages stay framework-light and credential-free.
- [Confirmed] Tailwind CSS is the primary component styling system. Global CSS retains paired theme variables, base rules and the original atlas artwork.
- [Confirmed] No external release feed, registry, analytics provider, authentication service or cloud account is presumed available.
- [Recommendation] Keep public shell/liveness usable without a configured database; readiness reports database status honestly. Database-backed pages must show a clear unavailable state when disconnected.
- [Recommendation] Avoid a background queue, search service, cache or paid provider until a demonstrated need exists.

## Dependencies

| Dependency | Purpose | Access/credential status | Fallback |
|---|---|---|---|
| MongoDB Atlas | Persistent content and readiness checks | `MONGODB_URI` must be supplied by project owner for live Atlas use; none is assumed here. | Local shell and unit tests can run; DB-backed behavior remains unverified until an isolated database is available. |
| Fastify backend | Internal API and MongoDB boundary | `HOST`, `PORT`, `LOG_LEVEL`; database access uses `MONGODB_URI` in `apps/api`. | Backend liveness runs without a database; readiness returns 503 until MongoDB responds. |
| Next.js web app | Public presentation and server-side BFF | `API_BASE_URL` in `apps/web`; no database URI in this workspace. | UI shell can render while the backend is unavailable and displays a safe BFF error for backend calls. |
| Official technology documentation and release sources | Traceable editorial content | Public sources can be researched individually; no API credential or feed access is assumed. | Manual source links and editorial review; no fabricated release data. |
| Admin identity mechanism | Secure private content management | Provider and credentials not selected; resolve before Phase 6. | No admin publishing until selected and configured. |
| Hosting platform | Production deployment | Not selected. | Local development continues; deployment preparation remains Phase 8. |

## Technical acceptance

- Strict TypeScript checks, Vitest suite and production build pass in the available local environment for each completed phase.
- Important database behavior is verified against an isolated test database when access exists; unavailable database integration is reported explicitly.
- Browser checks cover key public journeys, keyboard interaction, loading/empty/error states and responsive reflow. Do not claim visual fidelity or accessibility conformance without the corresponding checks.
- Error responses do not expose credentials, stack traces or internal database details.
- Frontend-to-backend calls run server-side, use bounded timeouts and validate response contracts; direct browser CORS is not enabled.
- Tailwind utility classes compile and respond to theme tokens after the frontend is moved under `apps/web`.
- Release publication and admin authorization tests verify denial paths as well as success paths.

## Open technical decisions

- Admin identity provider and provisioning: owner decision, before Phase 6; affects auth implementation and credentials.
- Hosting and deployment target: owner decision, before Phase 8; affects runtime and operational verification.
- Atlas URI and isolated test database availability: required for live database verification; owner supplies a development/test credential through local environment configuration when ready.
