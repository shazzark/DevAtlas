import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./api-client.js";

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json" },
});

describe("server-side API client recovery", () => {
  beforeEach(() => {
    vi.stubEnv("API_BASE_URL", "https://api.example.test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("retries one temporary upstream response and returns the recovered result", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ error: { code: "UNAVAILABLE", message: "Unavailable" } }, 503))
      .mockResolvedValueOnce(jsonResponse({ status: "ok" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiClient.getHealth()).resolves.toEqual({ status: 200, data: { status: "ok" } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry permanent API errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: { code: "NOT_FOUND", message: "Not found" } }, 404));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiClient.getTechnology("missing")).rejects.toMatchObject({ status: 404 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("allows only one concurrent request to perform a retry", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ error: { code: "UNAVAILABLE", message: "Unavailable" } }, 503))
      .mockResolvedValueOnce(jsonResponse({ error: { code: "UNAVAILABLE", message: "Unavailable" } }, 503))
      .mockResolvedValueOnce(jsonResponse({ status: "ok" }));
    vi.stubGlobal("fetch", fetchMock);

    const results = await Promise.allSettled([apiClient.getHealth(), apiClient.getHealth()]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  });
});
