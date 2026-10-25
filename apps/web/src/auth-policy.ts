import type { NextAuthConfig } from "next-auth";

export function adminGitHubIds(): Set<string> {
  return new Set((process.env.ADMIN_GITHUB_IDS ?? "").split(",").map((id) => id.trim()).filter((id) => /^\d+$/.test(id)));
}

function approvedGitHubAccountId(provider: string | undefined, providerAccountId: string | undefined): string | null {
  return provider === "github" && providerAccountId && /^\d+$/.test(providerAccountId)
    ? providerAccountId
    : null;
}

export function adminAuthConfigurationReady(): boolean {
  const signingSecret = process.env.ADMIN_API_JWT_SECRET;
  return Boolean(process.env.AUTH_SECRET && process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET && signingSecret && signingSecret.length >= 32 && adminGitHubIds().size > 0);
}

export const authCallbacks = {
  async signIn({ account }) {
    const githubId = approvedGitHubAccountId(account?.provider, account?.providerAccountId);
    return Boolean(githubId && adminGitHubIds().has(githubId));
  },
  async jwt({ token, account }) {
    if (account) {
      // Auth.js user.id is an internal UUID for OAuth; the account ID is GitHub's stable numeric ID.
      token.githubId = approvedGitHubAccountId(account.provider, account.providerAccountId) ?? undefined;
    }
    token.isAdmin = Boolean(token.githubId && adminGitHubIds().has(token.githubId));
    return token;
  },
  async session({ session, token }) {
    if (session.user) {
      session.user.id = token.githubId ?? "";
      session.user.isAdmin = token.isAdmin === true && Boolean(token.githubId && adminGitHubIds().has(token.githubId));
    }
    return session;
  },
} satisfies NonNullable<NextAuthConfig["callbacks"]>;
