import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { INTERNAL_SERVER_ERROR } from "@/constants/http-status-codes";
import env from "@/env";

const onError: ErrorHandler = (err, c) => {
  const currentStatus = "status" in err
    ? Number(err.status)
    : c.newResponse(null).status;

  const statusCode: ContentfulStatusCode
    = currentStatus && currentStatus >= 400 && currentStatus < 600
      ? (currentStatus as ContentfulStatusCode)
      : INTERNAL_SERVER_ERROR;

  const nodeEnv = env.NODE_ENV;
  return c.json(
    {
      message: err.message,
      stack: nodeEnv === "production" ? undefined : err.stack,
    },
    statusCode,
  );
};

export default onError;
