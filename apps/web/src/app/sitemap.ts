import type { MetadataRoute } from "next";
import { apiClient } from "@/lib/api-client";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = new Set(["/", "/tools", "/whats-new", "/stacks", "/builds", "/search"]);
  try {
    const firstPage = await apiClient.search({ page: 1, limit: 48 });
    for (const item of firstPage.data.items) paths.add(item.href);
    const remainingPages = Array.from({ length: Math.min(Math.max(firstPage.data.pagination.totalPages - 1, 0), 999) }, (_, index) => index + 2);
    const rest = await Promise.all(remainingPages.map((page) => apiClient.search({ page, limit: 48 })));
    for (const result of rest) for (const item of result.data.items) paths.add(item.href);
  } catch {
    // Keep the public static routes discoverable while the content API is unavailable.
  }
  return [...paths].map((path) => ({ url: siteUrl(path).toString(), changeFrequency: path === "/" ? "weekly" : "monthly", priority: path === "/" ? 1 : 0.7 }));
}
