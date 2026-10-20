import { z } from "zod";

export const technologyCategorySchema = z.enum(["language", "frontend", "backend", "database", "infrastructure", "tooling", "realtime"]);
export const technologyListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: technologyCategorySchema.optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

const sourceLinkSchema = z.object({ label: z.string().min(1).max(80), url: z.string().url() }).strict();
const codeExampleSchema = z.object({ title: z.string().min(1).max(100), language: z.string().min(1).max(40), code: z.string().min(1).max(12000), explanation: z.string().max(1000) }).strict();
export const technologySchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), name: z.string().min(1), category: technologyCategorySchema,
  shortDescription: z.string().min(1), overview: z.string().min(1), primaryUseCases: z.array(z.string()),
  whenToUse: z.array(z.string()), whenNotToUse: z.array(z.string()), installation: z.string().min(1), gettingStarted: z.string().min(1),
  keyConcepts: z.array(z.object({ title: z.string(), description: z.string() }).strict()), codeExamples: z.array(codeExampleSchema),
  alternatives: z.array(z.string()), relatedSlugs: z.array(z.string()), officialLinks: z.array(sourceLinkSchema),
  version: z.object({ current: z.string().nullable(), releasedAt: z.string().datetime().nullable(), sourceUrl: z.string().url().nullable(), lastVerifiedAt: z.string().datetime().nullable() }).strict(),
}).strict();
export const technologyListResponseSchema = z.object({ items: z.array(technologySchema), pagination: z.object({ page: z.number().int(), limit: z.number().int(), totalItems: z.number().int(), totalPages: z.number().int() }).strict(), categories: z.array(technologyCategorySchema) }).strict();
export const technologyDetailResponseSchema = z.object({ item: technologySchema }).strict();
export const technologyCategoriesResponseSchema = z.object({ categories: z.array(technologyCategorySchema) }).strict();
export const apiErrorSchema = z.object({ error: z.object({ code: z.string(), message: z.string() }).strict() }).strict();
export type Technology = z.infer<typeof technologySchema>;
export type TechnologyListQuery = z.infer<typeof technologyListQuerySchema>;
export type TechnologyListResponse = z.infer<typeof technologyListResponseSchema>;
