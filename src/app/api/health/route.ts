import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const [db, cache] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    redis.ping(),
  ]);
  const ok = db.status === "fulfilled" && cache.status === "fulfilled";
  return NextResponse.json(
    {
      ok,
      db: db.status,
      redis: cache.status,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 }
  );
}
