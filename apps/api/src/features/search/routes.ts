import type { FastifyInstance } from "fastify";
import { searchQuerySchema } from "@devatlas/shared";
import { SearchService } from "./service.js";
import { recordSearchMetric } from "./search-metric-model.js";

export function registerSearchRoutes(app: FastifyInstance, service = new SearchService(), connectDatabase: () => Promise<void> = async () => undefined, recordMetric = recordSearchMetric) {
  app.get("/api/search", async (request, reply) => {
    const query = searchQuerySchema.safeParse(request.query);
    if (!query.success) return reply.code(400).send({ error: { code: "INVALID_QUERY", message: "Search filters are invalid" } });
    try { await connectDatabase(); }
    catch { return reply.code(503).send({ error: { code: "DATABASE_UNAVAILABLE", message: "Search is temporarily unavailable" } }); }
    const response = await service.search(query.data);
    try { await recordMetric({ category: query.data.category ?? "all", hasKeyword: Boolean(query.data.q) }); }
    catch (error) { request.log.warn({ err: { name: error instanceof Error ? error.name : "UnknownError" } }, "Search metric update failed"); }
    return reply.code(200).send(response);
  });
}
