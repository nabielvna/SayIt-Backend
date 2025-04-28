import { createRouter } from "@/lib/create-app";
import { authMiddleware } from "@/middlewares/auth";

import * as handlers from "./notes.handlers";
import * as routes from "./notes.routes";

const router = createRouter();

// Apply authentication middleware to all notes routes
router.use(authMiddleware);

// Register routes - IMPORTANT: Register specific routes before dynamic routes
router.openapi(routes.getAllNotes, handlers.getAllNotes);
// Register specific routes first
router.openapi(routes.getAvailableTags, handlers.getAvailableTags);
router.openapi(routes.getAvailableMoods, handlers.getAvailableMoods);
// Then register dynamic routes
router.openapi(routes.getNoteById, handlers.getNoteById);
router.openapi(routes.createNote, handlers.createNote);
router.openapi(routes.updateNote, handlers.updateNote);
router.openapi(routes.deleteNote, handlers.deleteNote);
router.openapi(routes.toggleStarNote, handlers.toggleStarNote);

export default router;
