# DevAtlas admin access

DevAtlas uses GitHub OAuth through Auth.js for human sign-in. The Next.js server admits only GitHub numeric account IDs in `ADMIN_GITHUB_IDS`; the browser never chooses an admin role. The Next.js backend-for-frontend mints an HS256 JWT valid for 30 seconds. Fastify verifies its algorithm, issuer, audience, age, role and subject before accepting any admin request. Missing API signing configuration leaves admin routes closed.

## Configure GitHub OAuth

Create a GitHub OAuth App for each environment. Set its callback URL to:

- Local development: `http://localhost:3000/api/auth/callback/github`
- Production: `https://<your-web-host>/api/auth/callback/github`

Set the web runtime variables `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` from that OAuth App. Generate `AUTH_SECRET` and `ADMIN_API_JWT_SECRET` as separate random values with at least 32 bytes of entropy. For example, run `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"` twice and store each output in the secret manager for both environments. Set the same `ADMIN_API_JWT_SECRET` in the web and API runtimes; do not share `AUTH_SECRET` with the API.

Set `ADMIN_GITHUB_IDS` in the web runtime to the comma-separated numeric GitHub account IDs that may administer this installation. To retrieve an account ID, use GitHub's authenticated `/user` API or `/users/<username>` endpoint and record its numeric `id`; do not use a username or email as the allow-list key. Leave this setting empty until the intended administrator IDs are known.

## Runtime settings

| Variable | Runtime | Purpose |
| --- | --- | --- |
| `AUTH_SECRET` | Next.js | Protects Auth.js session cookies and tokens. |
| `AUTH_GITHUB_ID` | Next.js | GitHub OAuth App client ID. |
| `AUTH_GITHUB_SECRET` | Next.js | GitHub OAuth App client secret. |
| `ADMIN_GITHUB_IDS` | Next.js | Comma-separated numeric GitHub account ID allow-list. |
| `ADMIN_API_JWT_SECRET` | Next.js and Fastify | Shared key for short-lived internal admin assertions; at least 32 characters. |

Admin pages send `noindex` metadata. Mutating same-origin BFF requests require the browser origin to match the web origin. Fastify independently checks the signed assertion and fails closed. Audit events record the actor, action, content slug, status transition and changed field names without copying full content bodies.

The GitHub OAuth App, values above, MongoDB Atlas URI, and production hostnames must be configured by the operator. No administrator credentials or OAuth secrets are committed in this repository.
