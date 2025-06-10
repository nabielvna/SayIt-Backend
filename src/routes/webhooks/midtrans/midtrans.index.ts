import { createRouter } from "@/lib/create-app";
import * as handlers from "./midtrans.handlers";
import * as routes from "./midtrans.routes";

const router = createRouter()
  .openapi(
    routes.handleMidtransNotification,
    handlers.handleMidtransNotification,
  );

export default router;
