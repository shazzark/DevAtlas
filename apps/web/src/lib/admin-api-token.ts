import "server-only";
import { SignJWT } from "jose";
import { auth, adminAuthConfigurationReady, adminGitHubIds } from "@/auth";

const issuer = "devatlas-web";
const audience = "devatlas-api";

export async function createAdminApiToken(): Promise<string | null> {
  if (!adminAuthConfigurationReady()) return null;
  let session;
  try { session = await auth(); }
  catch { return null; }
  const githubId = session?.user?.id;
  const secret = process.env.ADMIN_API_JWT_SECRET;
  if (!session?.user?.isAdmin || !githubId || !adminGitHubIds().has(githubId) || !secret || secret.length < 32) return null;
  return new SignJWT({ role: "admin" }).setProtectedHeader({ alg: "HS256" })
    .setIssuer(issuer).setAudience(audience).setSubject(githubId).setIssuedAt().setExpirationTime("30s")
    .sign(new TextEncoder().encode(secret));
}
