import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCode from "@/constants/http-status-codes";

const tags = ["Notes"];

// Mood Schema
const MoodSchema = z.object({
  id: z.string(),
  name: z.string(),
});

// Tag Schema
const TagSchema = z.object({
  id: z.string(),
  name: z.string(),
});

// Note Schema - updated for new structure
const NoteSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  content: z.string(),
  tags: z.array(TagSchema).optional(),
  mood: MoodSchema.nullable().optional(),
  starred: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
});

// Note Request Schema (for create/update) - updated for new structure
const NoteRequestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string(),
  tags: z.array(z.string()).optional(),
  mood: z.string().nullable().optional(),
  starred: z.boolean().optional(),
});

// Error Response Schema
const ErrorResponseSchema = z.object({
  error: z.string(),
});

// Get All Notes Route
export const getAllNotes = createRoute({
  tags,
  method: "get",
  path: "/notes",
  security: [{ bearerAuth: [] }],
  query: z.object({
    starred: z.enum(["true", "false"]).optional(),
    tag: z.string().optional(),
    mood: z.string().optional(),
    search: z.string().optional(),
    limit: z.string().optional(),
    offset: z.string().optional(),
  }),
  responses: {
    [HttpStatusCode.OK]: {
      content: {
        "application/json": {
          schema: z.object({
            notes: z.array(NoteSchema),
            count: z.number(),
            total: z.number(),
          }),
        },
      },
      description: "List of notes",
    },
    [HttpStatusCode.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "User not found",
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

// Get Note By ID Route
export const getNoteById = createRoute({
  tags,
  method: "get",
  path: "/notes/{id}",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    [HttpStatusCode.OK]: {
      content: {
        "application/json": {
          schema: NoteSchema,
        },
      },
      description: "Note details",
    },
    [HttpStatusCode.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Note not found or user not found",
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

// Create Note Route
export const createNote = createRoute({
  tags,
  method: "post",
  path: "/notes",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: NoteRequestSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCode.CREATED]: {
      content: {
        "application/json": {
          schema: NoteSchema,
        },
      },
      description: "Note created successfully",
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
      description: "User not found",
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

// Update Note Route
export const updateNote = createRoute({
  tags,
  method: "put",
  path: "/notes/{id}",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: NoteRequestSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCode.OK]: {
      content: {
        "application/json": {
          schema: NoteSchema,
        },
      },
      description: "Note updated successfully",
    },
    [HttpStatusCode.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Note not found or user not found",
    },
    [HttpStatusCode.BAD_REQUEST]: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Invalid input",
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

// Delete Note Route
export const deleteNote = createRoute({
  tags,
  method: "delete",
  path: "/notes/{id}",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
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
      description: "Note deleted successfully",
    },
    [HttpStatusCode.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Note not found or user not found",
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

// Toggle Star Note Route
export const toggleStarNote = createRoute({
  tags,
  method: "patch",
  path: "/notes/{id}/star",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            starred: z.boolean(),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCode.OK]: {
      content: {
        "application/json": {
          schema: NoteSchema,
        },
      },
      description: "Star status toggled successfully",
    },
    [HttpStatusCode.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Note not found or user not found",
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

// Get Available Tags for User
export const getAvailableTags = createRoute({
  tags,
  method: "get",
  path: "/notes/tags",
  security: [{ bearerAuth: [] }],
  responses: {
    [HttpStatusCode.OK]: {
      content: {
        "application/json": {
          schema: z.object({
            tags: z.array(z.object({
              id: z.string(),
              name: z.string(),
              count: z.number(),
            })),
          }),
        },
      },
      description: "List of available tags with usage count",
    },
    [HttpStatusCode.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "User not found",
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

// Get Available Moods for User
export const getAvailableMoods = createRoute({
  tags,
  method: "get",
  path: "/notes/moods",
  security: [{ bearerAuth: [] }],
  responses: {
    [HttpStatusCode.OK]: {
      content: {
        "application/json": {
          schema: z.object({
            moods: z.array(z.object({
              id: z.string(),
              name: z.string(),
              count: z.number(),
            })),
          }),
        },
      },
      description: "List of available moods with usage count",
    },
    [HttpStatusCode.NOT_FOUND]: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "User not found",
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

export type GetAllNotesRoute = typeof getAllNotes;
export type GetNoteByIdRoute = typeof getNoteById;
export type CreateNoteRoute = typeof createNote;
export type UpdateNoteRoute = typeof updateNote;
export type DeleteNoteRoute = typeof deleteNote;
export type ToggleStarNoteRoute = typeof toggleStarNote;
export type GetAvailableTagsRoute = typeof getAvailableTags;
export type GetAvailableMoodsRoute = typeof getAvailableMoods;
