import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCode from "@/constants/http-status-codes";

const tags = ["Payment"];

// Schema for the payment request body, now based on priceId
const PaymentRequestSchema = z.object({
  priceId: z.string().uuid("Invalid Price ID format"),
});

// Schema for a successful payment response
const PaymentResponseSchema = z.object({
  token: z.string(),
});

// Schema for error responses
const ErrorResponseSchema = z.object({
  error: z.string(),
});

// Route definition for creating a payment transaction
export const createPaymentTransaction = createRoute({
  tags,
  method: "post",
  path: "/payment/charge",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: PaymentRequestSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCode.CREATED]: {
      content: {
        "application/json": {
          schema: PaymentResponseSchema,
        },
      },
      description: "Payment transaction token created successfully",
    },
    [HttpStatusCode.BAD_REQUEST]: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Invalid input",
    },
    [HttpStatusCode.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "User, Plan, or Price not found",
    },
    [HttpStatusCode.UNAUTHORIZED]: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Unauthorized",
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

export type CreatePaymentTransactionRoute = typeof createPaymentTransaction;
