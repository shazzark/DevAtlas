# DevAtlas

Stay current. Understand the tools. Connect the stack. Build better.

DevAtlas is a free, source-aware learning platform for software technologies, releases, stack integrations and practical projects. The approved product scope and delivery plan live in [`docs/`](docs/).

## Requirements

- Node.js 20.9 or newer
- npm
- MongoDB for database-backed features and readiness checks (a local development database can be used)

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `MONGODB_URI` to a local or dedicated development database when database-backed work is needed. The public shell can run without it.
3. Run `npm run dev` and open `http://localhost:3000`.

`GET /api/health` checks that the application process responds. `GET /api/health/ready` returns HTTP 200 only when Mongoose has connected to the configured MongoDB; it returns HTTP 503 when the URI is missing or the database is unavailable. The endpoint never returns the URI or driver error.

## Checks

- `npm run typecheck` checks strict TypeScript types.
- `npm test` runs Vitest.
- `npm run build` creates a production build.
- `npm run test:e2e` runs Playwright and starts a local development server when needed. Install the Playwright browser once with `npx playwright install chromium` if it is not already available.

The app shell includes responsive navigation, light/dark themes and an unavailable search entry until search is implemented. Public release content is not populated with unverified data.

## Configuration

Only `MONGODB_URI` is used in Phase 1. Keep real connection strings in local environment configuration or a secret manager; never commit them. `.env.example` intentionally contains no credentials.
