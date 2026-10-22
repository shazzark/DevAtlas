export function siteUrl(path = ""): URL {
  const value = process.env.SITE_URL ?? "http://localhost:3000";
  const url = new URL(value);
  if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("SITE_URL must be an HTTP or HTTPS origin without credentials, path, query, or fragment");
  }
  return new URL(path, url);
}
