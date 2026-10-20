import mongoose, { type InferSchemaType } from "mongoose";
const { Schema } = mongoose;

const technologySchema = new Schema({
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: ["language", "frontend", "backend", "database", "infrastructure", "tooling", "realtime"] },
  shortDescription: { type: String, required: true, maxlength: 220 }, overview: { type: String, required: true },
  primaryUseCases: { type: [String], required: true }, whenToUse: { type: [String], required: true }, whenNotToUse: { type: [String], required: true },
  installation: { type: String, required: true }, gettingStarted: { type: String, required: true },
  alternatives: { type: [String], default: [] },
  keyConcepts: { type: [{ title: { type: String, required: true }, description: { type: String, required: true } }], default: [] },
  codeExamples: { type: [{ title: { type: String, required: true }, language: { type: String, required: true }, code: { type: String, required: true }, explanation: { type: String, required: true } }], default: [] },
  relatedSlugs: { type: [String], default: [] }, officialLinks: { type: [{ label: { type: String, required: true }, url: { type: String, required: true } }], default: [] },
  version: { current: { type: String, default: null }, releasedAt: { type: Date, default: null }, sourceUrl: { type: String, default: null }, lastVerifiedAt: { type: Date, default: null } },
  status: { type: String, enum: ["draft", "review", "published"], default: "draft", required: true },
}, { timestamps: true, strict: "throw", collection: "technologies" });

technologySchema.index({ status: 1, category: 1, name: 1, _id: 1 });
technologySchema.index({ status: 1, name: 1, _id: 1 });
technologySchema.index({ name: "text", shortDescription: "text", overview: "text" }, { name: "technology_search" });

export type TechnologyRecord = InferSchemaType<typeof technologySchema>;
export const TechnologyModel = mongoose.models.Technology ?? mongoose.model("Technology", technologySchema);
