import db from "@/db/index";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as HttpStatusCode from "@/constants/http-status-codes";

/**
 * Helper function to get user ID from clerk ID
 * @param clerkId The Clerk user ID
 * @returns The database user ID or null if not found
 */
export async function getUserIdFromClerkId(clerkId: string | undefined): Promise<string | null> {
  if (!clerkId)
    return null;

  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerk_id, clerkId))
    .limit(1);

  return result.length > 0 ? result[0].id : null;
}

/**
 * Result interface for user validation
 */
export interface UserValidationResult {
  success: boolean;
  userId: string | null;
  error: string;
  statusCode: 401 | 404; // Specifically using the exact status codes expected by routes
}

/**
 * Helper function to check if the user exists and get their database ID
 * @param clerkId The Clerk user ID (can be undefined)
 * @returns An object with validation results including success, userId, error and HTTP status code
 */
export async function validateUserAndGetId(clerkId: string | undefined): Promise<UserValidationResult> {
  if (!clerkId) {
    return {
      success: false,
      userId: null,
      error: "Unauthorized or invalid session",
      statusCode: HttpStatusCode.UNAUTHORIZED as 401,
    };
  }

  const userId = await getUserIdFromClerkId(clerkId);

  if (!userId) {
    return {
      success: false,
      userId: null,
      error: "User not found",
      statusCode: HttpStatusCode.NOT_FOUND as 404,
    };
  }

  return {
    success: true,
    userId,
    error: "", // Still providing a value even though it won't be used when success is true
    statusCode: HttpStatusCode.OK as 401, // This is actually never used when success is true
  };
}
