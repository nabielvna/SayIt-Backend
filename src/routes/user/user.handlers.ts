import type { AppRouteHandler } from "@/lib/types";
import type { GetCurrentUserRoute } from "./user.routes";
import db from "@/db/index";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as HttpStatusCode from "@/constants/http-status-codes";

export const getCurrentUser: AppRouteHandler<GetCurrentUserRoute> = async (c) => {
  try {
    // Ambil user dari context
    const user = c.get("user");

    if (!user || !user.userId) {
      return c.json({ error: "User not found" }, HttpStatusCode.NOT_FOUND);
    }

    // Query database menggunakan clerk_id
    const userData = await db.select()
      .from(users)
      .where(eq(users.clerk_id, user.userId))
      .limit(1);

    if (userData.length === 0) {
      return c.json({ error: "User not found in database" }, HttpStatusCode.NOT_FOUND);
    }

    // Konversi Date menjadi string dan pastikan tidak null
    const formattedUser = {
      ...userData[0],
      createdAt: userData[0].createdAt ? userData[0].createdAt.toISOString() : "",
      updatedAt: userData[0].updatedAt ? userData[0].updatedAt.toISOString() : "",
    };

    // Return user data yang sudah diformat
    return c.json(formattedUser, HttpStatusCode.OK);
  }
  catch (error) {
    console.error("Error fetching user:", error);
    return c.json({ error: "Failed to fetch user data" }, HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
