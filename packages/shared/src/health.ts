import { z } from "zod";

export const healthResponseSchema = z.object({ status: z.literal("ok") }).strict();
export const readinessResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("ready") }).strict(),
  z.object({ status: z.literal("not_ready"), message: z.string() }).strict(),
]);

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;
