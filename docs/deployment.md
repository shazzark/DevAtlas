# DevAtlas deployment

DevAtlas is a Node.js monorepo with two independently deployed services. The Next.js web service calls the Fastify API from server-side code; only the API connects to MongoDB Atlas. For a Vercel + Render deployment, the API URL is public HTTPS because those providers do not share a private network. Keep that URL in the server-only `API_BASE_URL` setting; the browser uses same-origin Next.js routes and does not call the Fastify host directly.

## Build and runtime commands

Use Node.js 24 for both services. The project supports Node.js 22.12 through 24.x. Render uses the repository root. Vercel uses `apps/web` as its app root and includes workspace files outside that directory during builds.

| Service | Platform settings | Build command | Start command | Health check |
|---|---|---|---|---|
| API on Render | Root directory `/`; Node `24.22.1`; `HOST=0.0.0.0`; use Render's `PORT` | `npm ci && npm run build --workspace=@devatlas/shared && npm run build --workspace=@devatlas/api` | `npm run start --workspace=@devatlas/api` | `/api/health/ready` for database readiness; `/api/health` for liveness |
| Web on Vercel | Root directory `apps/web`; Node `24.x`; enable “Include source files outside of the Root Directory in the Build Step” | `npm ci` | `npm run build --workspace=@devatlas/shared && npm run build --workspace=@devatlas/web` | Vercel-managed Next.js runtime | `/` and `/api/health` |

The shared package must be built before each application because each workspace imports its compiled output. Render's web service must bind to `0.0.0.0` and its assigned `PORT`. For Vercel, keep the framework preset as Next.js and leave the output directory at its Next.js default; do not override it. npm discovers the root workspace and lockfile when invoked from `apps/web`, so do not use `cd ../..` in Vercel commands. This configuration depends on the outside-root source option so Turbopack can read `packages/shared` and the root package files.

## API environment

- `MONGODB_URI`: Atlas URI for the production database, with a dedicated least-privilege application user and database name. Store it as a secret.
- `HOST=0.0.0.0` and platform `PORT`.
- `LOG_LEVEL=info` (or `warn` after launch observation).
- `ADMIN_API_JWT_SECRET`: shared secret of at least 32 characters. Set the same secret on the web service. Generate a distinct random value for production; do not reuse local/test values.

In Atlas, use a dedicated application database user scoped to the `devatlas_prod` database and allow the API host's outbound addresses. Render free services use shared regional outbound IP ranges, not dedicated static addresses; check Render's current Outbound IP list for the selected region and keep the Atlas IP access list synchronized. Render dedicated outbound IPs are paid. Atlas Free clusters do not support private endpoints or network peering. Do not use `0.0.0.0/0` as a shortcut. Never put the Atlas URI in Vercel settings or a GitHub Actions workflow: only the API should connect to Atlas. Keep development and test database URIs separate from `devatlas_prod`.

## Web environment

- `API_BASE_URL`: public HTTPS origin of the Render API (for example, `https://<service>.onrender.com`). It is used only by Next.js server-side code and must not be prefixed with `NEXT_PUBLIC_` or sent to browser code. Do not use Render's private hostname from Vercel.
- `SITE_URL`: public HTTPS origin, with no path or trailing route (for example `https://devatlas.example`). It supplies canonical metadata and sitemap links. Set it at build and runtime.
- `AUTH_SECRET`: unique random Auth.js session secret.
- `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`: GitHub OAuth app credentials.
- `ADMIN_GITHUB_IDS`: comma-separated numeric GitHub account IDs allowed to administer content.
- `ADMIN_API_JWT_SECRET`: the same production secret configured on the API service.

Set the GitHub OAuth callback URL to `https://<public-web-host>/api/auth/callback/github`; add the matching local callback only to a development OAuth app. Follow [`admin-access.md`](admin-access.md) for secret generation and account-ID lookup. Admin routes stay closed if any required value is missing or malformed. No CORS allow-list is needed for the current web-to-API calls because Next.js performs them server-side; admin browser mutations go to same-origin Next.js routes, which enforce the request origin before forwarding a signed assertion. The Fastify service remains directly reachable over HTTPS, but its administrative APIs require the short-lived signed bearer assertion.

## Release monitoring

The repository provides the one-shot command `npm run monitor:releases --workspace=@devatlas/api`. It reads `MONGODB_URI` and runs sequentially, inserting detected candidates as drafts. No scheduled workflow is configured. Do not put `MONGODB_URI` or `ADMIN_API_JWT_SECRET` in GitHub Actions: GitHub-hosted runner addresses are dynamic and cannot be narrowly allowed in Atlas, and the admin signing key authorizes publishing as well as monitoring. A dedicated least-privilege monitor endpoint and credential do not exist. For the beta, follow the manual monitoring procedure below; all detected candidates still go through the existing editorial review before publication.

### Manual beta procedure

1. From a controlled machine with outbound access allowed by the Atlas network access list, set the API's `MONGODB_URI` in a protected `apps/api/.env` file; do not use production credentials on a shared machine.
2. From the repository root, run `npm run monitor:releases --workspace=@devatlas/api` and review its source counts and failures. The command adds candidates as drafts and does not publish them.
3. Sign in to `/admin` with an allow-listed GitHub account. Check each new candidate against its official source, edit its editorial summary, and submit it for review.
4. Complete the normal editorial review and explicit verification confirmation before publishing. If source checks fail, record the failure and rerun the monitor later.
5. Remove the temporary production URI from the local environment when finished. Keep the monitoring report and editorial audit trail with the release review records.

## Free-tier limits

This configuration is suitable for a low-traffic, noncommercial demonstration, not a reliability-backed production launch. Vercel Hobby is limited to personal/noncommercial use. Render Free sleeps after 15 minutes without inbound traffic and takes about a minute to wake. Server-side API reads keep a four-second attempt timeout and make at most one retry after a temporary network, 502, 503 or 504 failure; only one retry can run at a time per web process. That caps API waiting to about 8.2 seconds, below the 10-second Hobby default when Fluid Compute is disabled; the implementation does not rely on Hobby's longer Fluid Compute duration. The admin proxy is explicitly capped at 10 seconds and stops waiting for Fastify after eight seconds. Neither limit waits through Render's full cold start. The first page request can therefore show a temporary-unavailability message with a retry link; once Render wakes, retry the page. Permanent API errors and HTTP 429 rate limits are not retried, and admin mutations are never retried automatically. Vercel and Render do not share private networking, so the Fastify HTTPS endpoint is public and relies on its existing authentication, authorization, validation and rate limits. Render may restart or suspend services. Atlas Free has constrained storage/performance and no private networking; backups are limited and optional. Treat a free deployment as best-effort and keep recoverable copies of important production content.

## Vercel project settings

- Framework Preset: `Next.js`.
- Root Directory: `apps/web`.
- Include source files outside of the Root Directory in the Build Step: enabled.
- Install Command: `npm ci`.
- Build Command: `npm run build --workspace=@devatlas/shared && npm run build --workspace=@devatlas/web`.
- Output Directory: Next.js default (leave override disabled).
- Node.js Version: `24.x`.
- Production, Preview, and Development environments: configure only the appropriate server-side variables listed above. Never define a `NEXT_PUBLIC_API_BASE_URL` or expose `ADMIN_API_JWT_SECRET` to client code.

## Render API service settings

- Service type: Web Service; plan: Free; runtime: Node.
- Root Directory: repository root (`/`).
- Build Command: `npm ci && npm run build --workspace=@devatlas/shared && npm run build --workspace=@devatlas/api`.
- Start Command: `npm run start --workspace=@devatlas/api`.
- Health Check Path: `/api/health/ready`.
- Environment: `NODE_VERSION=24.22.1`, `HOST=0.0.0.0`, and the API variables listed above. Render supplies `PORT`; do not hardcode a different port.
- Region: choose a region and use the service's displayed shared outbound IP ranges to configure the Atlas IP access list. Vercel calls the public `https://<service>.onrender.com` address.

## Launch smoke checks

1. Confirm the API readiness endpoint returns `200` and `{"status":"ready"}` with Atlas connected.
2. Confirm web `/`, `/tools`, `/whats-new`, `/stacks`, `/builds`, `/search`, `/robots.txt`, and `/sitemap.xml` return successfully.
3. Confirm public content APIs return only published records with verification timestamps and valid public technology relationships.
4. Confirm `/admin` redirects to sign-in for an anonymous visitor; an account outside `ADMIN_GITHUB_IDS` cannot authenticate as an admin.
5. Sign in with the configured allow-listed account and verify a review or draft action is audited before using production content.
6. Confirm API network access is private to the web service and administrator, and Atlas accepts connections only from the API runtime.
7. Review logs for readiness, source-monitor failures and rate limiting. Release monitoring creates reviewable candidates; it does not publish them.

## Operational limits

The API limiter currently uses per-process memory. Run one API instance for the MVP or add a platform-level/shared limiter before scaling horizontally; in-memory limits do not coordinate between instances. The default API ceiling accommodates the server-side web BFF and is not a substitute for an edge denial-of-service control. Configure platform request size and timeout limits to at least match the API's 1 MiB body cap and bounded upstream calls.

The GitHub OAuth callback, production Atlas network path, outbound official-source access and host-specific health behavior require the operator's credentials and selected hosting account. They cannot be verified from this local workspace. No deployment or Git push has been performed.
