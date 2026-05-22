import OpenAI from "openai";
import { env, hasOpenAI } from "./env";

// Lazy client — instantiated on first use, NOT at module load.
// This lets `next build` succeed on hosts where OPENAI_API_KEY isn't set
// (e.g. Vercel before the user adds secrets, or any demo-mode deploy).
const globalForOpenAI = globalThis as unknown as { __openai?: OpenAI };

export function getOpenAI(): OpenAI {
  if (!hasOpenAI()) {
    throw new Error(
      "OPENAI_API_KEY is not configured. The app runs in demo mode for the UI; " +
      "set OPENAI_API_KEY in the environment to enable real agent calls."
    );
  }
  if (globalForOpenAI.__openai) return globalForOpenAI.__openai;
  const client = new OpenAI({
    apiKey: env().OPENAI_API_KEY,
    maxRetries: 2,
    timeout: 60_000,
  });
  if (env().NODE_ENV !== "production") globalForOpenAI.__openai = client;
  return client;
}

// Back-compat: callers expect `openai` to behave like the client.
// Proxy through so any property access lazy-instantiates.
export const openai: OpenAI = new Proxy({} as OpenAI, {
  get(_t, prop) {
    return Reflect.get(getOpenAI() as object, prop);
  },
});

export const MODEL = {
  fast: () => env().OPENAI_MODEL,
  heavy: () => env().OPENAI_MODEL_HEAVY,
};
