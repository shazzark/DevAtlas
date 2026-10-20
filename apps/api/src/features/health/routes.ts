import type { FastifyInstance } from "fastify";
import { healthResponseSchema, readinessResponseSchema } from "@devatlas/shared";
import { MissingMongoUriError } from "../../infrastructure/database/mongoose.js";

export type ReadinessCheck = () => Promise<void>;

export function registerHealthRoutes(app: FastifyInstance, checkDatabase: ReadinessCheck): void {
  app.get("/api/health", async (_request, reply) => {
    reply.header("cache-control", "no-store");
    return reply.code(200).send(healthResponseSchema.parse({ status: "ok" }));
  });

  app.get("/api/health/ready", async (_request, reply) => {
    reply.header("cache-control", "no-store");
    try {
      await checkDatabase();
      return reply.code(200).send(readinessResponseSchema.parse({ status: "ready" }));
    } catch (error) {
      // Driver errors may contain connection details; expose only a stable public status.
      const message = error instanceof MissingMongoUriError ? error.message : "Database unavailable";
      app.log.warn("Readiness dependency check failed");
      return reply.code(503).send(readinessResponseSchema.parse({ status: "not_ready", message }));
    }
  });
}
