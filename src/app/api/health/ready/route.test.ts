import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => {
  class MissingMongoUriError extends Error {
    constructor() {
      super("MONGODB_URI is not configured");
    }
  }

  return { connectToDatabase: vi.fn(), MissingMongoUriError };
});

import {
  connectToDatabase,
  MissingMongoUriError,
} from "@/lib/db";
import { GET } from "./route";

const connectMock = vi.mocked(connectToDatabase);

describe("GET /api/health/ready", () => {
  beforeEach(() => {
    vi.stubEnv("MONGODB_URI", "");
    connectMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 503 when MONGODB_URI is missing", async () => {
    connectMock.mockRejectedValue(new MissingMongoUriError());

    const response = await GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      status: "not_ready",
      message: "MONGODB_URI is not configured",
    });
  });

  it("returns ready only after the database connection is active", async () => {
    connectMock.mockResolvedValue(undefined);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ready" });
  });

  it("returns a safe 503 response when the database connection fails", async () => {
    connectMock.mockRejectedValue(new Error("private host and credentials"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      status: "not_ready",
      message: "Database is unavailable",
    });
    expect(JSON.stringify(body)).not.toContain(
      "private host and credentials",
    );
  });
});
