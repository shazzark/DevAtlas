import type { FastifyRequest } from "fastify";
import { jwtVerify } from "jose";
import type { ReleaseReviewAuthorizer } from "../features/releases/routes.js";

const issuer = "devatlas-web";
const audience = "devatlas-api";

export function createAdminAuthorizer(secret: string | undefined): ReleaseReviewAuthorizer | undefined {
  if (!secret) return undefined;
  const key = new TextEncoder().encode(secret);

  return async (request: FastifyRequest) => {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) return null;
    try {
      const { payload } = await jwtVerify(authorization.slice(7), key, {
        algorithms: ["HS256"], issuer, audience, maxTokenAge: "30s", clockTolerance: 5,
      });
      if (payload.role !== "admin" || typeof payload.sub !== "string" || !/^\d{1,20}$/.test(payload.sub)) return null;
      return { actorId: payload.sub };
    } catch {
      return null;
    }
  };
}

export const adminJwtAudience = audience;
export const adminJwtIssuer = issuer;
