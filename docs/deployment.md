# DevAtlas deployment

DevAtlas is a Node.js monorepo with two independently deployed services. The Next.js web service calls the Fastify API over a server-side URL; only the API connects to MongoDB Atlas. This guide prepares either service for a Node 22 hosting platform without choosing a vendor or deploying it.

## Build and runtime commands

Set the repository root as each service's checkout/build directory. Use Node.js 22 (Node 20.9 or newer is required by the project).

| Service | Build command | Start command | Health check |
|---|---|---|---|
| API | `npm ci && npm run build` | `npm run start --workspace=@devatlas/api` | `/api/health` for process liveness; `/api/health/ready` after Atlas is configured |
| Web | `npm ci && npm run build` | `npm run start --workspace=@devatlas/web` | `/api/health` |

Both services build the shared workspace as part of the root build. Do not set a service working directory to `apps/api` or `apps/web`; workspace resolution expects the monorepo root. The platform must provide its assigned `PORT`. Set API `HOST=0.0.0.0` so the platform can route requests to it.

## API environment

- `MONGODB_URI`: Atlas URI for the production database, with a dedicated least-privilege application user and database name. Store it as a secret.
- `HOST=0.0.0.0` and platform `PORT`.
- `LOG_LEVEL=info` (or `warn` after launch observation).
- `ADMIN_API_JWT_SECRET`: shared secret of at least 32 characters. Set the same secret on the web service. Generate a distinct random value for production; do not reuse local/test values.

In Atlas, allow network access from the API host's outbound addresses. Prefer a private network connection or stable egress allow-list. Do not use a broad `0.0.0.0/0` rule as a permanent production setting. Atlas database and network credentials are supplied by the operator; they are not stored in this repository.

## Web environment

- `API_BASE_URL`: private/internal URL of the API service, including scheme and port if required. It must be reachable from the web server and must not be browser-exposed.
- `SITE_URL`: public HTTPS origin, with no path or trailing route (for example `https://devatlas.example`). It supplies canonical metadata and sitemap links. Set it at build and runtime.
- `AUTH_SECRET`: unique random Auth.js session secret.
- `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`: GitHub OAuth app credentials.
- `ADMIN_GITHUB_IDS`: comma-separated numeric GitHub account IDs allowed to administer content.
- `ADMIN_API_JWT_SECRET`: the same production secret configured on the API service.

Set the GitHub OAuth callback URL to `https://<public-web-host>/api/auth/callback/github`; add the matching local callback only to a development OAuth app. Follow [`admin-access.md`](admin-access.md) for secret generation and account-ID lookup. Admin routes stay closed if any required value is missing or malformed.

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
