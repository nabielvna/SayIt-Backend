import app from "@/app";
import env from "@/env";

const port = env.PORT;
console.log(`Server is running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
