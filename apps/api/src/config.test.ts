import { describe, expect, it } from "vitest";
import { parseEnvironment } from "./config.js";

describe("API environment configuration", () => {
  it("allows local startup without MongoDB but applies safe local defaults", () => {
    expect(parseEnvironment({})).toEqual({
      mongoUri: undefined,
      host: "127.0.0.1",
      port: 4001,
      logLevel: "info",
    });
  });

  it("accepts an explicit MongoDB URI without exposing it in the parsed config error", () => {
    const config = parseEnvironment({ MONGODB_URI: "mongodb://127.0.0.1:27017/devatlas_test" });
    expect(config.mongoUri).toBe("mongodb://127.0.0.1:27017/devatlas_test");
  });

  it("accepts an Atlas URI configured with DATABASE_URL", () => {
    const config = parseEnvironment({ DATABASE_URL: "mongodb+srv://test-user:test-password@cluster.example.mongodb.net/devatlas_test" });
    expect(config.mongoUri).toBe("mongodb+srv://test-user:test-password@cluster.example.mongodb.net/devatlas_test");
  });

  it("rejects conflicting MongoDB URI environment variables", () => {
    expect(() => parseEnvironment({
      MONGODB_URI: "mongodb://127.0.0.1:27017/devatlas_test",
      DATABASE_URL: "mongodb+srv://test-user:test-password@cluster.example.mongodb.net/devatlas_test",
    })).toThrow("MONGODB_URI");
  });

  it("rejects an invalid port and reports only the variable name", () => {
    expect(() => parseEnvironment({ PORT: "70000" })).toThrow("PORT");
  });
});
