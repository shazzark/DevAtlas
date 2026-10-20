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

## Verification

- `npm run typecheck` builds shared contracts and checks all workspaces with strict TypeScript.
- `npm test` runs shared-contract and API unit/integration tests. The live Mongo readiness test runs only when `PHASE15_MONGODB_TEST_URI` points to a dedicated local/test database; it performs a ping and writes no data.
- `npm run build` builds shared contracts, the Fastify API and Next.js web app.
- `npm run test:e2e` runs Playwright against the web and API started together. Install Chromium once with `npx playwright install chromium` if needed.

Tailwind CSS v4 is the primary web styling system, with the existing CSS variables mapped to Tailwind theme tokens. Global CSS retains the theme values, base styles and the distinctive atlas illustration. React Icons remain the icon set.

## Environment variables

`apps/api/.env.example`: `MONGODB_URI`, `PHASE15_MONGODB_TEST_URI`, `HOST`, `PORT`, and `LOG_LEVEL`.

`apps/web/.env.example`: server-only `API_BASE_URL`.

Use real Atlas credentials only in protected local environment files or a secret manager. Never commit secrets. Atlas credentials and a hosting target are not required for local work or the current health slice.
