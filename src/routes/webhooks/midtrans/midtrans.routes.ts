// File: src/routes/midtrans/midtrans.routes.ts
import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCode from "@/constants/http-status-codes";

const tags = ["Midtrans Webhook"];

// Skema untuk notifikasi dari Midtrans.
// Kita terima objek apa saja karena payloadnya bisa sangat bervariasi.
// Validasi utama akan dilakukan melalui signature key.
const MidtransNotificationSchema = z.record(z.string(), z.any());

// Skema untuk response yang berhasil
const WebhookSuccessResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
});

// Skema untuk error response
const ErrorResponseSchema = z.object({
  error: z.string(),
});

// Definisi route untuk webhook notifikasi Midtrans
export const handleMidtransNotification = createRoute({
  tags,
  method: "post",
  path: "/webhooks/midtrans",
  request: {
    body: {
      content: {
        "application/json": {
          schema: MidtransNotificationSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCode.OK]: {
      content: {
        "application/json": {
          schema: WebhookSuccessResponseSchema,
        },
      },
      description: "Webhook notification processed successfully",
    },
    [HttpStatusCode.UNAUTHORIZED]: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid signature",
    },
    [HttpStatusCode.NOT_FOUND]: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Transaction not found",
    },
    [HttpStatusCode.INTERNAL_SERVER_ERROR]: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Internal server error",
    },
  },
});

export type HandleMidtransNotificationRoute = typeof handleMidtransNotification;
