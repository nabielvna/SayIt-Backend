import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCode from "@/constants/http-status-codes";

const tags = ["User"];

// User Schema
const UserSchema = z.object({
  id: z.string(),
  clerk_id: z.string(),
  username: z.string(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

// Get Current User Route
export const getCurrentUser = createRoute({
  tags,
  method: "get",
  path: "/user/me",
  security: [{ bearerAuth: [] }],
  responses: {
    [HttpStatusCode.OK]: {
      content: {
        "application/json": {
          schema: UserSchema,
        },
      },
      description: "Current user data",
    },
    [HttpStatusCode.UNAUTHORIZED]: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "Unauthorized",
    },
    [HttpStatusCode.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "User not found",
    },
    [HttpStatusCode.INTERNAL_SERVER_ERROR]: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "Server error",
    },
  },
});

export type GetCurrentUserRoute = typeof getCurrentUser;
