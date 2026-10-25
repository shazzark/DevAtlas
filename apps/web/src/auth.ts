import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { adminAuthConfigurationReady, adminGitHubIds, authCallbacks } from "./auth-policy";

export { adminAuthConfigurationReady, adminGitHubIds } from "./auth-policy";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [GitHub({ authorization: { params: { scope: "read:user user:email" } } })],
  pages: { signIn: "/admin/login" },
  callbacks: authCallbacks,
});
