import { z } from "zod";

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const referenceSchema = z.object({ label: z.string().trim().min(1).max(100), url: z.string().url() }).strict();
const exampleSchema = z.object({ title: z.string().trim().min(1).max(120), language: z.string().trim().min(1).max(40), code: z.string().min(1).max(24_000), explanation: z.string().trim().min(1).max(2_000) }).strict();

export const buildGuideListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  technologySlug: slugSchema.optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
}).strict();
export type BuildGuideListQuery = z.infer<typeof buildGuideListQuerySchema>;

export const buildGuideSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  learningObjectives: z.array(z.string().min(1)).min(1),
  prerequisites: z.array(z.string().min(1)).min(1),
  technologies: z.array(z.object({ slug: slugSchema, name: z.string().min(1) }).strict()).min(2),
  architecture: z.string().min(1),
  steps: z.array(z.object({
    title: z.string().min(1),
    objective: z.string().min(1),
    explanation: z.string().min(1),
    decision: z.string().min(1),
    examples: z.array(exampleSchema).min(1),
  }).strict()).min(1),
  testingInstructions: z.array(z.object({ title: z.string().min(1), command: z.string().min(1), expectedResult: z.string().min(1) }).strict()).min(1),
  commonErrors: z.array(z.object({ problem: z.string().min(1), cause: z.string().min(1), solution: z.string().min(1) }).strict()).min(1),
  outcome: z.string().min(1),
  references: z.array(referenceSchema).min(1),
  lastVerifiedAt: z.string().datetime(),
}).strict();
export type BuildGuide = z.infer<typeof buildGuideSchema>;

export const buildGuideListResponseSchema = z.object({
  items: z.array(buildGuideSchema),
  pagination: z.object({ page: z.number().int(), limit: z.number().int(), totalItems: z.number().int(), totalPages: z.number().int() }).strict(),
}).strict();
export const buildGuideDetailResponseSchema = z.object({ item: buildGuideSchema }).strict();
