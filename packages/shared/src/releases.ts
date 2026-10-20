import { z } from "zod";

export const releaseEditorialStatusSchema = z.enum(["draft", "review", "published"]);
export const releaseListQuerySchema = z.object({
  technologySlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});
export type ReleaseListQuery = z.infer<typeof releaseListQuerySchema>;

const releaseChangeSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2_000),
  importance: z.enum(["high", "medium", "low"]),
}).strict();

const releaseCodeExampleSchema = z.object({
  title: z.string().trim().min(1).max(120),
  language: z.string().trim().min(1).max(40),
  code: z.string().min(1).max(12_000),
  explanation: z.string().trim().min(1).max(1_000),
}).strict();

export const releaseEditorialContentSchema = z.object({
  summary: z.string().trim().min(30).max(500),
  whyItMatters: z.string().trim().min(30).max(4_000),
  importantChanges: z.array(releaseChangeSchema).min(1).max(30),
  breakingChanges: z.array(z.string().trim().min(1).max(2_000)).max(30),
  migrationGuidance: z.string().trim().min(10).max(8_000),
  upgradeConsiderations: z.array(z.string().trim().min(1).max(2_000)).min(1).max(30),
  codeExamples: z.array(releaseCodeExampleSchema).max(20),
}).strict();

export const releaseReviewDecisionSchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("submit_for_review"), content: releaseEditorialContentSchema }).strict(),
  z.object({ decision: z.literal("return_to_draft") }).strict(),
  z.object({ decision: z.literal("publish"), content: releaseEditorialContentSchema, verificationConfirmed: z.literal(true) }).strict(),
]);

export const releaseSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  technologySlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  technologyName: z.string().min(1),
  version: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  whyItMatters: z.string().min(1),
  importantChanges: z.array(releaseChangeSchema),
  breakingChanges: z.array(z.string()),
  migrationGuidance: z.string(),
  upgradeConsiderations: z.array(z.string()),
  codeExamples: z.array(releaseCodeExampleSchema),
  sourceUrl: z.string().url(),
  sourceTitle: z.string().min(1),
  sourcePublishedAt: z.string().datetime().nullable(),
  lastVerifiedAt: z.string().datetime(),
}).strict();
export type Release = z.infer<typeof releaseSchema>;
export type ReleaseEditorialContent = z.infer<typeof releaseEditorialContentSchema>;

export const releaseListResponseSchema = z.object({
  items: z.array(releaseSchema),
  pagination: z.object({ page: z.number().int(), limit: z.number().int(), totalItems: z.number().int(), totalPages: z.number().int() }).strict(),
}).strict();
export const releaseDetailResponseSchema = z.object({ item: releaseSchema }).strict();

export const releaseCandidateSchema = z.object({
  slug: z.string(),
  technologySlug: z.string(),
  technologyName: z.string(),
  version: z.string(),
  title: z.string(),
  sourceUrl: z.string().url(),
  sourceTitle: z.string(),
  sourceExcerpt: z.string().nullable(),
  sourcePublishedAt: z.string().datetime().nullable(),
  lastDetectedAt: z.string().datetime(),
  status: z.enum(["draft", "review"]),
}).strict();
export const releaseCandidateListResponseSchema = z.object({ items: z.array(releaseCandidateSchema) }).strict();
export const releaseReviewResultSchema = z.object({
  slug: z.string(),
  status: releaseEditorialStatusSchema,
  lastVerifiedAt: z.string().datetime().nullable(),
}).strict();

export const releaseMonitorReportSchema = z.object({
  checkedAt: z.string().datetime(),
  checkedSources: z.number().int().nonnegative(),
  failedSources: z.number().int().nonnegative(),
  newCandidates: z.number().int().nonnegative(),
  discoveredCandidates: z.number().int().nonnegative(),
  failures: z.array(z.object({ sourceKey: z.string(), code: z.string() }).strict()),
}).strict();
export type ReleaseMonitorReport = z.infer<typeof releaseMonitorReportSchema>;
