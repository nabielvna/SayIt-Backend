import { createRouter } from "@/lib/create-app";
import { authMiddleware } from "@/middlewares/auth";

import * as handlers from "./payment.handlers";
import * as routes from "./payment.routes";

const router = createRouter();

// Apply authentication middleware to all payment routes
router.use(authMiddleware);

// Register payment routes
router.openapi(routes.createPaymentTransaction, handlers.createPaymentTransaction);

export default router;
