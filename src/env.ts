/* eslint-disable node/no-process-env */

import { z } from "zod";
import { config } from "dotenv";
import { expand } from "dotenv-expand";

expand(config());

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(3001),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]),
  DATABASE_URL: z.string().url(),
  CLERK_SECRET_KEY: z.string(),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string(),
  GEMINI_API_KEY: z.string(),
});

export type env = z.infer<typeof EnvSchema>;

// eslint-disable-next-line import/no-mutable-exports, ts/no-redeclare
let env: env;

try {
  env = EnvSchema.parse(process.env);
}
catch (e) {
  const error = e as z.ZodError;
  console.error("Invalid env:");
  console.error(error.flatten().fieldErrors);
  process.exit(1);
}

env = EnvSchema.parse(process.env);

export default env;
