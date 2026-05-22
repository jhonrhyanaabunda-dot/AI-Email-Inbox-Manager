import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env().LOG_LEVEL,
  redact: {
    paths: [
      "*.password",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
      "*.access_token",
      "*.refresh_token",
      "*.id_token",
      "headers.authorization",
      "headers.cookie",
    ],
    censor: "[REDACTED]",
  },
  transport:
    env().NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});

export type Logger = typeof logger;
