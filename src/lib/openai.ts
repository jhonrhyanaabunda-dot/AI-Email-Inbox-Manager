import OpenAI from "openai";
import { env } from "./env";

const globalForOpenAI = globalThis as unknown as { openai?: OpenAI };

export const openai: OpenAI =
  globalForOpenAI.openai ??
  new OpenAI({
    apiKey: env().OPENAI_API_KEY,
    maxRetries: 2,
    timeout: 60_000,
  });

if (env().NODE_ENV !== "production") globalForOpenAI.openai = openai;

export const MODEL = {
  fast: () => env().OPENAI_MODEL,
  heavy: () => env().OPENAI_MODEL_HEAVY,
};
