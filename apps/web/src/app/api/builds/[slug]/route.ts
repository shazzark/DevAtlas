import { NextResponse } from "next/server";
import { ApiClientError, apiClient } from "@/lib/api-client";
import { apiErrorSchema } from "@devatlas/shared";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const result = await apiClient.getBuildGuide(slug);
    return NextResponse.json(result.data, { status: result.status, headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiClientError) {
      const parsed = apiErrorSchema.safeParse(error.body);
      return NextResponse.json(parsed.success ? parsed.data : { error: { code: "API_ERROR", message: "Build guide request could not be completed" } }, { status: error.status });
    }
    return NextResponse.json({ error: { code: "API_UNAVAILABLE", message: "Build guide service is temporarily unavailable" } }, { status: 503 });
  }
}
