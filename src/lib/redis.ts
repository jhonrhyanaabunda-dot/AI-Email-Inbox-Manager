import IORedis, { type Redis, type RedisOptions } from "ioredis";
import { env } from "./env";

const globalForRedis = globalThis as unknown as { redis?: Redis };

const baseOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  // In dev without Redis, fail fast and keep retry attempts cheap so we don't
  // spam logs or block startup.
  retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2000)),
};

export const redis: Redis =
  globalForRedis.redis ?? new IORedis(env().REDIS_URL, baseOptions);

if (env().NODE_ENV !== "production") globalForRedis.redis = redis;

/** A fresh connection — required by BullMQ Worker instances. */
export function makeRedisConnection(): Redis {
  return new IORedis(env().REDIS_URL, baseOptions);
}
