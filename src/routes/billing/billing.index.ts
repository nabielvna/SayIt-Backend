import { createRouter } from "@/lib/create-app";
import * as handlers from "./billing.handlers";
import * as routes from "./billing.routes";
import { authMiddleware } from "@/middlewares/auth";

const router = createRouter();

router.openapi(routes.getBillingPlans, handlers.getBillingPlansHandler);

router.use(authMiddleware);

router.openapi(
  routes.getUserBillingHistory,
  handlers.getUserBillingHistoryHandler,
);

export default router;
