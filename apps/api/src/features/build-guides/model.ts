import mongoose, { type InferSchemaType } from "mongoose";

const { Schema } = mongoose;
const exampleSchema = new Schema({
  title: { type: String, required: true }, language: { type: String, required: true },
  code: { type: String, required: true }, explanation: { type: String, required: true },
}, { _id: false, strict: "throw" });
const stepSchema = new Schema({
  title: { type: String, required: true }, objective: { type: String, required: true },
  explanation: { type: String, required: true }, decision: { type: String, required: true },
  examples: { type: [exampleSchema], required: true, validate: { validator: (values: unknown[]) => values.length > 0 } },
}, { _id: false, strict: "throw" });

const buildGuideSchema = new Schema({
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  title: { type: String, required: true, trim: true },
  summary: { type: String, required: true },
  learningObjectives: { type: [String], required: true, validate: { validator: (values: string[]) => values.length > 0 } },
  prerequisites: { type: [String], required: true, validate: { validator: (values: string[]) => values.length > 0 } },
  technologySlugs: { type: [String], required: true, validate: { validator: (slugs: string[]) => slugs.length >= 2 && new Set(slugs).size === slugs.length } },
  architecture: { type: String, required: true },
  steps: { type: [stepSchema], required: true, validate: { validator: (values: unknown[]) => values.length > 0 } },
  testingInstructions: { type: [{ title: { type: String, required: true }, command: { type: String, required: true }, expectedResult: { type: String, required: true } }], required: true, validate: { validator: (values: unknown[]) => values.length > 0 } },
  commonErrors: { type: [{ problem: { type: String, required: true }, cause: { type: String, required: true }, solution: { type: String, required: true } }], required: true, validate: { validator: (values: unknown[]) => values.length > 0 } },
  outcome: { type: String, required: true },
  references: { type: [{ label: { type: String, required: true }, url: { type: String, required: true } }], required: true, validate: { validator: (values: unknown[]) => values.length > 0 } },
  lastVerifiedAt: { type: Date, default: null },
  status: { type: String, enum: ["draft", "review", "published"], required: true, default: "draft" },
}, { timestamps: true, strict: "throw", collection: "build_guides" });

buildGuideSchema.index({ status: 1, title: 1, _id: 1 }, { name: "published_build_guides" });
buildGuideSchema.index({ status: 1, technologySlugs: 1, title: 1 }, { name: "build_guides_by_technology" });
buildGuideSchema.index({ title: "text", summary: "text", architecture: "text" }, { name: "build_guide_search" });

export type BuildGuideRecord = InferSchemaType<typeof buildGuideSchema>;
export const BuildGuideModel = mongoose.models.BuildGuide ?? mongoose.model("BuildGuide", buildGuideSchema);
