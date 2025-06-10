import type { AppRouteHandler } from "@/lib/types";
import * as HttpStatusCode from "@/constants/http-status-codes";
import db from "@/db/index";
import env from "@/env";
import { and, eq, sql } from "drizzle-orm";
import { billing_history, subscriptions, transactions, users } from "@/db/schema";
import type { HandleMidtransNotificationRoute } from "./midtrans.routes";
import { MidtransClient } from "midtrans-node-client";
import { add } from "date-fns";

/**
 * Menghitung tanggal kedaluwarsa langganan berdasarkan interval dan jumlahnya.
 * @param interval - Tipe interval ('day', 'week', 'month', 'year').
 * @param count - Jumlah interval.
 * @returns {Date} Tanggal kedaluwarsa.
 */
function getSubscriptionEndDate(
  interval: "day" | "week" | "month" | "year",
  count: number,
): Date {
  const now = new Date();
  switch (interval) {
    case "day": return add(now, { days: count });
    case "week": return add(now, { weeks: count });
    case "month": return add(now, { months: count });
    case "year": return add(now, { years: count });
    default: return add(now, { months: 1 }); // Fallback default 1 bulan
  }
}

/**
 * Handler untuk memproses notifikasi webhook dari Midtrans.
 */
export const handleMidtransNotification: AppRouteHandler<
  HandleMidtransNotificationRoute
> = async (c) => {
  try {
    const notification = await c.req.json();

    // 1. Inisialisasi Midtrans API client untuk verifikasi
    const apiClient = new MidtransClient.Snap({
      isProduction: env.NODE_ENV === "production",
      serverKey: env.MIDTRANS_SERVER_KEY,
      clientKey: env.MIDTRANS_CLIENT_KEY,
    });

    // 2. Verifikasi keaslian notifikasi menggunakan signature key
    const isValidSignature = await apiClient.transaction.notification(notification);
    if (!isValidSignature) {
      console.warn("Invalid Midtrans signature received.");
      return c.json({ error: "Invalid signature" }, HttpStatusCode.UNAUTHORIZED);
    }

    const { order_id: orderId, transaction_status: transactionStatus } = notification;

    // 3. Ambil data transaksi dari DB, termasuk data plan untuk mendapatkan jumlah token
    const currentTransaction = await db.query.transactions.findFirst({
      where: and(eq(transactions.id, orderId), eq(transactions.status, "pending")),
      with: {
        price: {
          columns: { interval: true, intervalCount: true },
          with: {
            plan: {
              columns: { tokens: true }, // Ambil jumlah token dari plan
            },
          },
        },
      },
    });

    if (!currentTransaction) {
      console.log(`Webhook received for non-pending or non-existent order_id: ${orderId}`);
      // Kembalikan error 404 sesuai skema yang didefinisikan
      return c.json(
        { error: "Transaction not found or already processed" },
        HttpStatusCode.NOT_FOUND,
      );
    }

    // 4. Proses berdasarkan status transaksi
    if (transactionStatus === "capture" || transactionStatus === "settlement") {
      // Gunakan transaksi DB untuk memastikan semua operasi berhasil atau tidak sama sekali
      await db.transaction(async (tx) => {
        // a. Perbarui status transaksi menjadi 'settlement'
        await tx
          .update(transactions)
          .set({ status: "settlement", updatedAt: new Date() })
          .where(eq(transactions.id, orderId));

        // b. Hitung tanggal akhir langganan
        const interval = currentTransaction.price?.interval ?? "month";
        const intervalCount = currentTransaction.price?.intervalCount ?? 1;
        const endDate = getSubscriptionEndDate(interval, intervalCount);

        // c. Buat atau perbarui langganan pengguna menjadi 'active'
        const [subscription] = await tx
          .insert(subscriptions)
          .values({
            userId: currentTransaction.userId,
            priceId: currentTransaction.priceId,
            status: "active",
            paymentProviderSubscriptionId: orderId, // Gunakan orderId sebagai referensi
            currentPeriodStart: new Date(),
            currentPeriodEnd: endDate,
            metadata: JSON.stringify(notification),
          })
          .onConflictDoUpdate({ // Jika user sudah punya langganan, update saja
            target: subscriptions.userId,
            set: {
              priceId: currentTransaction.priceId,
              status: "active",
              paymentProviderSubscriptionId: orderId,
              currentPeriodStart: new Date(),
              currentPeriodEnd: endDate,
              metadata: JSON.stringify(notification),
            },
          })
          .returning();

        // d. Tambahkan token ke saldo pengguna
        const tokensFromPlan = currentTransaction.price?.plan?.tokens ?? 0;
        if (tokensFromPlan > 0) {
          await tx
            .update(users)
            .set({ tokenBalance: sql`${users.tokenBalance} + ${tokensFromPlan}` })
            .where(eq(users.id, currentTransaction.userId));
        }

        // e. Catat ke riwayat tagihan (billing history)
        await tx.insert(billing_history).values({
          userId: currentTransaction.userId,
          subscriptionId: subscription.id,
          priceId: currentTransaction.priceId,
          amount: currentTransaction.grossAmount,
          currency: "IDR",
          status: "paid",
        });
      });
    }
    else if (["expire", "cancel", "deny"].includes(transactionStatus)) {
      // Jika pembayaran gagal, kedaluwarsa, atau dibatalkan, cukup perbarui statusnya
      await db
        .update(transactions)
        .set({ status: transactionStatus as any, updatedAt: new Date() })
        .where(eq(transactions.id, orderId));
    }

    // 5. Kirim response 200 OK untuk memberitahu Midtrans bahwa notifikasi telah diterima
    return c.json(
      { status: "success", message: "Webhook processed successfully" },
      HttpStatusCode.OK,
    );
  }
  catch (error) {
    console.error("Error handling Midtrans webhook:", error);
    return c.json(
      { error: "Internal server error" },
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};
