import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { parseEnvironment } from "../config.js";

describe("API rate limiting", () => {
  let app: Awaited<ReturnType<typeof buildApp>> | undefined;
  afterEach(async () => { await app?.close(); app = undefined; });

  it("limits admin reads independently of authentication outcome", async () => {
    app = await buildApp(parseEnvironment({ LOG_LEVEL: "silent" }), { authorizeReleaseReview: async () => null });
    let finalStatus = 0;
    let firstHeaders: Record<string, unknown> = {};
    for (let request = 0; request < 61; request += 1) {
      const response = await app.inject({ method: "GET", url: "/api/admin/content/technologies" });
      if (request === 0) firstHeaders = response.headers;
      finalStatus = response.statusCode;
    }
    expect(finalStatus, JSON.stringify(firstHeaders)).toBe(429);
  });
});
