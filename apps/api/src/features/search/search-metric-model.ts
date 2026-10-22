import mongoose, { type InferSchemaType } from "mongoose";

const { Schema } = mongoose;
const searchMetricSchema = new Schema({
  date: { type: String, required: true },
  category: { type: String, enum: ["all", "technology", "release", "stack", "build"], required: true },
  hasKeyword: { type: Boolean, required: true },
  searches: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true },
}, { strict: "throw", collection: "search_daily_metrics" });

searchMetricSchema.index({ date: 1, category: 1, hasKeyword: 1 }, { unique: true, name: "daily_search_metric_bucket" });
searchMetricSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "search_metric_retention" });

type SearchMetric = InferSchemaType<typeof searchMetricSchema>;
export const SearchMetricModel = mongoose.models.SearchMetric ?? mongoose.model("SearchMetric", searchMetricSchema);

export async function recordSearchMetric(input: { category?: SearchMetric["category"]; hasKeyword: boolean }, now = new Date()) {
  const date = now.toISOString().slice(0, 10);
  const expiresAt = new Date(`${date}T00:00:00.000Z`);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + 366);
  await SearchMetricModel.updateOne(
    { date, category: input.category ?? "all", hasKeyword: input.hasKeyword },
    { $inc: { searches: 1 }, $setOnInsert: { date, category: input.category ?? "all", hasKeyword: input.hasKeyword, expiresAt } },
    { upsert: true },
  );
}
