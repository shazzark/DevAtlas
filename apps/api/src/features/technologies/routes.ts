import type { FastifyInstance } from "fastify";
import { technologyListQuerySchema } from "@devatlas/shared";
import { TechnologyNotFoundError, TechnologyService } from "./service.js";

export function registerTechnologyRoutes(app: FastifyInstance, service = new TechnologyService(), connectDatabase: () => Promise<void> = async () => undefined): void {
  app.get("/api/technologies", async (request, reply) => {
    const parsed = technologyListQuerySchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: { code: "INVALID_QUERY", message: "Technology filters are invalid" } });
    try { await connectDatabase(); }
    catch { return reply.code(503).send({ error: { code: "DATABASE_UNAVAILABLE", message: "Technology service is temporarily unavailable" } }); }
    return reply.code(200).send(await service.list(parsed.data));
  });
  app.get<{ Params: { slug: string } }>("/api/technologies/:slug", async (request, reply) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(request.params.slug)) return reply.code(400).send({ error: { code: "INVALID_SLUG", message: "Technology slug is invalid" } });
    try { await connectDatabase(); }
    catch { return reply.code(503).send({ error: { code: "DATABASE_UNAVAILABLE", message: "Technology service is temporarily unavailable" } }); }
    try { return reply.code(200).send(await service.get(request.params.slug)); }
    catch (error) {
      if (error instanceof TechnologyNotFoundError) return reply.code(404).send({ error: { code: "NOT_FOUND", message: error.message } });
      throw error;
    }
  });
}
