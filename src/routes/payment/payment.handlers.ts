import type { AppRouteHandler } from "@/lib/types";
import * as HttpStatusCode from "@/constants/http-status-codes";
import { validateUserAndGetId } from "@/utils/user-helpers";
import env from "@/env";
import { MidtransClient } from "midtrans-node-client";
import { v4 as uuidv4 } from "uuid";
import type { CreatePaymentTransactionRoute } from "./payment.routes";
import db from "@/db/index";
import { eq } from "drizzle-orm";
import { prices, transactions } from "@/db/schema";

// Handler untuk Membuat Transaksi Pembayaran
export const createPaymentTransaction: AppRouteHandler<
  CreatePaymentTransactionRoute
> = async (c) => {
  try {
    const user = c.get("user");

    // 1. Validasi pengguna
    const userValidation = await validateUserAndGetId(user?.userId);
    if (!userValidation.success || !userValidation.userId) { // Tambahkan pengecekan !userValidation.userId
      return c.json(
        { error: userValidation.error || "User not found" },
        userValidation.statusCode,
      );
    }

    // Di titik ini, TypeScript tahu userValidation.userId adalah 'string' (bukan null)
    const userId = userValidation.userId;

    const body = await c.req.json();
    const { priceId } = body;

    // 2. Ambil detail harga dan paket dari database
    const priceDetails = await db.query.prices.findFirst({
      where: eq(prices.id, priceId),
      with: {
        plan: true,
      },
    });

    if (!priceDetails || !priceDetails.plan || !priceDetails.unitAmount) {
      return c.json({ error: "Selected plan or price not found" }, HttpStatusCode.NOT_FOUND);
    }

    const { unitAmount, plan } = priceDetails;
    const { name: planName } = plan;

    const orderId = uuidv4();
    const grossAmount = unitAmount / 100;

    // 3. Simpan transaksi ke database dengan status 'pending'
    await db.insert(transactions).values({
      id: orderId,
      userId, // 'userId' di sini sudah pasti 'string', jadi error hilang
      priceId,
      status: "pending",
      grossAmount,
    });

    // 4. Inisialisasi Midtrans Snap client
    const snap = new MidtransClient.Snap({
      isProduction: env.NODE_ENV === "production",
      serverKey: env.MIDTRANS_SERVER_KEY,
      clientKey: env.MIDTRANS_CLIENT_KEY,
    });

    // 5. Siapkan parameter transaksi Midtrans
    const parameters = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      item_details: [
        {
          id: priceId,
          price: grossAmount,
          quantity: 1,
          name: planName ?? "Subscription Plan",
        },
      ],
    };

    // 6. Buat token transaksi
    const token = await snap.createTransactionToken(parameters);

    return c.json({ token }, HttpStatusCode.CREATED);
  }
  catch (error) {
    console.error("Error creating payment transaction:", error);
    return c.json(
      { error: "Failed to create payment transaction" },
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};
