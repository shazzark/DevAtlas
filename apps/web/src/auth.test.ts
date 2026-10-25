import type { Account } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminGitHubIds, authCallbacks } from "./auth-policy";

const githubAccount = (providerAccountId: string, provider = "github"): Account => ({
  provider,
  providerAccountId,
  type: "oauth",
});

const sessionFixture = { user: { id: "", isAdmin: false }, expires: "2030-01-01T00:00:00.000Z" };

describe("GitHub admin authentication callbacks", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_GITHUB_IDS", "12345, 67890");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses only comma-separated numeric GitHub IDs", () => {
    vi.stubEnv("ADMIN_GITHUB_IDS", " 12345,not-an-id,,67890 ");

    expect(adminGitHubIds()).toEqual(new Set(["12345", "67890"]));
  });

  it("allows an approved GitHub account by its numeric provider account ID", async () => {
    await expect(authCallbacks.signIn({ user: { id: "authjs-random-uuid" }, account: githubAccount("12345") }))
      .resolves.toBe(true);
  });

  it.each([
    ["unapproved ID", githubAccount("99999")],
    ["other provider", githubAccount("12345", "google")],
    ["missing account", undefined],
    ["missing account ID", { provider: "github", type: "oauth" } as Account],
    ["nonnumeric account ID", githubAccount("admin-name")],
  ])("denies %s", async (_label, account) => {
    await expect(authCallbacks.signIn({ user: { id: "authjs-random-uuid" }, account }))
      .resolves.toBe(false);
  });

  it("carries the GitHub ID into the JWT and authorizes the session against the current allow-list", async () => {
    const token = await authCallbacks.jwt({ token: {} as JWT, user: { id: "authjs-random-uuid" }, account: githubAccount("12345") });
    const session = await authCallbacks.session({
      session: sessionFixture as never,
      token,
      user: { id: "authjs-random-uuid" } as never,
      newSession: false,
    });

    expect(token).toMatchObject({ githubId: "12345", isAdmin: true });
    expect(session.user).toMatchObject({ id: "12345", isAdmin: true });

    vi.stubEnv("ADMIN_GITHUB_IDS", "67890");
    const revokedSession = await authCallbacks.session({
      session: sessionFixture as never,
      token,
      user: { id: "authjs-random-uuid" } as never,
      newSession: false,
    });
    expect(revokedSession.user?.isAdmin).toBe(false);
  });

  it("clears authorization when the JWT callback receives an invalid GitHub account ID", async () => {
    const token = await authCallbacks.jwt({ token: { githubId: "12345", isAdmin: true } as JWT, user: { id: "authjs-random-uuid" }, account: githubAccount("invalid") });

    expect(token).toMatchObject({ isAdmin: false });
    expect(token.githubId).toBeUndefined();
  });
});
