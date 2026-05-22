// Provider-agnostic normalized email shape and helpers.
// All downstream code (DB persistence, agents, UI) consumes this shape.

export interface NormalizedAddress {
  email: string;
  name?: string;
}

export interface NormalizedAttachment {
  providerAttachmentId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  inline: boolean;
  contentId?: string;
}

export interface NormalizedEmail {
  providerMessageId: string;
  providerThreadId: string;
  internetMessageId?: string;
  direction: "INBOUND" | "OUTBOUND";
  from: NormalizedAddress;
  to: NormalizedAddress[];
  cc: NormalizedAddress[];
  bcc: NormalizedAddress[];
  replyTo: NormalizedAddress[];
  subject?: string;
  snippet?: string;
  bodyText?: string;
  bodyHtml?: string;
  receivedAt: Date;
  hasAttachments: boolean;
  attachments: NormalizedAttachment[];
  headers?: Record<string, string>;
}

export function parseAddressList(value: string | string[] | undefined | null): NormalizedAddress[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(",") : value;
  return raw
    .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseAddress);
}

export function parseAddress(raw: string): NormalizedAddress {
  // "Name" <email@x>  |  Name <email@x>  |  email@x
  const match = raw.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1]?.trim() || undefined, email: match[2].trim().toLowerCase() };
  return { email: raw.trim().toLowerCase() };
}

export function inferDirection(
  from: NormalizedAddress,
  mailboxEmail: string
): "INBOUND" | "OUTBOUND" {
  return from.email.toLowerCase() === mailboxEmail.toLowerCase() ? "OUTBOUND" : "INBOUND";
}
