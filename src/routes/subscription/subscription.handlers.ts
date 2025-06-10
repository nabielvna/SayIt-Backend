// src/routes/subscription/subscription.handlers.ts

import type { AppRouteHandler } from "@/lib/types";
import * as HttpStatusCode from "@/constants/http-status-codes";
import { validateUserAndGetId } from "@/utils/user-helpers";
import db from "@/db/index";
import { and, eq, isNull } from "drizzle-orm";
import { subscriptions, users } from "@/db/schema";
import type { CancelSubscriptionRoute, GetSubscriptionStatusRoute } from "./subscription.routes";

// --- Handler untuk Mendapatkan Status Langganan ---
export const getSubscriptionStatus: AppRouteHandler<GetSubscriptionStatusRoute> = async (c) => {
  try {
    const user = c.get("user");
    const userValidation = await validateUserAndGetId(user?.userId);
    if (!userValidation.success || !userValidation.userId) {
      return c.json({ error: "Pengguna tidak ditemukan" }, userValidation.statusCode);
    }

    const userData = await db.query.users.findFirst({
      where: eq(users.id, userValidation.userId),
      columns: { tokenBalance: true },
      with: {
        subscription: {
          with: { price: { with: { plan: { columns: { name: true } } } } },
        },
      },
    });

    if (!userData) {
      return c.json({ error: "Pengguna tidak ditemukan" }, HttpStatusCode.NOT_FOUND);
    }

    const sub = userData.subscription;
    const plan = sub?.price?.plan;

    const responsePayload = {
      tokenBalance: userData.tokenBalance,
      subscription: sub && plan
        ? {
            planName: plan.name,
            status: sub.status,
            currentPeriodEnd: sub.currentPeriodEnd,
            priceId: sub.priceId,
          }
        : null,
    };

    // FIX: Tambahkan status kode HttpStatusCode.OK secara eksplisit
    return c.json(responsePayload, HttpStatusCode.OK);
  }
  catch (error) {
    console.error("Gagal mendapatkan status langganan:", error);
    return c.json({ error: "Gagal mendapatkan status langganan" }, HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

// --- Handler untuk Membatalkan Langganan ---
export const cancelSubscription: AppRouteHandler<CancelSubscriptionRoute> = async (c) => {
  try {
    const user = c.get("user");
    const userValidation = await validateUserAndGetId(user?.userId);
    if (!userValidation.success || !userValidation.userId) {
      return c.json({ error: "Pengguna tidak ditemukan" }, userValidation.statusCode);
    }

    const now = new Date();

    const [updatedSubscription] = await db.update(subscriptions)
      .set({
        status: "canceled",
        canceledAt: now,
      })
      .where(and(
        eq(subscriptions.userId, userValidation.userId),
        eq(subscriptions.status, "active"),
        isNull(subscriptions.canceledAt),
      ))
      .returning({
        canceledAt: subscriptions.canceledAt,
      });

    if (!updatedSubscription) {
      return c.json({ error: "Tidak ada langganan aktif yang dapat dibatalkan." }, HttpStatusCode.NOT_FOUND);
    }

    const responsePayload = {
      message: "Langganan berhasil dibatalkan.",
      canceledAt: updatedSubscription.canceledAt!, // Non-null assertion is safe here
    };

    // FIX: Tambahkan status kode HttpStatusCode.OK secara eksplisit
    return c.json(responsePayload, HttpStatusCode.OK);
  }
  catch (error) {
    console.error("Gagal membatalkan langganan:", error);
    return c.json({ error: "Gagal membatalkan langganan" }, HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
