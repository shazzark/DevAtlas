import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export function adminGitHubIds(): Set<string> {
  return new Set((process.env.ADMIN_GITHUB_IDS ?? "").split(",").map((id) => id.trim()).filter((id) => /^\d+$/.test(id)));
}

export function adminAuthConfigurationReady(): boolean {
  const signingSecret = process.env.ADMIN_API_JWT_SECRET;
  return Boolean(process.env.AUTH_SECRET && process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET && signingSecret && signingSecret.length >= 32 && adminGitHubIds().size > 0);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [GitHub({ authorization: { params: { scope: "read:user user:email" } } })],
  pages: { signIn: "/admin/login" },
  callbacks: {
    async signIn({ user }) {
      return Boolean(user.id && adminGitHubIds().has(user.id));
    },
    async jwt({ token, user }) {
      if (user?.id) token.isAdmin = adminGitHubIds().has(user.id);
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.isAdmin = token.isAdmin === true && adminGitHubIds().has(session.user.id);
      }
      return session;
    },
  },
});
