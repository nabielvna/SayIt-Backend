import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCode from "@/constants/http-status-codes";

const tags = ["Demo"];

export const demo = createRoute({
  tags,
  method: "get",
  path: "/demo",
  responses: {
    [HttpStatusCode.OK]: {
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
      description: "Demo endpoint",
    },
  },
});

export type DemoRoute = typeof demo;
