import Fastify, { type FastifyInstance } from "fastify";
import type { ApiConfig } from "./config.js";
import { closeMongoConnection, checkMongoReadiness } from "./infrastructure/database/mongoose.js";
import { registerHealthRoutes, type ReadinessCheck } from "./features/health/routes.js";

export type AppDependencies = {
  checkDatabase?: ReadinessCheck;
  closeDatabase?: () => Promise<void>;
};

export function buildApp(config: ApiConfig, dependencies: AppDependencies = {}): FastifyInstance {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      redact: ["req.headers.authorization", "req.headers.cookie", "*.MONGODB_URI", "*.mongoUri"],
    },
    bodyLimit: 1_048_576,
    trustProxy: false,
  });

  const checkDatabase = dependencies.checkDatabase ?? (() => checkMongoReadiness(config.mongoUri));
  registerHealthRoutes(app, checkDatabase);
  app.addHook("onClose", async () => {
    await (dependencies.closeDatabase ?? closeMongoConnection)();
  });
  app.setNotFoundHandler((_request, reply) => reply.code(404).send({ error: { code: "NOT_FOUND", message: "Route not found" } }));
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: { name: error instanceof Error ? error.name : "UnknownError" } }, "Request failed");
    return reply.code(500).send({ error: { code: "INTERNAL_ERROR", message: "Request could not be completed" } });
  });

  return app;
}
