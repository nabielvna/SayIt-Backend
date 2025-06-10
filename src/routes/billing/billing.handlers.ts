import type { AppRouteHandler } from "@/lib/types";
import * as HttpStatusCode from "@/constants/http-status-codes";
import db from "@/db/index"; // Assuming you have an exported Drizzle db instance
import type { getBillingPlans, getUserBillingHistory } from "./billing.routes";
import { validateUserAndGetId } from "@/utils/user-helpers";
import { desc, eq } from "drizzle-orm";
import { billing_history } from "@/db/schema";

// Handler to fetch all billing plans
export const getBillingPlansHandler: AppRouteHandler<typeof getBillingPlans> = async (c) => {
  try {
    // Fetch all active plans and their associated active prices
    const plans = await db.query.billing_plans.findMany({
      where: (plan, { eq }) => eq(plan.active, true),
      with: {
        prices: {
          where: (price, { eq }) => eq(price.active, true),
        },
      },
    });

    if (!plans || plans.length === 0) {
      return c.json({ error: "No active plans found" }, HttpStatusCode.NOT_FOUND);
    }

    // Transform data to ensure it matches the strict Zod schema
    const responseData = plans.map(plan => ({
      ...plan,
      isFeatured: plan.isFeatured ?? false, // Coalesce null to false
    }));

    return c.json(responseData, HttpStatusCode.OK);
  }
  catch (error) {
    console.error("Error fetching billing plans:", error);
    return c.json(
      { error: "Failed to fetch billing plans" },
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};

export const getUserBillingHistoryHandler: AppRouteHandler<typeof getUserBillingHistory> = async (c) => {
  try {
    // Adjust this to however you retrieve the current user's ID in your middleware
    const user = c.get("user");
    const userValidation = await validateUserAndGetId(user?.userId);

    if (!userValidation.success || !userValidation.userId) {
      return c.json({ error: "Unauthorized" }, HttpStatusCode.NOT_FOUND);
    }

    const history = await db.query.billing_history.findMany({
      where: eq(billing_history.userId, userValidation.userId),
      orderBy: desc(billing_history.createdAt),
    });

    if (!history.length) {
      return c.json({ error: "No billing history found for user" }, HttpStatusCode.NOT_FOUND);
    }

    return c.json(history, HttpStatusCode.OK);
  }
  catch (error) {
    console.error("Error fetching billing history:", error);
    return c.json(
      { error: "Failed to fetch billing history" },
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};
