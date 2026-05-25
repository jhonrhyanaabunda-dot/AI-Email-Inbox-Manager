import { z } from "zod";

/**
 * Permissive env schema — every var has a safe default so `next build`
 * succeeds on a CI host with zero secrets configured. Runtime consumers
 * (OpenAI client, Gmail OAuth, etc.) check for sentinel values themselves
 * and degrade to demo-mode behavior when keys are missing.
 *
 * This lets the same codebase build cleanly on Vercel free tier without
 * any env vars set, while still working end-to-end locally and in prod
 * once real secrets are wired in.
 */

// Auto-generated 32-byte hex stand-in so the encryption module doesn't
// throw at build time. NEVER use this for real OAuth tokens — the real
// ENCRYPTION_KEY must be set in production.
const BUILD_TIME_PLACEHOLDER_KEY =
  "00000000000000000000000000000000000000000000000000000000000000aa";

const Env = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().default("http://localhost:3000"),
  LOG_LEVEL: z.string().default("info"),

  DATABASE_URL: z.string().default("file:./dev.db"),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // Default is a baked-in demo secret so the Vercel demo works without any env
  // vars. Production deployments MUST override this with `openssl rand -base64 32`.
  AUTH_SECRET: z.string().default("a3-inbox-demo-secret-9k2j4n8p3m5w7q1y6r0t8v4x2z9c7b5n3l1f0g8h"),
  AUTH_TRUST_HOST: z.string().optional(),

  ENCRYPTION_KEY: z
    .string()
    .default(BUILD_TIME_PLACEHOLDER_KEY)
    .refine((v) => /^[0-9a-fA-F]{64}$/.test(v), "ENCRYPTION_KEY must be 64 hex chars (32 bytes)"),

  OPENAI_API_KEY: z.string().default(""),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_MODEL_HEAVY: z.string().default("gpt-4o"),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  GOOGLE_PUBSUB_TOPIC: z.string().optional(),
  GOOGLE_PUBSUB_VERIFICATION_TOKEN: z.string().optional(),

  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_TENANT_ID: z.string().default("common"),
  MICROSOFT_REDIRECT_URI: z.string().optional(),
  MICROSOFT_WEBHOOK_CLIENT_STATE: z.string().optional(),

  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(8),
  DIGEST_CRON: z.string().default("0 7 * * *"),
});

export type AppEnv = z.infer<typeof Env>;

let cached: AppEnv | null = null;

export function env(): AppEnv {
  if (cached) return cached;
  const parsed = Env.safeParse(process.env);
  if (!parsed.success) {
    // Don't crash the process on bad env during build — log and use defaults
    // so the consuming code can throw context-specific errors at runtime.
    console.warn(
      "[env] invalid env, falling back to defaults:",
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    );
    cached = Env.parse({});
    return cached;
  }
  cached = parsed.data;
  return cached;
}

/** True when no real OpenAI key is configured. Consumers should degrade gracefully. */
export function hasOpenAI(): boolean {
  const k = env().OPENAI_API_KEY;
  return !!k && k !== "sk-PLACEHOLDER" && !k.startsWith("sk-PLACEHOLDER");
}
