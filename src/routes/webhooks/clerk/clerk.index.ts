import { createRouter } from "@/lib/create-app";
import * as handlers from "./clerk.handlers";
import * as routes from "./clerk.routes";

const router = createRouter()
  .openapi(routes.clerkWebhook, handlers.clerkWebhook);

export default router;
