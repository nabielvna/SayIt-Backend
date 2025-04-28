import { createRouter } from "@/lib/create-app";

import * as handlers from "./demo.handlers";
import * as routes from "./demo.routes";

const router = createRouter()
  .openapi(routes.demo, handlers.demo);

export default router;
