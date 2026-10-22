import { z } from "zod";

export const searchCategorySchema = z.enum(["technology", "release", "stack", "build"]);
export type SearchCategory = z.infer<typeof searchCategorySchema>;
export const searchQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: searchCategorySchema.optional(),
  technologySlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
}).strict();
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export const searchResultSchema = z.object({
  category: searchCategorySchema,
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string(),
  href: z.string().startsWith("/"),
  technologySlugs: z.array(z.string()),
}).strict();
export const searchResponseSchema = z.object({
  items: z.array(searchResultSchema),
  related: z.array(searchResultSchema),
  pagination: z.object({ page: z.number().int(), limit: z.number().int(), totalItems: z.number().int(), totalPages: z.number().int() }).strict(),
}).strict();
export type SearchResult = z.infer<typeof searchResultSchema>;
