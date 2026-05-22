import { z } from "zod";
import { MODEL, openai } from "../openai";
import { logger } from "../logger";

/**
 * Single helper for structured-output calls.
 * Uses OpenAI Responses-style JSON schema enforcement via Chat Completions
 * `response_format: json_schema`.
 */
export async function structured<T>(opts: {
  schema: z.ZodType<T>;
  system: string;
  user: string;
  schemaName: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<T> {
  const model = opts.model ?? MODEL.fast();
  const jsonSchema = zodToJsonSchema(opts.schema, opts.schemaName);

  const completion = await openai.chat.completions.create({
    model,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 1200,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: opts.schemaName, schema: jsonSchema, strict: true },
    },
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error("Empty LLM response");
  try {
    return opts.schema.parse(JSON.parse(text));
  } catch (err) {
    logger.error({ err, text: text.slice(0, 500), schema: opts.schemaName }, "structured LLM parse failed");
    throw err;
  }
}

/**
 * Pragmatic Zod -> JSON Schema converter for the small subset used by agents.
 * Avoids pulling a heavyweight dep; supports objects, strings, numbers,
 * booleans, enums, arrays, optional fields, and nested objects.
 */
function zodToJsonSchema(schema: z.ZodTypeAny, _name: string): Record<string, unknown> {
  return convert(schema);
}

function convert(s: z.ZodTypeAny): Record<string, unknown> {
  const def = (s as { _def: any })._def;
  switch (def.typeName) {
    case "ZodObject": {
      const shape = def.shape();
      const props: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [k, v] of Object.entries(shape) as [string, z.ZodTypeAny][]) {
        const isOptional = v instanceof z.ZodOptional;
        const inner = isOptional ? (v as z.ZodOptional<z.ZodTypeAny>).unwrap() : v;
        props[k] = convert(inner);
        if (!isOptional) required.push(k);
      }
      return { type: "object", properties: props, required, additionalProperties: false };
    }
    case "ZodString": {
      const out: Record<string, unknown> = { type: "string" };
      return out;
    }
    case "ZodNumber":
      return { type: "number" };
    case "ZodBoolean":
      return { type: "boolean" };
    case "ZodEnum":
      return { type: "string", enum: def.values as string[] };
    case "ZodNativeEnum":
      return { type: "string", enum: Object.values(def.values).filter((v) => typeof v === "string") as string[] };
    case "ZodArray":
      return { type: "array", items: convert(def.type) };
    case "ZodOptional":
      return convert(def.innerType);
    case "ZodNullable":
      return { ...convert(def.innerType), nullable: true };
    case "ZodLiteral":
      return { type: typeof def.value as "string" | "number" | "boolean", enum: [def.value] };
    case "ZodUnion": {
      // Best-effort: emit oneOf
      return { oneOf: (def.options as z.ZodTypeAny[]).map(convert) };
    }
    default:
      logger.warn({ typeName: def.typeName }, "unsupported Zod type in JSON schema conversion");
      return {};
  }
}
