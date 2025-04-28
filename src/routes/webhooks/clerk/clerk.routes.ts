import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCode from "@/constants/http-status-codes";

const tags = ["Clerk Webhook"];

export const clerkWebhook = createRoute({
  method: "post",
  path: "/webhooks/clerk",
  tags,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            type: z.string(),
            data: z.any(),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCode.OK]: {
      description: "Webhook received",
    },
    [HttpStatusCode.BAD_REQUEST]: {
      description: "Invalid payload",
    },
  },
});

export type ClerkWebhookRoute = typeof clerkWebhook;
