import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    mode: "demo",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}
