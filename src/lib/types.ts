import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";
import type { PinoLogger } from "hono-pino";

export interface ClerkUser {
  userId: string;
  // tambahkan properti lain yang diperlukan
}

export interface AppBindings {
  Variables: {
    logger: PinoLogger;
    user?: ClerkUser;
  };
}

export type AppOpenAPI = OpenAPIHono<AppBindings>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppBindings>;
