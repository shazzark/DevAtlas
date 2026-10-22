import type { FastifyInstance } from "fastify";
import { buildGuideListQuerySchema } from "@devatlas/shared";
import { BuildGuideNotFoundError, BuildGuideService } from "./service.js";

export function registerBuildGuideRoutes(app: FastifyInstance, service = new BuildGuideService(), connectDatabase: () => Promise<void> = async () => undefined): void {
  app.get("/api/build-guides", async (request, reply) => {
    const parsed = buildGuideListQuerySchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: { code: "INVALID_QUERY", message: "Build guide filters are invalid" } });
    try { await connectDatabase(); }
    catch { return reply.code(503).send({ error: { code: "DATABASE_UNAVAILABLE", message: "Build guide service is temporarily unavailable" } }); }
    return reply.code(200).send(await service.list(parsed.data));
  });

  app.get<{ Params: { slug: string } }>("/api/build-guides/:slug", async (request, reply) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(request.params.slug)) return reply.code(400).send({ error: { code: "INVALID_SLUG", message: "Build guide slug is invalid" } });
    try { await connectDatabase(); }
    catch { return reply.code(503).send({ error: { code: "DATABASE_UNAVAILABLE", message: "Build guide service is temporarily unavailable" } }); }
    try { return reply.code(200).send(await service.get(request.params.slug)); }
    catch (error) {
      if (error instanceof BuildGuideNotFoundError) return reply.code(404).send({ error: { code: "NOT_FOUND", message: error.message } });
      throw error;
    }
  });
}
