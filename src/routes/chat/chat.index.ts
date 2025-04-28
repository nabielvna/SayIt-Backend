import { createRouter } from "@/lib/create-app";
import { authMiddleware } from "@/middlewares/auth";

import * as handlers from "./chat.handlers";
import * as routes from "./chat.routes";

const router = createRouter();

// Apply authentication middleware to all chat routes
router.use(authMiddleware);

// Register all routes with their handlers
router.openapi(routes.createChat, handlers.createChat);
router.openapi(routes.listChats, handlers.listChats);
router.openapi(routes.getChatDetails, handlers.getChatDetails);
router.openapi(routes.sendMessage, handlers.sendMessage);
router.openapi(routes.updateChat, handlers.updateChat);
router.openapi(routes.deleteChat, handlers.deleteChat);

export default router;
