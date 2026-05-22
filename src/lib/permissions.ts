import { Role } from "./enums";

export type Permission =
  | "org:read"
  | "org:write"
  | "org:billing"
  | "user:invite"
  | "user:manage"
  | "mailbox:connect"
  | "mailbox:read"
  | "mailbox:write"
  | "thread:read"
  | "thread:write"
  | "thread:assign"
  | "draft:read"
  | "draft:create"
  | "draft:approve"
  | "draft:send"
  | "escalation:read"
  | "escalation:resolve"
  | "workflow:read"
  | "workflow:write"
  | "analytics:read"
  | "audit:read"
  | "api_token:manage";

const READ: Permission[] = [
  "org:read",
  "mailbox:read",
  "thread:read",
  "draft:read",
  "escalation:read",
  "workflow:read",
  "analytics:read",
];

const ASSISTANT: Permission[] = [
  ...READ,
  "thread:write",
  "thread:assign",
  "draft:create",
  "escalation:resolve",
];

const GM_PERMS: Permission[] = [
  ...ASSISTANT,
  "draft:approve",
  "draft:send",
  "mailbox:write",
  "workflow:write",
];

const PRINCIPAL_PERMS: Permission[] = [
  ...GM_PERMS,
  "user:invite",
  "user:manage",
  "mailbox:connect",
  "audit:read",
  "api_token:manage",
];

const AGENCY_ADMIN_PERMS: Permission[] = [
  ...PRINCIPAL_PERMS,
  "org:write",
  "org:billing",
];

const SUPER: Permission[] = Array.from(new Set([...AGENCY_ADMIN_PERMS])) as Permission[];

const ROLE_MAP: Record<Role, Permission[]> = {
  [Role.READ_ONLY]: READ,
  [Role.ASSISTANT]: ASSISTANT,
  [Role.FIXED_OPS_DIRECTOR]: ASSISTANT,
  [Role.MARKETING_DIRECTOR]: ASSISTANT,
  [Role.GM]: GM_PERMS,
  [Role.DEALER_PRINCIPAL]: PRINCIPAL_PERMS,
  [Role.AGENCY_ADMIN]: AGENCY_ADMIN_PERMS,
  [Role.SUPER_ADMIN]: SUPER,
};

export function permissionsFor(role: Role): ReadonlyArray<Permission> {
  return ROLE_MAP[role] ?? READ;
}

export function can(role: Role, permission: Permission): boolean {
  return permissionsFor(role).includes(permission);
}

export function requirePermission(role: Role, permission: Permission): void {
  if (!can(role, permission)) {
    throw new ForbiddenError(`Role ${role} lacks permission ${permission}`);
  }
}

export class ForbiddenError extends Error {
  status = 403 as const;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}
