# DevAtlas implementation plan

> **Purpose:** Deliver the approved product as bounded, end-to-end phases. Each phase integrates persistence, services, APIs, validation, frontend, states, tests and documentation. **Related:** [`prd.md`](prd.md), [`trd.md`](trd.md), [`appflow.md`](appflow.md), [`design-system.md`](design-system.md), [`backend-database-schema.md`](backend-database-schema.md).

**Status:** Approved for implementation | **Plan owner:** Product owner and engineering | **Scope/version:** MVP 1.0

## Approved inputs and open decisions

- Approved baseline: [`DevAtlas_MVP_Product_Decisions.pdf`](DevAtlas_MVP_Product_Decisions.pdf), dated 20 October 2026.
- Product requirements: [`prd.md`](prd.md). Fixed technical requirements: [`trd.md`](trd.md).
- User authorized sequential phases beginning at Phase 0 and continuing through implementation, local commits, and no push.
- Open dependencies: `MONGODB_URI` for live Atlas verification; admin identity provider before Phase 6; hosting target before Phase 8. Work that does not need credentials can continue and must report the missing evidence accurately.

## Milestones and dependencies

Deliver vertical slices in the order below. Phase 1 establishes the product shell; Phase 1.5 separates frontend and backend before Phase 2 adds catalog content. Content phases continue to deliver models, API, UI and tests together across the app boundary. Phase 6 depends on a selected secure admin identity mechanism. Phase 8 follows feature completion and covers production readiness. Release data is sourced and verified editorially; no credentials or verified release facts are assumed.

## Phases

### Phase 0 - Repository, specification and architecture

- **Objective:** Establish repository facts, interpret approved PDF and prepare the six planning documents.
- **Scope:** Inspect branch/remote/changes, instructions and skills; document architecture and complete phase sequence.
- **Dependencies:** Product decisions PDF.
- **Deliverables:** This six-document planning set; reviewed architecture and plan.
- **Acceptance criteria:** Documents agree with the PDF, identify open dependencies and have no competing planning system.
- **Verification:** Cross-document consistency and Markdown/link review; record repository boundary and initial Git facts.
- **Planning method:** The installed `project-planning` skill was invoked and its document templates followed for the six documents requested. The installed skill catalogs did not contain a separately named six-document skill; no such skill is claimed.
- **Risks/blockers:** A separately named six-document skill was not available in the installed catalogs. The six requested documents were produced with the installed planning skill's conventions.
- **Completion conditions:** Six documents reviewed and Phase 1 implementation is ready under the user's authorization.
- **Observed completion:** The PDF was extracted and its product decisions recorded in the PRD. The six documents were reviewed for consistency and committed as `a802ee1`.

### Phase 1 - Foundation, database connection, shell and health

- **Objective:** Establish a runnable full-stack base with truthful health/readiness behavior and usable responsive shell.
- **Scope:** Next.js App Router/React/strict TypeScript/Tailwind/React Icons; initial modular boundaries; Mongoose connection lifecycle; safe environment example; public app shell, responsive nav, search entry and light/dark theme; health and readiness behavior; loading/error handling; baseline Vitest/Playwright configuration and tests.
- **Dependencies:** Node/npm environment; live DB check requires owner-provided URI but implementation can proceed without it.
- **Deliverables:** Initial app foundation, database readiness behavior, shell/theme, `/api/health` and `/api/health/ready`, setup docs.
- **Acceptance criteria:** App starts and builds; liveness reports app process without claiming database connectivity; readiness indicates DB unavailable when unconfigured and connected only after an actual successful DB check; shell works at mobile/desktop and both themes; keyboard navigation has visible focus; no credentials in source.
- **Verification:** Strict typecheck, Vitest, production build, local endpoint checks, and available browser/responsive checks; report database verification limits.
- **Risks/blockers:** Dependency installation/network access or no `MONGODB_URI`; continue with accurate degraded readiness and mock-free config tests.
- **Completion conditions:** All checks available locally pass, docs reflect actual implementation, diff reviewed and local commit created.
- **Observed completion:** The initial Next.js shell and health behavior passed the local typecheck/build, 4 Vitest tests and 5 Playwright checks; local MongoDB readiness returned 200 without writing documents. Phase 1.5 below moves database ownership and health routes to Fastify while preserving the verified shell/theme behavior.

### Phase 1.5 - Separate frontend and backend

- **Objective:** Preserve Phase 1 behavior while creating independently runnable and deployable web/API workspaces before feature content is added.
- **Scope:** Move Next.js into `apps/web`; create Node.js/Fastify strict TypeScript backend in `apps/api`; move Mongoose and readiness ownership to the API; share only health/API Zod contracts through `packages/shared`; use server-only typed API client and Next.js BFF handlers; separate environment examples; orchestrate workspace development/build/test commands; retain Tailwind CSS v4 as the primary styling system and map the existing theme variables into Tailwind semantic tokens.
- **Dependencies:** Existing npm project and package registry for Fastify/runtime dependencies; MongoDB Atlas is not required for process startup, but a dedicated local/test MongoDB URI enables live readiness integration verification.
- **Deliverables:** Workspace monorepo, Fastify health/readiness API, Next.js BFF health routes, typed service client, separate web/API env examples, retained responsive shell and theme behavior, workspace documentation and tests.
- **Acceptance criteria:** Web and API can run independently; the root development command starts both; MongoDB appears only under the API; API reports liveness without MongoDB and readiness only after an actual ping; the BFF reaches Fastify with parsed response contracts and safe failure responses; CORS is off because browser requests use the BFF; existing navigation/theme/mobile behavior is retained; Tailwind utility CSS compiles and theme utilities follow light/dark tokens.
- **Verification:** Strict typecheck for all workspaces, unit/contract tests, Fastify inject integration, real MongoDB readiness ping against a dedicated local database when available, Playwright browser-to-BFF-to-Fastify path, responsive/theme checks and independent production builds for shared/API/web.
- **Risks/blockers:** Local port conflicts and missing database URI; ports and API origin are configurable. Hosted multi-service networking and production origins are verified in the hosting phase.
- **Completion conditions:** Architecture/security review has no unresolved material findings, all available checks pass, six planning docs describe actual architecture, and a local checkpoint is committed.
- **Observed completion:** Tailwind CSS v4.3.3 is configured through the official PostCSS plugin in `apps/web`; utility classes drive the responsive shell and theme control, with existing design tokens and custom illustration styles retained. Strict workspace typecheck passed. Vitest passed 9/9 tests with the dedicated local MongoDB URI. Playwright passed 7/7 checks with MongoDB unavailable and 7/7 with readiness available, covering API/BFF communication, themes, keyboard navigation, and mobile/tablet/desktop overflow. Shared/API/web production builds passed. Architecture and security reviews reported no unresolved material findings. Local commit: to be recorded after final review.

### Phase 2 - Technology catalog

- **Objective:** Browse and inspect the approved launch technology set.
- **Scope:** Technology Mongoose model/indexes, Fastify repository/service/Zod/API, safe seed workflow, Next.js catalog/detail Server Components and interactive search/filter entry, pagination, related technology links, states.
- **Dependencies:** Phase 1.5; source evidence for stable content and version facts. Never seed invented current versions.
- **Deliverables:** Technology APIs and responsive catalog/detail experience for up to 12 approved launch technologies.
- **Acceptance criteria:** Validated CRUD/import workflow; public list/details expose published records only; slug uniqueness, pagination and empty/error states behave as specified.
- **Verification:** Fastify service/contract/database integration tests; Next.js-to-API journey and responsive/keyboard browser checks.
- **Risks/blockers:** Atlas credentials and verified source metadata; omit unverified version claims.
- **Completion conditions:** End-to-end catalog slice works, docs/diff reviewed and phase committed.

### Phase 3 - Release intelligence

- **Objective:** Publish traceable, reviewed release explanations.
- **Scope:** Release model/source records/indexes; source-monitor adapter design and only verified official-source integrations; candidate draft workflow; review service/API; What's New and release detail pages.
- **Dependencies:** Phase 2 technology references; confirmed source access and editorial checks.
- **Deliverables:** Extensible official-source detection and human review, breaking/migration/upgrade sections and timestamps.
- **Acceptance criteria:** Detection only creates drafts; public views require publication and show source/applicability/verification; API failures never masquerade as release detections.
- **Verification:** Fixture-based source processing, API denial/lifecycle tests, editorial workflow browser checks.
- **Risks/blockers:** Official API/feed limits or access; use public official pages and manual process if automated access is unavailable.
- **Completion conditions:** End-to-end reviewed release flow and phase commit; dependencies and credentials reported.

### Phase 4 - Stack guides

- **Objective:** Explain verified technology integrations.
- **Scope:** Stack-guide schemas/indexes, validation/service/repository/API, guide pages with prerequisites, architecture, setup, configuration, testing, troubleshooting, production notes and related technologies.
- **Dependencies:** Technology catalog and sourced editorial material.
- **Deliverables:** Up to 8 reviewed guides; one complete representative guide slice before expanding.
- **Acceptance criteria:** Published guides reference valid technologies, include required sections and remain absent from public surfaces until published.
- **Verification:** Schema/service/API tests and end-to-end guide navigation checks.
- **Risks/blockers:** Exact guide topics need curation; select from approved product examples and document additions.
- **Completion conditions:** Complete guide slice, docs/diff review and commit.

### Phase 5 - Build guides

- **Objective:** Teach three practical projects through tested steps and copyable examples.
- **Scope:** Build-guide schemas/indexes, API and service, tutorial pages, syntax highlighting/copy functionality and validated examples for REST Task API, Real-Time Chat and Full-Stack CRUD Application.
- **Dependencies:** Foundation and relevant technology/stack guidance.
- **Deliverables:** Ordered project guides with prerequisites, steps, code, tests and troubleshooting.
- **Acceptance criteria:** Each published project has complete ordered steps and examples verified in its documented environment; copy controls report success/failure accessibly.
- **Verification:** Content/code checks, API tests, browser journey and copy interaction checks.
- **Risks/blockers:** Supporting service credentials for sample applications; prefer local/test-only examples and disclose setup dependencies.
- **Completion conditions:** Three complete build guides or explicitly recorded blocker; phase committed only when acceptance is met.

### Phase 6 - Private administration

- **Objective:** Securely manage editorial lifecycle for all content types.
- **Scope:** Selected auth mechanism, protected admin routes/API, role checks, draft/review/publish/withdraw/correction interfaces and audit provenance.
- **Dependencies:** Content models from Phases 2–5 and owner-selected identity provider/credentials.
- **Deliverables:** Private administration with clear editorial state transitions.
- **Acceptance criteria:** Unauthorized access is denied server-side; only authorized editors can transition content; public APIs never expose drafts; review evidence is retained.
- **Verification:** Auth/session and authorization negative-path tests, CSRF/security review as applicable, admin browser checks.
- **Risks/blockers:** Identity provider is an owner decision and may require credentials; do not invent them or provide a fake-auth substitute.
- **Completion conditions:** Selected provider works with credentials, controls tested and phase committed.

### Phase 7 - Search and discovery

- **Objective:** Search published technologies, releases, integrations and projects with useful filters and related content.
- **Scope:** MongoDB-backed query, validation, indexes justified by search behavior, accessible results/filters/pagination and analytics only if privacy policy is decided.
- **Dependencies:** Content modules Phases 2–5.
- **Deliverables:** Search API/UI and related-content discovery.
- **Acceptance criteria:** Query returns relevant published types; filters and pagination work; no-results and unavailable states recover clearly.
- **Verification:** Search behavior tests, query checks against isolated MongoDB and browser journeys.
- **Risks/blockers:** Search quality at MVP volume; start with MongoDB indexes and avoid a separate search service.
- **Completion conditions:** End-to-end search works with verified data; phase committed.

### Phase 8 - Production readiness

- **Objective:** Prepare the integrated MVP for a selected launch environment.
- **Scope:** Security, accessibility, SEO, performance, complete test suite, operational configuration, deployment docs and launch verification.
- **Dependencies:** All feature phases and owner-selected hosting target.
- **Deliverables:** Release checklist, verified deployment configuration and operational guidance.
- **Acceptance criteria:** Security/accessibility/performance checks meet agreed targets; production build and browser journeys pass; environment/secrets and recovery behavior are documented; deployment tested on the selected host.
- **Verification:** Vitest, Playwright, strict typecheck, build, dependency/security review and target-host smoke check.
- **Risks/blockers:** Hosting, Atlas network access, allowed origins and secret setup require owner/platform configuration.
- **Completion conditions:** Evidence-based launch report with unresolved risks stated; no push/deploy without separate authorization.

## Change process

Record scope changes and new decisions in the owning document and update acceptance criteria before implementing them. Reversible implementation choices can be documented as recommendations. Stop only when credentials, destructive work, a material scope change or an essential external decision blocks safe progress.

## Approval and handoff

The user approved the product PDF as the initial specification, then approved Phase 1.5 before Phase 2 to split the applications. Local commits are authorized after completed, verified phases; pushing is not authorized. Phase 1.5 preserves the Phase 1 interface and inserts the API boundary before Phase 2. Phase 2 follows this refactor.
