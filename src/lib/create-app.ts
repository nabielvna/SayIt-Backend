import { OpenAPIHono } from "@hono/zod-openapi";

import notFound from "@/handlers/not-found";
import onError from "@/handlers/on-error";

import { pinoLogger } from "@/middlewares/pino-logger";

import type { AppBindings } from "@/lib/types";

import defaultHook from "@/lib/default-hook";
import { cors } from "hono/cors";
import env from "@/env";

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook,
  });
}

export default function createApp() {
  const app = createRouter();

  app.use(pinoLogger());

  app.use(
    "*",
    cors({
      origin: env.ALLOWED_ORIGINS?.split(",") || "",
      allowHeaders: ["Authorization", "Content-Type"],
      allowMethods: ["GET", "POST", "OPTIONS", "DELETE", "PATCH", "PUT"],
      credentials: true,
    }),
  );

  app.notFound(notFound);
  app.onError(onError);

  return app;
}
