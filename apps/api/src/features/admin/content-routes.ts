import type { FastifyInstance, FastifyRequest } from "fastify";
import mongoose, { type Model } from "mongoose";
import { z } from "zod";
import { BuildGuideModel } from "../build-guides/model.js";
import { StackGuideModel } from "../stack-guides/model.js";
import { TechnologyModel } from "../technologies/model.js";
import { AdminAuditEventModel, writeAdminAuditEvent } from "./audit-model.js";
import type { ReleaseReviewAuthorizer } from "../releases/routes.js";

const contentTypeSchema = z.enum(["technologies", "stacks", "build-guides"]);
const statusSchema = z.enum(["draft", "review", "published"]);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const contentWriteSchema = z.object({ content: z.record(z.string(), z.unknown()) }).strict();
const workflowSchema = z.object({ expectedStatus: statusSchema, status: statusSchema, verificationConfirmed: z.boolean().optional() }).strict();

const models: Record<z.infer<typeof contentTypeSchema>, Model<any>> = {
  technologies: TechnologyModel,
  stacks: StackGuideModel,
  "build-guides": BuildGuideModel,
};

export type AdminRouteDependencies = { authorize?: ReleaseReviewAuthorizer; connectDatabase?: () => Promise<void>; audit?: typeof writeAdminAuditEvent };

function actorId(request: FastifyRequest): string | null {
  return (request as FastifyRequest & { adminActorId?: string }).adminActorId ?? null;
}

export function registerAdminContentRoutes(app: FastifyInstance, dependencies: AdminRouteDependencies = {}): void {
  const readLimit = { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } };
  const writeLimit = { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } };
  const authorize = async (request: FastifyRequest, reply: { code: (status: number) => { send: (body: unknown) => unknown } }) => {
    if (!dependencies.authorize) {
      reply.code(503).send({ error: { code: "ADMIN_AUTH_UNAVAILABLE", message: "Admin authorization is not configured" } });
      return false;
    }
    const actor = await dependencies.authorize(request);
    if (!actor) {
      reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Admin access is required" } });
      return false;
    }
    try { await dependencies.connectDatabase?.(); }
    catch {
      reply.code(503).send({ error: { code: "DATABASE_UNAVAILABLE", message: "Admin service is temporarily unavailable" } });
      return false;
    }
    (request as FastifyRequest & { adminActorId?: string }).adminActorId = actor.actorId;
    return true;
  };

  app.get("/api/admin/content/:type", readLimit, async (request, reply) => {
    if (!await authorize(request, reply)) return;
    const type = contentTypeSchema.safeParse((request.params as { type?: unknown }).type);
    const status = statusSchema.optional().safeParse((request.query as { status?: unknown }).status);
    if (!type.success || !status.success) return reply.code(400).send({ error: { code: "INVALID_FILTER", message: "Admin content filter is invalid" } });
    const filter = status.data ? { status: status.data } : {};
    const records = await models[type.data].find(filter).sort({ updatedAt: -1, _id: -1 }).limit(100).lean();
    return reply.code(200).send({ items: records });
  });

  app.post<{ Params: { type: string } }>("/api/admin/content/:type", writeLimit, async (request, reply) => {
    if (!await authorize(request, reply)) return;
    const type = contentTypeSchema.safeParse(request.params.type);
    const body = contentWriteSchema.safeParse(request.body);
    if (!type.success || !body.success || "status" in body.data.content || "_id" in body.data.content) return reply.code(400).send({ error: { code: "INVALID_CONTENT", message: "Admin content is invalid" } });
    const Model = models[type.data];
    const slug = body.data.content.slug;
    if (typeof slug !== "string" || !slugPattern.test(slug)) return reply.code(400).send({ error: { code: "INVALID_SLUG", message: "Content slug is invalid" } });
    try {
      await (dependencies.audit ?? writeAdminAuditEvent)({ actorId: actorId(request), action: "content.create.requested", entityType: type.data, entitySlug: slug, previousStatus: null, nextStatus: "draft", changedFields: Object.keys(body.data.content).sort() });
      const document = new Model({ ...body.data.content, status: "draft" });
      await document.validate();
      await document.save();
      await (dependencies.audit ?? writeAdminAuditEvent)({ actorId: actorId(request), action: "content.created", entityType: type.data, entitySlug: slug, previousStatus: null, nextStatus: "draft", changedFields: Object.keys(body.data.content).sort() });
      return reply.code(201).send({ item: document.toObject() });
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.StrictModeError) return reply.code(400).send({ error: { code: "INVALID_CONTENT", message: "Admin content failed validation" } });
      if ((error as { code?: number }).code === 11000) return reply.code(409).send({ error: { code: "CONTENT_EXISTS", message: "Content with this slug already exists" } });
      throw error;
    }
  });

  app.patch<{ Params: { type: string; slug: string } }>("/api/admin/content/:type/:slug", writeLimit, async (request, reply) => {
    if (!await authorize(request, reply)) return;
    const type = contentTypeSchema.safeParse(request.params.type);
    const body = contentWriteSchema.safeParse(request.body);
    if (!type.success || !body.success || "status" in body.data.content || "slug" in body.data.content || "_id" in body.data.content || !slugPattern.test(request.params.slug)) return reply.code(400).send({ error: { code: "INVALID_CONTENT", message: "Admin content is invalid" } });
    const document = await models[type.data].findOne({ slug: request.params.slug });
    if (!document) return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Admin content was not found" } });
    if (document.status === "published") return reply.code(409).send({ error: { code: "PUBLISHED_CONTENT_LOCKED", message: "Return published content to draft before editing" } });
    const previousStatus = document.status as string;
    try {
      await (dependencies.audit ?? writeAdminAuditEvent)({ actorId: actorId(request), action: "content.update.requested", entityType: type.data, entitySlug: request.params.slug, previousStatus, nextStatus: previousStatus, changedFields: Object.keys(body.data.content).sort() });
      document.set(body.data.content);
      await document.validate();
      await document.save();
      await (dependencies.audit ?? writeAdminAuditEvent)({ actorId: actorId(request), action: "content.updated", entityType: type.data, entitySlug: request.params.slug, previousStatus, nextStatus: previousStatus, changedFields: Object.keys(body.data.content).sort() });
      return reply.code(200).send({ item: document.toObject() });
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.StrictModeError) return reply.code(400).send({ error: { code: "INVALID_CONTENT", message: "Admin content failed validation" } });
      throw error;
    }
  });

  app.patch<{ Params: { type: string; slug: string } }>("/api/admin/content/:type/:slug/workflow", writeLimit, async (request, reply) => {
    if (!await authorize(request, reply)) return;
    const type = contentTypeSchema.safeParse(request.params.type);
    const workflow = workflowSchema.safeParse(request.body);
    if (!type.success || !workflow.success || !slugPattern.test(request.params.slug)) return reply.code(400).send({ error: { code: "INVALID_WORKFLOW", message: "Content workflow input is invalid" } });
    const { expectedStatus, status } = workflow.data;
    const allowed = (expectedStatus === "draft" && status === "review") || (expectedStatus === "review" && (status === "draft" || status === "published")) || (expectedStatus === "published" && status === "draft");
    if (!allowed) return reply.code(409).send({ error: { code: "INVALID_TRANSITION", message: "Content status transition is not allowed" } });
    const Model = models[type.data];
    const current = await Model.findOne({ slug: request.params.slug, status: expectedStatus });
    if (!current) return reply.code(409).send({ error: { code: "WORKFLOW_CONFLICT", message: "Content status changed; reload and try again" } });
    if (status === "published") {
      if (workflow.data.verificationConfirmed !== true) return reply.code(400).send({ error: { code: "VERIFICATION_REQUIRED", message: "Confirm source and example verification before publication" } });
      const verifiedAt = type.data === "technologies" ? current.version?.lastVerifiedAt : current.lastVerifiedAt;
      if (!verifiedAt) return reply.code(400).send({ error: { code: "VERIFICATION_DATE_REQUIRED", message: "Set a verification date before publication" } });
      if (type.data !== "technologies") {
        const relatedSlugs = current.technologySlugs as string[];
        const relatedCount = await TechnologyModel.countDocuments({ slug: { $in: relatedSlugs }, status: "published" });
        if (relatedSlugs.length < 2 || relatedCount !== relatedSlugs.length) return reply.code(400).send({ error: { code: "RELATED_TECHNOLOGY_UNAVAILABLE", message: "Publish all related technologies before this guide" } });
      }
    }
    await (dependencies.audit ?? writeAdminAuditEvent)({ actorId: actorId(request), action: `content.status.${status}.requested`, entityType: type.data, entitySlug: request.params.slug, previousStatus: expectedStatus, nextStatus: status, changedFields: ["status"] });
    const updated = await Model.findOneAndUpdate({ _id: current._id, status: expectedStatus }, { $set: { status } }, { returnDocument: "after", runValidators: true }).lean();
    if (!updated) return reply.code(409).send({ error: { code: "WORKFLOW_CONFLICT", message: "Content status changed; reload and try again" } });
    await (dependencies.audit ?? writeAdminAuditEvent)({ actorId: actorId(request), action: `content.status.${status}`, entityType: type.data, entitySlug: request.params.slug, previousStatus: expectedStatus, nextStatus: status, changedFields: ["status"] });
    return reply.code(200).send({ item: updated });
  });

  app.get("/api/admin/audit", readLimit, async (request, reply) => {
    if (!await authorize(request, reply)) return;
    const items = await AdminAuditEventModel.find().sort({ createdAt: -1, _id: -1 }).limit(100).lean();
    return reply.code(200).send({ items });
  });
}
