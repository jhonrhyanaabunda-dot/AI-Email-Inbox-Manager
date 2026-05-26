/**
 * Demo-mode Prisma stub.
 *
 * The Vercel demo runs with no database. This module exposes an object
 * shaped enough like a PrismaClient that the dashboard / API routes can
 * keep calling `prisma.emailThread.findMany({ where, orderBy, take })`,
 * etc., but everything is served from the in-memory demo dataset in
 * demo-data.ts.
 *
 * Supported per model: findUnique, findFirst, findMany, findUniqueOrThrow,
 * count, groupBy (with _count), create, update, updateMany, upsert,
 * delete, deleteMany. Also $transaction (sequential), $queryRaw/Unsafe and
 * $executeRaw/Unsafe (no-ops).
 *
 * Filter syntax handled: equality, `in`, `notIn`, `not`, `gt`, `gte`,
 * `lt`, `lte`, `contains`, plus `AND` / `OR` arrays. `select` and `include`
 * are accepted but most relations are flattened to plain ids — good enough
 * for the demo.
 */

import {
  DEMO_API_TOKENS,
  DEMO_ASSIGNMENTS,
  DEMO_BRIEFINGS,
  DEMO_COMMENTS,
  DEMO_DEALERSHIP,
  DEMO_DRAFTS,
  DEMO_EMAILS,
  DEMO_ESCALATIONS,
  DEMO_LABELS,
  DEMO_MAILBOX,
  DEMO_MEMBERSHIPS,
  DEMO_ORG,
  DEMO_THREADS,
  DEMO_USERS,
  DEMO_WORKFLOWS,
} from "./demo-data";

type Row = Record<string, any>;

/* ─── where evaluation ─────────────────────────────────────────────────── */

function matchesValue(actual: any, expected: any): boolean {
  if (expected === null || expected === undefined) return actual === expected;
  if (typeof expected !== "object" || expected instanceof Date) {
    return actual === expected || (expected instanceof Date && actual instanceof Date && +actual === +expected);
  }
  // Operator object
  for (const [op, v] of Object.entries(expected)) {
    switch (op) {
      case "equals": if (actual !== v) return false; break;
      case "not": if (actual === v) return false; break;
      case "in": if (!Array.isArray(v) || !v.includes(actual)) return false; break;
      case "notIn": if (Array.isArray(v) && v.includes(actual)) return false; break;
      case "gt": if (!(actual > (v as any))) return false; break;
      case "gte": if (!(actual >= (v as any))) return false; break;
      case "lt": if (!(actual < (v as any))) return false; break;
      case "lte": if (!(actual <= (v as any))) return false; break;
      case "contains":
        if (typeof actual !== "string" || !actual.toLowerCase().includes(String(v).toLowerCase())) return false;
        break;
      case "startsWith":
        if (typeof actual !== "string" || !actual.startsWith(String(v))) return false;
        break;
      default:
        // Unknown operator — be permissive in demo mode.
        break;
    }
  }
  return true;
}

function matchesWhere(row: Row, where: any): boolean {
  if (!where) return true;
  for (const [key, cond] of Object.entries(where)) {
    if (key === "AND") {
      const arr = Array.isArray(cond) ? cond : [cond];
      if (!arr.every((sub) => matchesWhere(row, sub))) return false;
      continue;
    }
    if (key === "OR") {
      const arr = Array.isArray(cond) ? cond : [cond];
      if (!arr.some((sub) => matchesWhere(row, sub))) return false;
      continue;
    }
    if (key === "NOT") {
      const arr = Array.isArray(cond) ? cond : [cond];
      if (arr.some((sub) => matchesWhere(row, sub))) return false;
      continue;
    }
    if (!matchesValue(row[key], cond)) return false;
  }
  return true;
}

function applyOrderBy<T extends Row>(rows: T[], orderBy: any): T[] {
  if (!orderBy) return rows;
  const specs = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...rows].sort((a, b) => {
    for (const spec of specs) {
      for (const [k, dir] of Object.entries(spec)) {
        const av = a[k], bv = b[k];
        if (av === bv) continue;
        const cmp = av == null ? -1 : bv == null ? 1 : av < bv ? -1 : 1;
        return dir === "desc" ? -cmp : cmp;
      }
    }
    return 0;
  });
}

function applySelect<T extends Row>(row: T, select: any): any {
  if (!select) return row;
  const out: Row = {};
  for (const [k, v] of Object.entries(select)) {
    if (v === true) {
      out[k] = row[k];
    } else if (v && typeof v === "object") {
      // Nested select on a relation. If the row has it, pass through; else
      // return an empty array (assume it's a to-many relation — that's the
      // common case in this codebase, and `.map()` on [] doesn't crash).
      out[k] = row[k] !== undefined ? row[k] : [];
    }
  }
  return out;
}

function applyInclude<T extends Row>(row: T, include: any, _model: string): any {
  if (!include) return row;
  const out: Row = { ...row };
  // Generic include: leave keys empty arrays / nulls so destructuring doesn't crash.
  for (const k of Object.keys(include)) {
    if (out[k] === undefined) out[k] = Array.isArray(out[k]) ? [] : null;
  }
  return out;
}

/* ─── per-model store ──────────────────────────────────────────────────── */

function makeModel<T extends Row>(rows: T[], modelName: string) {
  return {
    async findUnique({ where, select, include }: any = {}) {
      const row = rows.find((r) => matchesWhere(r, where));
      if (!row) return null;
      let out: any = applyInclude(row, include, modelName);
      out = applySelect(out, select);
      return out;
    },
    async findUniqueOrThrow(args: any) {
      const r = await (this as any).findUnique(args);
      if (!r) throw new Error(`[demo-db] ${modelName} not found`);
      return r;
    },
    async findFirst({ where, orderBy, select, include }: any = {}) {
      const filtered = rows.filter((r) => matchesWhere(r, where));
      const sorted = applyOrderBy(filtered, orderBy);
      const row = sorted[0];
      if (!row) return null;
      return applySelect(applyInclude(row, include, modelName), select);
    },
    async findMany({ where, orderBy, skip = 0, take, select, include }: any = {}) {
      const filtered = rows.filter((r) => matchesWhere(r, where));
      const sorted = applyOrderBy(filtered, orderBy);
      const sliced = take != null ? sorted.slice(skip, skip + take) : sorted.slice(skip);
      return sliced.map((r) => applySelect(applyInclude(r, include, modelName), select));
    },
    async count({ where }: any = {}) {
      return rows.filter((r) => matchesWhere(r, where)).length;
    },
    async groupBy({ by, where, _count }: any = {}) {
      const filtered = rows.filter((r) => matchesWhere(r, where));
      const keys: string[] = Array.isArray(by) ? by : [by];
      const groups = new Map<string, { count: number; sample: Row }>();
      for (const r of filtered) {
        const k = keys.map((kk) => String(r[kk])).join("");
        const g = groups.get(k);
        if (g) g.count++;
        else groups.set(k, { count: 1, sample: r });
      }
      return Array.from(groups.values()).map(({ count, sample }) => {
        const row: Row = {};
        for (const k of keys) row[k] = sample[k];
        if (_count) {
          if (typeof _count === "object" && _count._all) row._count = { _all: count };
          else row._count = count;
        }
        return row;
      });
    },
    async create({ data, select, include }: any) {
      const id = data.id ?? `${modelName.toLowerCase()}-${rows.length + 1}-${Date.now()}`;
      const now = new Date();
      const row = { id, createdAt: now, updatedAt: now, ...data } as T;
      rows.push(row);
      return applySelect(applyInclude(row, include, modelName), select);
    },
    async update({ where, data, select, include }: any) {
      const row = rows.find((r) => matchesWhere(r, where));
      if (!row) throw new Error(`[demo-db] ${modelName} update: not found`);
      Object.assign(row, data, { updatedAt: new Date() });
      return applySelect(applyInclude(row, include, modelName), select);
    },
    async updateMany({ where, data }: any) {
      const matched = rows.filter((r) => matchesWhere(r, where));
      const now = new Date();
      matched.forEach((r) => Object.assign(r, data, { updatedAt: now }));
      return { count: matched.length };
    },
    async upsert({ where, create, update, select, include }: any) {
      const existing = rows.find((r) => matchesWhere(r, where));
      if (existing) {
        Object.assign(existing, update, { updatedAt: new Date() });
        return applySelect(applyInclude(existing, include, modelName), select);
      }
      return (this as any).create({ data: create, select, include });
    },
    async delete({ where }: any) {
      const idx = rows.findIndex((r) => matchesWhere(r, where));
      if (idx < 0) throw new Error(`[demo-db] ${modelName} delete: not found`);
      const [row] = rows.splice(idx, 1);
      return row;
    },
    async deleteMany({ where }: any = {}) {
      const before = rows.length;
      for (let i = rows.length - 1; i >= 0; i--) {
        if (matchesWhere(rows[i], where)) rows.splice(i, 1);
      }
      return { count: before - rows.length };
    },
  };
}

/* ─── client ───────────────────────────────────────────────────────────── */

export const prisma: any = {
  organization: makeModel([DEMO_ORG] as Row[], "Organization"),
  dealership: makeModel([DEMO_DEALERSHIP] as Row[], "Dealership"),
  user: makeModel(DEMO_USERS as Row[], "User"),
  membership: makeModel(DEMO_MEMBERSHIPS as Row[], "Membership"),
  mailbox: makeModel([DEMO_MAILBOX] as Row[], "Mailbox"),
  emailThread: makeModel(DEMO_THREADS as Row[], "EmailThread"),
  email: makeModel(DEMO_EMAILS as Row[], "Email"),
  aiDraft: makeModel(DEMO_DRAFTS as Row[], "AiDraft"),
  escalation: makeModel(DEMO_ESCALATIONS as Row[], "Escalation"),
  threadAssignment: makeModel(DEMO_ASSIGNMENTS as Row[], "ThreadAssignment"),
  threadComment: makeModel(DEMO_COMMENTS as Row[], "ThreadComment"),
  threadLabel: makeModel([] as Row[], "ThreadLabel"),
  label: makeModel(DEMO_LABELS as Row[], "Label"),
  dailyBriefing: makeModel(DEMO_BRIEFINGS as Row[], "DailyBriefing"),
  workflow: makeModel(DEMO_WORKFLOWS as Row[], "Workflow"),
  apiToken: makeModel(DEMO_API_TOKENS as Row[], "ApiToken"),
  activityLog: makeModel([] as Row[], "ActivityLog"),
  vipContact: makeModel([] as Row[], "VipContact"),
  vendorPattern: makeModel([] as Row[], "VendorPattern"),
  attachment: makeModel([] as Row[], "Attachment"),
  syncJob: makeModel([] as Row[], "SyncJob"),

  async $transaction(arg: any) {
    if (typeof arg === "function") return arg(prisma);
    if (Array.isArray(arg)) return Promise.all(arg);
    return arg;
  },
  async $queryRaw() { return []; },
  async $queryRawUnsafe() { return []; },
  async $executeRaw() { return 0; },
  async $executeRawUnsafe() { return 0; },
  async $connect() {},
  async $disconnect() {},
};
