// src/routes/subscription/subscription.routes.ts

import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCode from "@/constants/http-status-codes";

const tags = ["Subscription"];

// --- Schema untuk Error Response (digunakan berulang kali) ---
const ErrorResponseSchema = z.object({
  error: z.string(),
});

const SubscriptionDetailsSchema = z.object({
  planName: z.string(),
  status: z.string().nullable(),
  currentPeriodEnd: z.date(),
  priceId: z.string().uuid(),
}).nullable();

const SubscriptionStatusResponseSchema = z.object({
  subscription: SubscriptionDetailsSchema,
  tokenBalance: z.number(),
});

export const getSubscriptionStatus = createRoute({
  tags,
  method: "get",
  path: "subscription/status",
  security: [{ bearerAuth: [] }],
  responses: {
    // --- Response Sukses ---
    [HttpStatusCode.OK]: {
      content: { "application/json": { schema: SubscriptionStatusResponseSchema } },
      description: "Berhasil mendapatkan status langganan pengguna dan sisa token.",
    },

    // --- LENGKAPI: Definisi semua response error ---
    [HttpStatusCode.UNAUTHORIZED]: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Unauthorized. Token tidak valid atau tidak diberikan.",
    },
    [HttpStatusCode.NOT_FOUND]: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Pengguna tidak ditemukan.",
    },
    [HttpStatusCode.INTERNAL_SERVER_ERROR]: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Terjadi kesalahan pada server.",
    },
  },
});

const CancelSubscriptionResponseSchema = z.object({
  message: z.string(),
  canceledAt: z.date(),
});

export const cancelSubscription = createRoute({
  tags,
  method: "post",
  path: "subscription/cancel",
  security: [{ bearerAuth: [] }],
  responses: {
    // --- Response Sukses ---
    [HttpStatusCode.OK]: {
      content: { "application/json": { schema: CancelSubscriptionResponseSchema } },
      description: "Langganan berhasil dibatalkan.",
    },

    // --- LENGKAPI: Definisi semua response error ---
    [HttpStatusCode.UNAUTHORIZED]: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Unauthorized. Token tidak valid atau tidak diberikan.",
    },
    [HttpStatusCode.NOT_FOUND]: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Tidak ditemukan langganan aktif untuk pengguna ini.",
    },
    [HttpStatusCode.INTERNAL_SERVER_ERROR]: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Terjadi kesalahan pada server.",
    },
  },
});

// --- Ekspor Tipe Data ---
export type GetSubscriptionStatusRoute = typeof getSubscriptionStatus;
export type CancelSubscriptionRoute = typeof cancelSubscription;
