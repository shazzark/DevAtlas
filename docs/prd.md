# DevAtlas product requirements document

> **Purpose:** Define product behavior and business requirements. **Related:** [`trd.md`](trd.md) owns technical requirements; [`appflow.md`](appflow.md) maps journeys; [`implementation-plan.md`](implementation-plan.md) sequences delivery.
>
> Certainty labels identify approved facts and reversible engineering choices. Product decisions in `DevAtlas_MVP_Product_Decisions.pdf` are the approved initial specification.

**Status:** Approved baseline | **Owner:** Product owner | **Version:** 1.0 | **Source:** [MVP Product Decisions](DevAtlas_MVP_Product_Decisions.pdf), 20 October 2026

## Problem and goals

Developers currently piece together technology explanations, release information, integration decisions and project instructions from many sources. DevAtlas is a free, continuously maintained knowledge platform that connects source-backed release explanations to technology pages, stack guides and practical build guides. Its tagline is **Stay current. Understand the tools. Connect the stack. Build better.**

## Users and permissions

- **[Confirmed] Learners:** Beginner and intermediate developers who need to understand tools and integrate them in practical projects.
- **[Confirmed] Working developers:** Developers who track releases and evaluate technology choices.
- **[Confirmed] Editors/administrators:** A small authorized group that creates, reviews and publishes content through private administration. Identity provider and exact admin account provisioning remain open for the admin phase.
- **[Confirmed] Public visitors:** Can read all core educational content without an account or payment.

## In-scope behavior

### PR-01 Technology Explorer

- **Requirement:** [Confirmed] Present a catalog of 12 launch technologies: JavaScript, TypeScript, React, Next.js, Node.js, Express, PostgreSQL, MongoDB, Git, Docker, Vitest and Socket.IO. Each page explains purpose, use cases, when not to use, setup, key concepts, examples, related tools, official sources, current version when verified, and content verification dates.
- **Priority/status:** Must have; approved baseline.
- **Acceptance criteria:** A visitor can find and open each published technology page; each page exposes its required sections and source links; absent or stale version facts are labeled unavailable or not verified rather than fabricated.
- **Related journey/dependency:** Catalog and detail flows in `appflow.md`; Phase 2.

### PR-02 Release Intelligence

- **Requirement:** [Confirmed] Publish curated release breakdowns with important changes, why they matter, examples, breaking changes, upgrade considerations and original official sources. Updates receive official-source checks and human review; detection may produce drafts but never publishes unverified summaries.
- **Priority/status:** Must have; approved baseline.
- **Acceptance criteria:** Every published breakdown links to its source, identifies applicable version and verification date, and has passed editorial review. A draft remains private until review and publication.
- **Related journey/dependency:** What's New and release detail flows; Phase 3.

### PR-03 Stack Guides

- **Requirement:** [Confirmed] Provide up to 8 verified integration guides. Each explains architecture, prerequisites, installation, configuration/code, integration, reasoning, testing, troubleshooting and production considerations.
- **Priority/status:** Must have; approved baseline.
- **Acceptance criteria:** A visitor can follow a guide's ordered steps, access its prerequisites and related technologies, and see testing and troubleshooting information.
- **Related journey/dependency:** Phase 4.

### PR-04 Build Guides

- **Requirement:** [Confirmed] Provide three practical projects: REST Task API, Real-Time Chat and Full-Stack CRUD Application. Guides include steps and tested code examples.
- **Priority/status:** Must have; approved baseline.
- **Acceptance criteria:** A visitor can navigate a project from prerequisites through implementation and verification and copy its code examples.
- **Related journey/dependency:** Phase 5.

### PR-05 Search and discovery

- **Requirement:** [Confirmed] Search technologies, releases, integration guides and projects, with technology category filters and useful empty states.
- **Priority/status:** Must have; approved baseline.
- **Acceptance criteria:** Search returns matching published records by supported title/description terms; filters narrow technology results; no-match results explain how to recover.
- **Related journey/dependency:** Phase 7; initial navigation and shell in Phase 1.

### PR-06 Administration and quality

- **Requirement:** [Confirmed] Private administration manages technologies, releases, Stack Guides and Build Guides with draft, review and published states. Content quality includes source links, version applicability, editorial review, last-verified timestamps and a correction workflow.
- **Priority/status:** Must have; approved baseline.
- **Acceptance criteria:** Only an authenticated authorized administrator can manage content; public APIs and pages expose only published records; publication records review and verification evidence.
- **Related journey/dependency:** Phase 6; depends on content modules and an approved identity design.

### PR-07 Free educational core

- **Requirement:** [Confirmed] Core content, release explanations, stack guides and build guides remain free.
- **Priority/status:** Must have; approved baseline.
- **Acceptance criteria:** Public access to core content does not require payment or a public account.

## Out of scope

- [Confirmed] Public accounts and a public AI assistant.
- [Confirmed] Automated publication of unverified release summaries.
- [Assumption] Paid content, subscriptions and monetization are outside this MVP.
- [Assumption] Real-time community features, comments and user-generated content are deferred.

## Product constraints and open questions

- [Confirmed] Official sources and traceability are required for release claims; never invent versions, release dates, credentials or API access.
- [Confirmed] Editors review source-derived drafts before publication; corrections can be recorded.
- [Confirmed] Success is evaluated through useful search outcomes, guide engagement, working project completions, return visits and actionable feedback. Numerical targets and analytics consent/retention policy remain open.
- [Open question] Which administrators and identity provider will be used? Resolve before Phase 6; public accounts remain out of scope.
- [Resolved for initial curation] Eight Stack Guide topics have been selected and source references added. They remain in review while examples are checked; seed automation does not publish them.

## Approval and change history

The product owner approved the PDF as the initial specification on 20 October 2026. The user authorized planning and sequential MVP implementation in this request. Changes that materially alter this scope must be recorded here and in the implementation plan.

## Delivery architecture update

The user approved a separate frontend and backend before Phase 2: `apps/web` renders the product with Next.js and Tailwind CSS; `apps/api` owns backend logic and MongoDB through Fastify and Mongoose; `packages/shared` contains only reusable API contracts. This changes delivery boundaries, not the product scope above. The browser continues to use the web application; Next.js makes server-side requests to Fastify.

### Phase 2 delivery notes

The Technology Explorer now exposes published catalog entries with text search, category filtering and pagination. Technology detail pages include the approved content sections, official documentation references and version values only when verified. The initial 12 records are seeded from official documentation links; current-version fields remain explicitly unverified until an official release source is checked. Search is MongoDB-backed and does not require an external provider.

### Phase 3 Release Intelligence delivery notes

The release feed and detail pages show published, human-reviewed release explanations with traceable source titles/URLs, applicability, and verification timestamps. Automated source checks may insert draft candidates only; a detected upstream version does not become a public summary or imply verified change analysis. Official npm package metadata, Node.js distribution metadata and Docker Engine/Moby release data are polled; JavaScript TC39, PostgreSQL, MongoDB and Git source pages remain manual sources. The Phase 3 Atlas scan created 20 draft candidates. Public feed/detail endpoints exclude drafts. Review and publication routes remain unavailable until the Phase 6 identity provider is configured.

### Phase 4 Stack Guide delivery notes

The stack explorer and detail route are implemented with source links, architecture, prerequisites, compatibility notes, code examples, troubleshooting and related technology links. Eight curated records are created only in `review` status by the insert-only seed. Public APIs filter to published records and exclude guides whose related technologies are unpublished. The example snippets still require editorial verification before any record is published.

### Phase 5 Build Guide delivery notes

The build explorer and detail route cover the REST Task API, Real-Time Chat and Full-Stack CRUD projects. Each seeded guide includes learning objectives, prerequisites, required technologies, architecture, implementation steps with decision explanations and code, testing instructions, common errors, expected outcome and official references. Seeds are insert-only and stay in `review`; the snippets have not been executed end to end, so no guide is available publicly until editorial verification and publication.
