import { z } from "zod";

const optionalMongoUri = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().url().refine((value) => value.startsWith("mongodb://") || value.startsWith("mongodb+srv://")).optional(),
);

const environmentSchema = z.object({
  MONGODB_URI: optionalMongoUri,
  // DATABASE_URL is accepted as a compatibility name for existing local configurations.
  DATABASE_URL: optionalMongoUri,
  HOST: z.string().trim().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4001),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
}).superRefine((environment, context) => {
  if (environment.MONGODB_URI && environment.DATABASE_URL && environment.MONGODB_URI !== environment.DATABASE_URL) {
    context.addIssue({ code: "custom", path: ["MONGODB_URI"], message: "MONGODB_URI and DATABASE_URL must match when both are set" });
  }
});

export type ApiConfig = {
  mongoUri: string | undefined;
  host: string;
  port: number;
  logLevel: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
};

export function parseEnvironment(environment: NodeJS.ProcessEnv): ApiConfig {
  const parsed = environmentSchema.safeParse(environment);
  if (!parsed.success) {
    throw new Error(`Invalid API configuration: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
  }
  return {
    mongoUri: parsed.data.MONGODB_URI ?? parsed.data.DATABASE_URL,
    host: parsed.data.HOST,
    port: parsed.data.PORT,
    logLevel: parsed.data.LOG_LEVEL,
  };
}
