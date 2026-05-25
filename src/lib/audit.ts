import { prisma } from "./db";
import { logger } from "./logger";
import { toJsonColumn } from "./json-column";
import type { ActivityKind } from "./enums";

export interface AuditEntry {
  organizationId: string;
  userId?: string | null;
  kind: ActivityKind;
  targetType?: string;
  targetId?: string;
  meta?: unknown;
  ip?: string;
  userAgent?: string;
}

export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        organizationId: entry.organizationId,
        userId: entry.userId ?? undefined,
        kind: entry.kind,
        targetType: entry.targetType,
        targetId: entry.targetId,
        meta: toJsonColumn(entry.meta) as Prisma.InputJsonValue | undefined,
        ip: entry.ip,
        userAgent: entry.userAgent,
      },
    });
  } catch (err) {
    // Never let audit failures break user flows; surface to logs/observability.
    logger.error({ err, entry: { ...entry, meta: undefined } }, "audit log failed");
  }
}
