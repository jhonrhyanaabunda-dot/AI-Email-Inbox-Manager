import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";
import { env } from "./env";

// AES-256-GCM envelope encryption for OAuth tokens at rest.
// Format: v1.<iv-hex>.<tag-hex>.<ciphertext-hex>

const ALGO = "aes-256-gcm";
const VERSION = "v1";

function keyBytes(): Buffer {
  return Buffer.from(env().ENCRYPTION_KEY, "hex");
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, keyBytes(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("hex"), tag.toString("hex"), enc.toString("hex")].join(".");
}

export function decryptSecret(payload: string): string {
  const [version, ivHex, tagHex, dataHex] = payload.split(".");
  if (version !== VERSION) throw new Error(`Unsupported encryption version: ${version}`);
  const decipher = createDecipheriv(ALGO, keyBytes(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const dec = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
  return dec.toString("utf8");
}

export function hashApiToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateApiToken(): { raw: string; prefix: string; hash: string } {
  const raw = `iim_live_${randomBytes(24).toString("hex")}`;
  return { raw, prefix: raw.slice(0, 12), hash: hashApiToken(raw) };
}
