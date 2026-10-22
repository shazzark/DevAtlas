import type { FastifyInstance } from "fastify";
import { stackGuideListQuerySchema } from "@devatlas/shared";
import { StackGuideNotFoundError, StackGuideService } from "./service.js";

export function registerStackGuideRoutes(app: FastifyInstance, service = new StackGuideService(), connectDatabase: () => Promise<void> = async () => undefined): void {
  app.get("/api/stacks", async (request, reply) => {
    const parsed = stackGuideListQuerySchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: { code: "INVALID_QUERY", message: "Stack guide filters are invalid" } });
    try { await connectDatabase(); }
    catch { return reply.code(503).send({ error: { code: "DATABASE_UNAVAILABLE", message: "Stack guide service is temporarily unavailable" } }); }
    return reply.code(200).send(await service.list(parsed.data));
  });

  app.get<{ Params: { slug: string } }>("/api/stacks/:slug", async (request, reply) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(request.params.slug)) return reply.code(400).send({ error: { code: "INVALID_SLUG", message: "Stack guide slug is invalid" } });
    try { await connectDatabase(); }
    catch { return reply.code(503).send({ error: { code: "DATABASE_UNAVAILABLE", message: "Stack guide service is temporarily unavailable" } }); }
    try { return reply.code(200).send(await service.get(request.params.slug)); }
    catch (error) {
      if (error instanceof StackGuideNotFoundError) return reply.code(404).send({ error: { code: "NOT_FOUND", message: error.message } });
      throw error;
    }
  });
}
