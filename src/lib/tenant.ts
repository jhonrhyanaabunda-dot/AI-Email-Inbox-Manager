import { auth } from "./auth";
import { ForbiddenError } from "./permissions";
import { Role } from "./enums";

export interface SessionContext {
  userId: string;
  organizationId: string;
  role: Role;
  email: string;
}

/**
 * Resolves the authenticated session context.
 * Throws ForbiddenError if no session (caller maps to 401/403).
 */
export async function requireSession(): Promise<SessionContext> {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    throw new ForbiddenError("Not authenticated");
  }
  return {
    userId: session.user.id,
    organizationId: session.user.organizationId,
    role: session.user.role,
    email: session.user.email ?? "",
  };
}

/** Throws if a resource's organizationId doesn't match the caller's. */
export function assertSameOrg(resourceOrgId: string, callerOrgId: string): void {
  if (resourceOrgId !== callerOrgId) {
    throw new ForbiddenError("Cross-tenant access denied");
  }
}
