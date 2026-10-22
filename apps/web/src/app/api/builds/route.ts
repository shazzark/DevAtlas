import { NextRequest, NextResponse } from "next/server";
import { ApiClientError, apiClient } from "@/lib/api-client";
import { apiErrorSchema, buildGuideListQuerySchema } from "@devatlas/shared";

export async function GET(request: NextRequest) {
  const query = buildGuideListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!query.success) return NextResponse.json({ error: { code: "INVALID_QUERY", message: "Build guide filters are invalid" } }, { status: 400 });
  try {
    const result = await apiClient.listBuildGuides(query.data);
    return NextResponse.json(result.data, { status: result.status, headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiClientError) {
      const parsed = apiErrorSchema.safeParse(error.body);
      return NextResponse.json(parsed.success ? parsed.data : { error: { code: "API_ERROR", message: "Build guide request could not be completed" } }, { status: error.status });
    }
    return NextResponse.json({ error: { code: "API_UNAVAILABLE", message: "Build guide service is temporarily unavailable" } }, { status: 503 });
  }
}
