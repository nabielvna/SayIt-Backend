import { createRouter } from "@/lib/create-app";
import { authMiddleware } from "@/middlewares/auth";

import * as handlers from "./user.handlers";
import * as routes from "./user.routes";

const router = createRouter();

router.use(authMiddleware);
router.openapi(routes.getCurrentUser, handlers.getCurrentUser);

export default router;
