// Local enum constants — Prisma SQLite stores these as plain strings.
// All value-accesses (e.g. `Role.GM`) now come from here instead of @prisma/client.

export const Role = {
  SUPER_ADMIN: "SUPER_ADMIN",
  AGENCY_ADMIN: "AGENCY_ADMIN",
  DEALER_PRINCIPAL: "DEALER_PRINCIPAL",
  GM: "GM",
  MARKETING_DIRECTOR: "MARKETING_DIRECTOR",
  FIXED_OPS_DIRECTOR: "FIXED_OPS_DIRECTOR",
  ASSISTANT: "ASSISTANT",
  READ_ONLY: "READ_ONLY",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Priority = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  NORMAL: "NORMAL",
  LOW: "LOW",
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const Category = {
  CUSTOMER_INQUIRY: "CUSTOMER_INQUIRY",
  CUSTOMER_COMPLAINT: "CUSTOMER_COMPLAINT",
  SALES_LEAD: "SALES_LEAD",
  SERVICE_REQUEST: "SERVICE_REQUEST",
  OEM_COMMUNICATION: "OEM_COMMUNICATION",
  VENDOR: "VENDOR",
  INTERNAL: "INTERNAL",
  LEGAL: "LEGAL",
  HR: "HR",
  FINANCE: "FINANCE",
  MARKETING: "MARKETING",
  RECRUITING: "RECRUITING",
  SPAM: "SPAM",
  NEWSLETTER: "NEWSLETTER",
  OTHER: "OTHER",
} as const;
export type Category = (typeof Category)[keyof typeof Category];

export const Sentiment = {
  VERY_POSITIVE: "VERY_POSITIVE",
  POSITIVE: "POSITIVE",
  NEUTRAL: "NEUTRAL",
  NEGATIVE: "NEGATIVE",
  VERY_NEGATIVE: "VERY_NEGATIVE",
} as const;
export type Sentiment = (typeof Sentiment)[keyof typeof Sentiment];

export const EscalationKind = {
  LEGAL_THREAT: "LEGAL_THREAT",
  ANGRY_CUSTOMER: "ANGRY_CUSTOMER",
  HR_COMPLAINT: "HR_COMPLAINT",
  LAWSUIT: "LAWSUIT",
  COMPLIANCE: "COMPLIANCE",
  OEM_RISK: "OEM_RISK",
  FRAUD_INDICATOR: "FRAUD_INDICATOR",
  CHURN_RISK: "CHURN_RISK",
  REGULATORY: "REGULATORY",
  EXECUTIVE_REQUEST: "EXECUTIVE_REQUEST",
} as const;
export type EscalationKind = (typeof EscalationKind)[keyof typeof EscalationKind];

export const EscalationStatus = {
  OPEN: "OPEN",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  DISMISSED: "DISMISSED",
} as const;
export type EscalationStatus = (typeof EscalationStatus)[keyof typeof EscalationStatus];

export const MailboxProvider = {
  GMAIL: "GMAIL",
  MICROSOFT: "MICROSOFT",
} as const;
export type MailboxProvider = (typeof MailboxProvider)[keyof typeof MailboxProvider];

export const MailboxStatus = {
  CONNECTING: "CONNECTING",
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  ERROR: "ERROR",
  DISCONNECTED: "DISCONNECTED",
} as const;
export type MailboxStatus = (typeof MailboxStatus)[keyof typeof MailboxStatus];

export const DraftStatus = {
  PENDING_REVIEW: "PENDING_REVIEW",
  APPROVED: "APPROVED",
  SENT: "SENT",
  REJECTED: "REJECTED",
  EDITED: "EDITED",
  STALE: "STALE",
} as const;
export type DraftStatus = (typeof DraftStatus)[keyof typeof DraftStatus];

export const EmailDirection = {
  INBOUND: "INBOUND",
  OUTBOUND: "OUTBOUND",
} as const;
export type EmailDirection = (typeof EmailDirection)[keyof typeof EmailDirection];

export const ActivityKind = {
  AUTH_LOGIN: "AUTH_LOGIN",
  AUTH_LOGOUT: "AUTH_LOGOUT",
  MAILBOX_CONNECT: "MAILBOX_CONNECT",
  MAILBOX_DISCONNECT: "MAILBOX_DISCONNECT",
  THREAD_VIEW: "THREAD_VIEW",
  THREAD_ASSIGN: "THREAD_ASSIGN",
  THREAD_COMMENT: "THREAD_COMMENT",
  THREAD_LABEL: "THREAD_LABEL",
  THREAD_ARCHIVE: "THREAD_ARCHIVE",
  THREAD_SNOOZE: "THREAD_SNOOZE",
  DRAFT_CREATED: "DRAFT_CREATED",
  DRAFT_APPROVED: "DRAFT_APPROVED",
  DRAFT_REJECTED: "DRAFT_REJECTED",
  DRAFT_SENT: "DRAFT_SENT",
  ESCALATION_CREATED: "ESCALATION_CREATED",
  ESCALATION_ACKED: "ESCALATION_ACKED",
  ESCALATION_RESOLVED: "ESCALATION_RESOLVED",
  WORKFLOW_TRIGGERED: "WORKFLOW_TRIGGERED",
  SETTINGS_CHANGED: "SETTINGS_CHANGED",
  USER_INVITED: "USER_INVITED",
  USER_ROLE_CHANGED: "USER_ROLE_CHANGED",
  API_TOKEN_CREATED: "API_TOKEN_CREATED",
  API_TOKEN_REVOKED: "API_TOKEN_REVOKED",
} as const;
export type ActivityKind = (typeof ActivityKind)[keyof typeof ActivityKind];
