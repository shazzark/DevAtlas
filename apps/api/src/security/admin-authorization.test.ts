import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { createAdminAuthorizer, adminJwtAudience, adminJwtIssuer } from "./admin-authorization.js";

const secret = "unit-test-secret-that-is-at-least-thirty-two-bytes";
const key = new TextEncoder().encode(secret);

async function issue(claims: Record<string, unknown> = {}) {
  return new SignJWT({ role: "admin", ...claims }).setProtectedHeader({ alg: "HS256" })
    .setIssuer(adminJwtIssuer).setAudience(adminJwtAudience).setSubject("123456")
    .setIssuedAt().setExpirationTime("30s").sign(key);
}

describe("admin API authorization", () => {
  it("fails closed when no signing key is configured", () => {
    expect(createAdminAuthorizer(undefined)).toBeUndefined();
  });

  it("accepts an unexpired admin assertion from the web issuer", async () => {
    const authorize = createAdminAuthorizer(secret)!;
    expect(await authorize({ headers: { authorization: `Bearer ${await issue()}` } } as never)).toEqual({ actorId: "123456" });
  });

  it("rejects missing, wrong-role, and wrong-issuer credentials", async () => {
    const authorize = createAdminAuthorizer(secret)!;
    expect(await authorize({ headers: {} } as never)).toBeNull();
    expect(await authorize({ headers: { authorization: `Bearer ${await issue({ role: "visitor" })}` } } as never)).toBeNull();
    const wrongIssuer = await new SignJWT({ role: "admin" }).setProtectedHeader({ alg: "HS256" })
      .setIssuer("unknown").setAudience(adminJwtAudience).setSubject("editor@example.com").setIssuedAt().setExpirationTime("30s").sign(key);
    expect(await authorize({ headers: { authorization: `Bearer ${wrongIssuer}` } } as never)).toBeNull();
  });
});
