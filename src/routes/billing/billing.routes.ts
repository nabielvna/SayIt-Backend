import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCode from "@/constants/http-status-codes";

const tags = ["Billing"];

// Schema for a single price
const PriceSchema = z.object({
  id: z.string().uuid(),
  unitAmount: z.number().nullable(),
  currency: z.string().nullable(),
  interval: z.enum(["day", "week", "month", "year"]).nullable(),
});

// Schema for a single billing plan
const BillingPlanSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  tokens: z.number().nullable(),
  features: z.array(z.string()).nullable(),
  isFeatured: z.boolean(),
  prices: z.array(PriceSchema), // Each plan can have multiple prices (e.g., monthly & yearly)
});

const BillingHistoryItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  subscriptionId: z.string().uuid().nullable(),
  priceId: z.string().uuid().nullable(),
  createdAt: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  invoicePdf: z.string().nullable(),
  paymentProviderInvoiceId: z.string().nullable(),
});

// Schema for error responses
const ErrorResponseSchema = z.object({
  error: z.string(),
});

// Route definition for getting all billing plans
export const getBillingPlans = createRoute({
  tags,
  method: "get",
  path: "/billing/plans",
  responses: {
    [HttpStatusCode.OK]: {
      content: {
        "application/json": {
          schema: z.array(BillingPlanSchema),
        },
      },
      description: "Successfully retrieved billing plans",
    },
    [HttpStatusCode.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "No plans found",
    },
    [HttpStatusCode.INTERNAL_SERVER_ERROR]: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Server error",
    },
  },
});

// Route: GET /billing/history
export const getUserBillingHistory = createRoute({
  tags,
  method: "get",
  path: "/billing/history",
  responses: {
    [HttpStatusCode.OK]: {
      description: "Successfully retrieved user billing history",
      content: {
        "application/json": {
          schema: z.array(BillingHistoryItemSchema),
        },
      },
    },
    [HttpStatusCode.NOT_FOUND]: {
      description: "No billing history found for user",
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
    },
    [HttpStatusCode.INTERNAL_SERVER_ERROR]: {
      description: "Server error",
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
    },
  },
});
