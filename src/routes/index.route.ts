import { createRouter } from "@/lib/create-app";

import { createRoute, z } from "@hono/zod-openapi";

import * as HttpStatusCode from "@/constants/http-status-codes";

const router = createRouter()
  .openapi(createRoute({
    tags: ["Index"],
    method: "get",
    path: "/",
    responses: {
      [HttpStatusCode.OK]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
        description: "SayIt API Index",
      },
    },
  }), (c) => {
    return c.json({
      message: "SayIt API",
    }, HttpStatusCode.OK);
  });

export default router;
