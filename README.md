# DevAtlas

Stay current. Understand the tools. Connect the stack. Build better.

DevAtlas is a free, source-aware learning platform for software technologies, releases, stack integrations and practical projects. Product scope and delivery decisions are in [`docs/`](docs/).

## Workspace architecture

- `apps/web`: Next.js App Router, React, strict TypeScript and Tailwind CSS. It renders the site and exposes narrow server-side BFF routes.
- `apps/api`: Fastify, strict TypeScript, Zod and Mongoose. It owns all MongoDB connections, repositories and backend services.
- `packages/shared`: Small Zod response schemas and TypeScript contracts shared by the web and API. It contains no credentials or server-only code.

The browser talks to the web app. Next.js calls Fastify through a server-only typed API client, so the MongoDB URI and backend URL stay on the server. CORS is not enabled because browser requests do not go directly to Fastify. A future worker can be a separate workspace/process without depending on the web application.

## Requirements and setup

- Node.js 20.9 or newer and npm
- MongoDB for readiness to report ready; the application can start without a database URI

1. Run `npm install` from the repository root.
2. Copy `apps/api/.env.example` to `apps/api/.env`. Set `MONGODB_URI` only to a local/development or dedicated test database when needed.
3. Copy `apps/web/.env.example` to `apps/web/.env.local` if the Fastify API is not at its local default.
4. Run `npm run dev` from the repository root. Next.js uses port 3000 and Fastify uses port 4001 by default.

Each app can also be started independently with `npm run dev --workspace=@devatlas/web` or `npm run dev --workspace=@devatlas/api`. The shared package is built first by the root development/build scripts.
For a container or hosted Fastify deployment, set `HOST=0.0.0.0` as required by that environment and set the web app's private `API_BASE_URL` to the backend service address. Keep network access restricted to the web/backend path.

## API and health

Fastify implements `GET /api/health` (`200 {"status":"ok"}`) and `GET /api/health/ready` (`200 {"status":"ready"}` after a real MongoDB ping, otherwise `503 {"status":"not_ready","message":"..."}`). The web app proxies these through same-path BFF routes for frontend-to-backend checks. Database driver details and connection strings are not returned to callers.

The Technology Explorer adds `GET /api/technologies?q=&category=&page=&limit=` (`200 {"items":[],"pagination":{},"categories":[]}`) and `GET /api/technologies/:slug` (`200 {"item":{...}}`). Invalid query input returns `400`; missing or unpublished slugs return `404`; unavailable MongoDB returns a safe `503`. Matching same-origin BFF routes are available at `/api/technologies` and `/api/technologies/:slug`.

With a local or dedicated development `MONGODB_URI` configured, seed the approved catalog using `npm run seed:technologies --workspace=@devatlas/api`. This idempotently upserts only the 12 technology slugs and leaves current version values unset until verified.

## Verification

- `npm run typecheck` builds shared contracts and checks all workspaces with strict TypeScript.
- `npm test` runs shared-contract and API unit/integration tests. Live Mongo readiness and technology tests run only when `PHASE15_MONGODB_TEST_URI` and `PHASE2_MONGODB_TEST_URI` point to dedicated local/test databases. The technology suite creates and removes only uniquely named fixture records.
- `npm run build` builds shared contracts, the Fastify API and Next.js web app.
- `npm run test:e2e` runs Playwright against the web and API started together. The technology journeys expect the local database to have been seeded. Install Chromium once with `npx playwright install chromium` if needed.

Tailwind CSS v4 is the primary web styling system, with the existing CSS variables mapped to Tailwind theme tokens. Global CSS retains the theme values, base styles and the distinctive atlas illustration. React Icons remain the icon set.

## Environment variables

`apps/api/.env.example`: `MONGODB_URI`, `PHASE15_MONGODB_TEST_URI`, `PHASE2_MONGODB_TEST_URI`, `HOST`, `PORT`, and `LOG_LEVEL`.

`apps/web/.env.example`: server-only `API_BASE_URL`.

Use real Atlas credentials only in protected local environment files or a secret manager. Never commit secrets. Atlas credentials and a hosting target are not required for local development or the catalog integration tests.
