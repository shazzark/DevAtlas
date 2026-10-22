import { z } from "zod";

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const linkSchema = z.object({ label: z.string().trim().min(1).max(100), url: z.string().url() }).strict();
const codeSchema = z.object({ title: z.string().trim().min(1).max(120), language: z.string().trim().min(1).max(40), code: z.string().min(1).max(20_000), explanation: z.string().trim().min(1).max(2_000) }).strict();

export const stackGuideListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  technologySlug: slugSchema.optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
}).strict();
export type StackGuideListQuery = z.infer<typeof stackGuideListQuerySchema>;

export const stackGuideSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  technologies: z.array(z.object({ slug: slugSchema, name: z.string().min(1) }).strict()).min(2),
  prerequisites: z.array(z.string().min(1)).min(1),
  compatibility: z.array(z.string().min(1)).min(1),
  architecture: z.string().min(1),
  steps: z.array(z.object({ title: z.string().min(1), explanation: z.string().min(1), code: codeSchema }).strict()).min(1),
  troubleshooting: z.array(z.object({ problem: z.string().min(1), solution: z.string().min(1) }).strict()).min(1),
  references: z.array(linkSchema).min(1),
  lastVerifiedAt: z.string().datetime(),
}).strict();
export type StackGuide = z.infer<typeof stackGuideSchema>;

export const stackGuideListResponseSchema = z.object({
  items: z.array(stackGuideSchema),
  pagination: z.object({ page: z.number().int(), limit: z.number().int(), totalItems: z.number().int(), totalPages: z.number().int() }).strict(),
}).strict();
export const stackGuideDetailResponseSchema = z.object({ item: stackGuideSchema }).strict();
