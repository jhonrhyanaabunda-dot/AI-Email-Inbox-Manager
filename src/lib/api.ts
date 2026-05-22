import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ForbiddenError } from "./permissions";
import { logger } from "./logger";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return fail(400, "Invalid request", { issues: err.flatten() });
  }
  if (err instanceof ForbiddenError) {
    return fail(err.message === "Not authenticated" ? 401 : 403, err.message);
  }
  if (err instanceof Error) {
    logger.error({ err }, "unhandled API error");
    return fail(500, "Internal error");
  }
  logger.error({ err }, "unknown error");
  return fail(500, "Internal error");
}
