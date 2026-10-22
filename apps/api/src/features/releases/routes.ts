import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  releaseCandidateListResponseSchema,
  releaseListQuerySchema,
  releaseMonitorReportSchema,
  releaseReviewDecisionSchema,
  releaseReviewResultSchema,
} from "@devatlas/shared";
import { ReleaseNotFoundError, ReleaseReviewConflictError, ReleaseService } from "./service.js";
import type { ReleaseMonitorService } from "./monitor-service.js";
import { writeAdminAuditEvent } from "../admin/audit-model.js";

export type ReleaseReviewActor = { actorId: string };
export type ReleaseReviewAuthorizer = (request: FastifyRequest) => Promise<ReleaseReviewActor | null>;

type ReleaseRouteDependencies = {
  service?: ReleaseService;
  monitor?: ReleaseMonitorService;
  authorizeReview?: ReleaseReviewAuthorizer;
  connectDatabase?: () => Promise<void>;
  audit?: typeof writeAdminAuditEvent;
};

export function registerReleaseRoutes(app: FastifyInstance, dependencies: ReleaseRouteDependencies = {}): void {
  const service = dependencies.service ?? new ReleaseService();
  app.get("/api/releases", async (request, reply) => {
    const query = releaseListQuerySchema.safeParse(request.query);
    if (!query.success) return reply.code(400).send({ error: { code: "INVALID_QUERY", message: "Release filters are invalid" } });
    try { await dependencies.connectDatabase?.(); }
    catch { return reply.code(503).send({ error: { code: "DATABASE_UNAVAILABLE", message: "Release service is temporarily unavailable" } }); }
    return reply.code(200).send(await service.list(query.data));
  });

  app.get<{ Params: { slug: string } }>("/api/releases/:slug", async (request, reply) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(request.params.slug)) return reply.code(400).send({ error: { code: "INVALID_SLUG", message: "Release slug is invalid" } });
    try { await dependencies.connectDatabase?.(); }
    catch { return reply.code(503).send({ error: { code: "DATABASE_UNAVAILABLE", message: "Release service is temporarily unavailable" } }); }
    try { return reply.code(200).send(await service.get(request.params.slug)); }
    catch (error) {
      if (error instanceof ReleaseNotFoundError) return reply.code(404).send({ error: { code: "NOT_FOUND", message: error.message } });
      throw error;
    }
  });

  const authorize = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!dependencies.authorizeReview) {
      reply.code(503).send({ error: { code: "REVIEW_AUTH_UNAVAILABLE", message: "Release review authorization is not configured" } });
      return null;
    }
    const actor = await dependencies.authorizeReview(request);
    if (!actor) {
      reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Release review access is required" } });
      return null;
    }
    try { await dependencies.connectDatabase?.(); }
    catch {
      reply.code(503).send({ error: { code: "DATABASE_UNAVAILABLE", message: "Release review service is temporarily unavailable" } });
      return null;
    }
    return actor;
  };
  const adminReadLimit = { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } };
  const adminWriteLimit = { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } };
  const monitorLimit = { config: { rateLimit: { max: 3, timeWindow: "1 minute" } } };

  app.get("/api/admin/releases/candidates", adminReadLimit, async (request, reply) => {
    if (!await authorize(request, reply)) return;
    return reply.code(200).send(releaseCandidateListResponseSchema.parse({ items: await service.candidates() }));
  });

  app.post("/api/admin/releases/monitor", monitorLimit, async (request, reply) => {
    const actor = await authorize(request, reply);
    if (!actor) return;
    if (!dependencies.monitor) return reply.code(503).send({ error: { code: "MONITOR_UNAVAILABLE", message: "Release monitoring is not configured" } });
    await dependencies.audit?.({ actorId: actor.actorId, action: "release.monitor.run.requested", entityType: "releases", entitySlug: "*", changedFields: [] });
    const report = releaseMonitorReportSchema.parse(await dependencies.monitor.run());
    await dependencies.audit?.({ actorId: actor.actorId, action: "release.monitor.run", entityType: "releases", entitySlug: "*", changedFields: [] });
    return reply.code(report.failedSources ? 207 : 200).send(report);
  });

  app.patch<{ Params: { slug: string } }>("/api/admin/releases/:slug/review", adminWriteLimit, async (request, reply) => {
    const actor = await authorize(request, reply);
    if (!actor) return;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(request.params.slug)) return reply.code(400).send({ error: { code: "INVALID_SLUG", message: "Release slug is invalid" } });
    const decision = releaseReviewDecisionSchema.safeParse(request.body);
    if (!decision.success) return reply.code(400).send({ error: { code: "INVALID_REVIEW", message: "Release review input is invalid" } });
    try {
      const transitions = { submit_for_review: ["draft", "review"], return_to_draft: ["review", "draft"], publish: ["review", "published"] } as const;
      const [previousStatus, nextStatus] = transitions[decision.data.decision];
      await dependencies.audit?.({ actorId: actor.actorId, action: `release.${decision.data.decision}.requested`, entityType: "releases", entitySlug: request.params.slug, previousStatus, nextStatus, changedFields: decision.data.decision === "return_to_draft" ? ["status"] : ["status", "summary", "whyItMatters", "importantChanges", "breakingChanges", "migrationGuidance", "upgradeConsiderations", "codeExamples"] });
      const result = releaseReviewResultSchema.parse(await service.review(request.params.slug, decision.data, actor.actorId));
      await dependencies.audit?.({ actorId: actor.actorId, action: `release.${decision.data.decision}`, entityType: "releases", entitySlug: request.params.slug, previousStatus, nextStatus, changedFields: decision.data.decision === "return_to_draft" ? ["status"] : ["status", "summary", "whyItMatters", "importantChanges", "breakingChanges", "migrationGuidance", "upgradeConsiderations", "codeExamples"] });
      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof ReleaseNotFoundError) return reply.code(404).send({ error: { code: "NOT_FOUND", message: error.message } });
      if (error instanceof ReleaseReviewConflictError) return reply.code(409).send({ error: { code: "REVIEW_CONFLICT", message: error.message } });
      throw error;
    }
  });
}
