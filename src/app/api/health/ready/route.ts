import { NextResponse } from "next/server";
import { connectToDatabase, MissingMongoUriError } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json({ status: "ready" });
  } catch (error: unknown) {
    const message =
      error instanceof MissingMongoUriError
        ? "MONGODB_URI is not configured"
        : "Database is unavailable";

    return NextResponse.json(
      { status: "not_ready", message },
      { status: 503 },
    );
  }
}
