import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCode from "@/constants/http-status-codes";

const tags = ["Chat"];

// Chat Schema
const ChatSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  type: z.string(),
  preview: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  starred: z.boolean().default(false),
  deletedAt: z.string().nullable(),
});

// Message Schema
const MessageSchema = z.object({
  id: z.string().uuid(),
  chatId: z.string().uuid(),
  type: z.enum(["user", "ai"]),
  content: z.string(),
  createdAt: z.string().nullable(),
});

// Create Chat Route
export const createChat = createRoute({
  tags,
  method: "post",
  path: "/ai-chat",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            title: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCode.CREATED]: {
      content: {
        "application/json": {
          schema: ChatSchema,
        },
      },
      description: "Chat created successfully",
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

// List Chats Route
export const listChats = createRoute({
  tags,
  method: "get",
  path: "/ai-chat",
  security: [{ bearerAuth: [] }],
  responses: {
    [HttpStatusCode.OK]: {
      content: {
        "application/json": {
          schema: z.array(ChatSchema),
        },
      },
      description: "List of chats",
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

// Get Chat Details Route
export const getChatDetails = createRoute({
  tags,
  method: "get",
  path: "/ai-chat/:id",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    [HttpStatusCode.OK]: {
      content: {
        "application/json": {
          schema: z.object({
            chat: ChatSchema,
            messages: z.array(MessageSchema),
          }),
        },
      },
      description: "Chat details with messages",
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
      description: "Chat not found",
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

// Send Message Route
export const sendMessage = createRoute({
  tags,
  method: "post",
  path: "/ai-chat/:id/message",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            content: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCode.OK]: {
      content: {
        "application/json": {
          schema: z.object({
            userMessage: MessageSchema,
            aiMessage: MessageSchema,
            chatUpdated: z.boolean().optional(),
            newTitle: z.string().optional(),
          }),
        },
      },
      description: "Message sent and AI response received",
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
      description: "Chat not found",
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

// Update Chat Route (star/unstar, change title)
export const updateChat = createRoute({
  tags,
  method: "patch",
  path: "/ai-chat/:id",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            starred: z.boolean().optional(),
            title: z.string().min(1).optional(),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCode.OK]: {
      content: {
        "application/json": {
          schema: ChatSchema,
        },
      },
      description: "Chat updated successfully",
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
      description: "Chat not found",
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

// Delete Chat Route
export const deleteChat = createRoute({
  tags,
  method: "delete",
  path: "/ai-chat/:id",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    [HttpStatusCode.OK]: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
      description: "Chat deleted successfully",
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
      description: "Chat not found",
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

export type CreateChatRoute = typeof createChat;
export type ListChatsRoute = typeof listChats;
export type GetChatDetailsRoute = typeof getChatDetails;
export type SendMessageRoute = typeof sendMessage;
export type UpdateChatRoute = typeof updateChat;
export type DeleteChatRoute = typeof deleteChat;
