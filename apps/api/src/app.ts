import Fastify, { type FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import type { ApiConfig } from "./config.js";
import { closeMongoConnection, checkMongoReadiness, connectMongo } from "./infrastructure/database/mongoose.js";
import { registerHealthRoutes, type ReadinessCheck } from "./features/health/routes.js";
import { registerTechnologyRoutes } from "./features/technologies/routes.js";
import type { TechnologyService } from "./features/technologies/service.js";
import { registerReleaseRoutes, type ReleaseReviewAuthorizer } from "./features/releases/routes.js";
import { ReleaseService } from "./features/releases/service.js";
import { ReleaseMonitorService } from "./features/releases/monitor-service.js";
import { registerStackGuideRoutes } from "./features/stack-guides/routes.js";
import type { StackGuideService } from "./features/stack-guides/service.js";
import { registerBuildGuideRoutes } from "./features/build-guides/routes.js";
import type { BuildGuideService } from "./features/build-guides/service.js";
import { createAdminAuthorizer } from "./security/admin-authorization.js";
import { registerAdminContentRoutes } from "./features/admin/content-routes.js";
import { AdminAuditEventModel, writeAdminAuditEvent } from "./features/admin/audit-model.js";
import { TechnologyModel } from "./features/technologies/model.js";
import { ReleaseModel, ReleaseSourceModel } from "./features/releases/models.js";
import { StackGuideModel } from "./features/stack-guides/model.js";
import { BuildGuideModel } from "./features/build-guides/model.js";
import { registerSearchRoutes } from "./features/search/routes.js";
import type { SearchService } from "./features/search/service.js";
import { SearchMetricModel } from "./features/search/search-metric-model.js";

export type AppDependencies = {
  checkDatabase?: ReadinessCheck;
  closeDatabase?: () => Promise<void>;
  connectDatabase?: () => Promise<void>;
  technologyService?: TechnologyService;
  releaseService?: ReleaseService;
  releaseMonitor?: ReleaseMonitorService;
  stackGuideService?: StackGuideService;
  buildGuideService?: BuildGuideService;
  authorizeReleaseReview?: ReleaseReviewAuthorizer;
  adminAudit?: typeof writeAdminAuditEvent;
  searchService?: SearchService;
  recordSearchMetric?: (input: { category?: "all" | "technology" | "release" | "stack" | "build"; hasKeyword: boolean }) => Promise<void>;
};

export async function buildApp(config: ApiConfig, dependencies: AppDependencies = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      redact: ["req.headers.authorization", "req.headers.cookie", "*.MONGODB_URI", "*.mongoUri"],
    },
    bodyLimit: 1_048_576,
    trustProxy: false,
  });
  await app.register(rateLimit, { max: 3_000, timeWindow: "1 minute", skipOnError: false });

  const checkDatabase = dependencies.checkDatabase ?? (() => checkMongoReadiness(config.mongoUri));
  const connectDatabase = dependencies.connectDatabase ?? (async () => {
    await connectMongo(config.mongoUri);
    await Promise.all([TechnologyModel.init(), ReleaseModel.init(), ReleaseSourceModel.init(), StackGuideModel.init(), BuildGuideModel.init(), AdminAuditEventModel.init(), SearchMetricModel.init()]);
  });
  const authorizeAdmin = dependencies.authorizeReleaseReview ?? createAdminAuthorizer(config.adminApiJwtSecret);
  registerHealthRoutes(app, checkDatabase);
  registerTechnologyRoutes(app, dependencies.technologyService, connectDatabase);
  registerReleaseRoutes(app, {
    service: dependencies.releaseService ?? new ReleaseService(),
    monitor: dependencies.releaseMonitor ?? new ReleaseMonitorService(),
    authorizeReview: authorizeAdmin,
    connectDatabase,
    audit: dependencies.adminAudit ?? writeAdminAuditEvent,
  });
  registerStackGuideRoutes(app, dependencies.stackGuideService, connectDatabase);
  registerBuildGuideRoutes(app, dependencies.buildGuideService, connectDatabase);
  registerSearchRoutes(app, dependencies.searchService, connectDatabase, dependencies.recordSearchMetric);
  registerAdminContentRoutes(app, { authorize: authorizeAdmin, connectDatabase, audit: dependencies.adminAudit ?? writeAdminAuditEvent });
  app.addHook("onClose", async () => {
    await (dependencies.closeDatabase ?? closeMongoConnection)();
  });
  app.setNotFoundHandler((_request, reply) => reply.code(404).send({ error: { code: "NOT_FOUND", message: "Route not found" } }));
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof Error && "statusCode" in error && error.statusCode === 429) return reply.code(429).send({ error: { code: "RATE_LIMITED", message: "Too many requests. Try again shortly." } });
    request.log.error({ err: { name: error instanceof Error ? error.name : "UnknownError" } }, "Request failed");
    return reply.code(500).send({ error: { code: "INTERNAL_ERROR", message: "Request could not be completed" } });
  });

  return app;
}
