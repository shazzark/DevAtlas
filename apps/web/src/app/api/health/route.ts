import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await apiClient.getHealth();
    return NextResponse.json(result.data, { status: result.status, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: { code: "API_UNAVAILABLE", message: "Backend API is unavailable" } }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
