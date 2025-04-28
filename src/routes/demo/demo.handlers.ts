import type { AppRouteHandler } from "@/lib/types";
import type { DemoRoute } from "./demo.routes";

export const demo: AppRouteHandler<DemoRoute> = (c) => {
  return c.json({
    message: "Demo endpoint",
  }, 200);
};
