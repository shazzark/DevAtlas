import { NextRequest, NextResponse } from "next/server";
import { ApiClientError, apiClient } from "@/lib/api-client";
import { apiErrorSchema, releaseListQuerySchema } from "@devatlas/shared";

export async function GET(request: NextRequest) {
  const query = releaseListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!query.success) return NextResponse.json({ error: { code: "INVALID_QUERY", message: "Release filters are invalid" } }, { status: 400 });
  try {
    const result = await apiClient.listReleases(query.data);
    return NextResponse.json(result.data, { status: result.status, headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiClientError) {
      const parsed = apiErrorSchema.safeParse(error.body);
      return NextResponse.json(parsed.success ? parsed.data : { error: { code: "API_ERROR", message: "Release request could not be completed" } }, { status: error.status });
    }
    return NextResponse.json({ error: { code: "API_UNAVAILABLE", message: "Release service is temporarily unavailable" } }, { status: 503 });
  }
}
