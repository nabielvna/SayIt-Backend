import { createRouter } from "@/lib/create-app";
import { authMiddleware } from "@/middlewares/auth";

import * as handlers from "./subscription.handlers";
import * as routes from "./subscription.routes";

const router = createRouter();

router.use(authMiddleware);

router.openapi(routes.getSubscriptionStatus, handlers.getSubscriptionStatus);
router.openapi(routes.cancelSubscription, handlers.cancelSubscription);

export default router;
