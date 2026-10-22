import mongoose from "mongoose";
const { Schema } = mongoose;

const releaseSchema = new Schema({
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  technologyId: { type: Schema.Types.ObjectId, ref: "Technology", required: true, index: true },
  technologySlug: { type: String, required: true, index: true },
  technologyName: { type: String, required: true },
  sourceKey: { type: String, required: true },
  sourceReleaseId: { type: String, required: true },
  version: { type: String, required: true },
  title: { type: String, required: true },
  sourceTitle: { type: String, required: true },
  sourceUrl: { type: String, required: true },
  sourcePublishedAt: { type: Date, default: null },
  sourceExcerpt: { type: String, maxlength: 20_000, default: null },
  lastDetectedAt: { type: Date, required: true },
  status: { type: String, enum: ["draft", "review", "published"], required: true, default: "draft" },
  summary: { type: String, default: "" },
  whyItMatters: { type: String, default: "" },
  importantChanges: { type: [{ title: String, description: String, importance: { type: String, enum: ["high", "medium", "low"] } }], default: [] },
  breakingChanges: { type: [String], default: [] },
  migrationGuidance: { type: String, default: "" },
  upgradeConsiderations: { type: [String], default: [] },
  codeExamples: { type: [{ title: String, language: String, code: String, explanation: String }], default: [] },
  lastVerifiedAt: { type: Date, default: null },
  reviewedAt: { type: Date, default: null },
  reviewedBy: { type: String, default: null },
  publishedAt: { type: Date, default: null },
}, { timestamps: true, strict: "throw", collection: "releases" });

releaseSchema.index({ sourceKey: 1, sourceReleaseId: 1 }, { unique: true, name: "release_source_identity" });
releaseSchema.index({ status: 1, sourcePublishedAt: -1, _id: -1 }, { name: "published_release_feed" });
releaseSchema.index({ status: 1, technologySlug: 1, sourcePublishedAt: -1, _id: -1 }, { name: "published_technology_releases" });
releaseSchema.index({ status: 1, updatedAt: -1 }, { name: "release_review_queue" });
releaseSchema.index({ title: "text", summary: "text", technologyName: "text", sourceExcerpt: "text" }, { name: "release_search" });

const releaseSourceSchema = new Schema({
  sourceKey: { type: String, required: true, unique: true },
  technologySlug: { type: String, required: true },
  technologyName: { type: String, required: true },
  kind: { type: String, enum: ["npm-latest", "node-dist-index", "github-releases", "manual"], required: true },
  endpoint: { type: String, default: null },
  officialUrl: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  etag: { type: String, default: null },
  lastCheckedAt: { type: Date, default: null },
  // Failed attempts update lastCheckedAt for operations, but only successful scans may advance the release cutoff.
  lastSuccessfulAt: { type: Date, default: null },
  lastStatus: { type: String, enum: ["unchecked", "ok", "error", "manual"], default: "unchecked" },
  lastErrorCode: { type: String, default: null },
}, { timestamps: true, strict: "throw", collection: "release_sources" });

releaseSourceSchema.index({ enabled: 1, kind: 1 }, { name: "enabled_release_sources" });

export const ReleaseModel = mongoose.models.Release ?? mongoose.model("Release", releaseSchema);
export const ReleaseSourceModel = mongoose.models.ReleaseSource ?? mongoose.model("ReleaseSource", releaseSourceSchema);
