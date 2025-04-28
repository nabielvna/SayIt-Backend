import type { AppOpenAPI } from "@/lib//types";
import packageJSON from "@/../package.json" assert { type: "json" };
import { Scalar } from "@scalar/hono-api-reference";

export default function configureOpenAPI(app: AppOpenAPI) {
  app.doc("/doc", {
    openapi: "3.1.0",
    info: {
      title: packageJSON.name,
      version: packageJSON.version,
    },
  });

  app.get("/doc-ui", Scalar({
    url: "/doc",
    defaultHttpClient: {
      targetKey: "js",
      clientKey: "fetch",
    },
    layout: "classic",
  }));
}
