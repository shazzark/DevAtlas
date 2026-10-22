import mongoose, { type InferSchemaType } from "mongoose";

const { Schema } = mongoose;

const stackGuideSchema = new Schema({
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  title: { type: String, required: true, trim: true },
  summary: { type: String, required: true },
  // Store stable technology slugs and resolve names from the technology collection on reads.
  technologySlugs: { type: [String], required: true, validate: { validator: (slugs: string[]) => slugs.length >= 2 && new Set(slugs).size === slugs.length } },
  prerequisites: { type: [String], required: true, validate: { validator: (values: string[]) => values.length > 0 } },
  compatibility: { type: [String], required: true, validate: { validator: (values: string[]) => values.length > 0 } },
  architecture: { type: String, required: true },
  steps: { type: [{ title: { type: String, required: true }, explanation: { type: String, required: true }, code: { title: { type: String, required: true }, language: { type: String, required: true }, code: { type: String, required: true }, explanation: { type: String, required: true } } }], required: true, validate: { validator: (values: unknown[]) => values.length > 0 } },
  troubleshooting: { type: [{ problem: { type: String, required: true }, solution: { type: String, required: true } }], required: true, validate: { validator: (values: unknown[]) => values.length > 0 } },
  references: { type: [{ label: { type: String, required: true }, url: { type: String, required: true } }], required: true, validate: { validator: (values: unknown[]) => values.length > 0 } },
  lastVerifiedAt: { type: Date, default: null },
  status: { type: String, enum: ["draft", "review", "published"], required: true, default: "draft" },
}, { timestamps: true, strict: "throw", collection: "stack_guides" });

stackGuideSchema.index({ status: 1, title: 1, _id: 1 }, { name: "published_stack_guides" });
stackGuideSchema.index({ status: 1, technologySlugs: 1, title: 1 }, { name: "stack_guides_by_technology" });
stackGuideSchema.index({ title: "text", summary: "text", architecture: "text" }, { name: "stack_guide_search" });

export type StackGuideRecord = InferSchemaType<typeof stackGuideSchema>;
export const StackGuideModel = mongoose.models.StackGuide ?? mongoose.model("StackGuide", stackGuideSchema);
