import env from "@/env";

import { pinoLogger as honoPinoLogger } from "hono-pino";

import pino from "pino";
import pretty from "pino-pretty";

export function pinoLogger() {
  return honoPinoLogger({
    pino: pino({
      level: env.LOG_LEVEL,
    }, env.NODE_ENV === "production" ? undefined : pretty()),
    http: {
      reqId: () => crypto.randomUUID(),
    },
  });
}
