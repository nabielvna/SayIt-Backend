import type { Context } from "hono";
import { verifyToken } from "@clerk/backend";
import * as HttpStatusCode from "@/constants/http-status-codes";
import env from "@/env";
import type { AppBindings } from "@/lib/types";

export async function authMiddleware(c: Context<AppBindings>, next: () => Promise<void>) {
  try {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, HttpStatusCode.UNAUTHORIZED);
    }

    const token = authHeader.replace("Bearer ", "");

    const session = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
    });

    if (!session) {
      return c.json({ error: "Invalid token" }, HttpStatusCode.UNAUTHORIZED);
    }

    c.set("user", {
      userId: session.sub, // atau userId - sesuaikan dengan struktur session dari Clerk
    });

    await next();
  }
  catch (error) {
    console.error("Auth error:", error);
    return c.json({ error: "Authentication failed" }, HttpStatusCode.UNAUTHORIZED);
  }
};
