import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import "dotenv/config"; // Pastikan variabel environment termuat

import * as schema from "../schema"; // Sesuaikan path ke file schema Anda
import env from "@/env";

// Pastikan DATABASE_URL ada di file .env Anda
if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env file");
}

// PERUBAHAN: Konfigurasi SSL dipindahkan ke dalam DATABASE_URL.
// Pastikan variabel DATABASE_URL di file .env Anda diakhiri dengan '?sslmode=require'.
// Contoh: postgres://user:pass@host:port/db?sslmode=require
const db = drizzle(postgres(env.DATABASE_URL), { schema });

async function main() {
  try {
    console.log("Seeding database...");

    // Hapus data lama untuk menghindari duplikat (opsional)
    await db.delete(schema.prices);
    await db.delete(schema.billing_plans);

    // --- 1. Definisikan Data Paket ---
    const plansToSeed = [
      {
        id: "1e8a4a2b-3e5f-46b8-8a8e-4a6c2b1e8a4a", // UUID Valid
        name: "Basic",
        description: "Untuk pengguna personal dan proyek kecil.",
        tokens: 50000,
        features: ["Akses ke Sayit AI", "1 sesi chat profesional/bulan", "Penyimpanan catatan dasar"],
        isFeatured: false,
        stripeProductId: "prod_basic_xxxxxxxx", // Ganti dengan ID produk dari Stripe
      },
      {
        id: "2f9b5b3c-4f6e-47c9-9b9f-5b7d3c2f9b5b", // UUID Valid (memperbaiki 'g' menjadi 'e')
        name: "Pro",
        description: "Paling populer untuk profesional dan tim.",
        tokens: 200000,
        features: ["Semua fitur di Basic", "Sesi chat profesional tanpa batas", "Analitik penggunaan token", "Dukungan prioritas"],
        isFeatured: true,
        stripeProductId: "prod_pro_xxxxxxxx", // Ganti dengan ID produk dari Stripe
      },
      {
        id: "3a0c6c4d-5a7b-48d0-ac0a-6c8e4d3a0c6c", // UUID Valid (memperbaiki 'g' dan 'h' menjadi 'a' dan 'b')
        name: "Enterprise",
        description: "Untuk organisasi besar dengan kebutuhan kustom.",
        tokens: null, // `null` bisa berarti tak terbatas
        features: ["Semua fitur di Pro", "Akses API", "Manajer akun khusus", "Keamanan tingkat lanjut"],
        isFeatured: false,
        stripeProductId: "prod_enterprise_xxxxxxxx", // Ganti dengan ID produk dari Stripe
      },
    ];

    // --- 2. Masukkan Paket ke Database ---
    const insertedPlans = await db
      .insert(schema.billing_plans)
      .values(plansToSeed)
      .returning();

    console.log(`Seeded ${insertedPlans.length} plans.`);

    // --- 3. Definisikan dan Masukkan Harga untuk Setiap Paket ---
    const pricesToSeed = [
      {
        planId: insertedPlans[0].id, // Hubungkan ke plan 'Basic'
        unitAmount: 7500000, // Harga dalam sen/unit terkecil (Rp 75.000)
        currency: "idr",
        interval: "month" as const,
        type: "recurring" as const,
        stripePriceId: "price_basic_monthly_xxxxxxxx", // Ganti dengan ID harga dari Stripe
      },
      {
        planId: insertedPlans[1].id, // Hubungkan ke plan 'Pro'
        unitAmount: 15000000, // Harga dalam sen/unit terkecil (Rp 150.000)
        currency: "idr",
        interval: "month" as const,
        type: "recurring" as const,
        stripePriceId: "price_pro_monthly_xxxxxxxx", // Ganti dengan ID harga dari Stripe
      },
      {
        planId: insertedPlans[2].id, // Hubungkan ke plan 'Enterprise'
        unitAmount: 45000000, // Harga dalam sen/unit terkecil (Rp 450.000)
        currency: "idr",
        interval: "month" as const,
        type: "recurring" as const,
        stripePriceId: "price_enterprise_monthly_xxxxxxxx", // Ganti dengan ID harga dari Stripe
      },
    ];

    const insertedPrices = await db
      .insert(schema.prices)
      .values(pricesToSeed)
      .returning();

    console.log(`Seeded ${insertedPrices.length} prices.`);

    console.log("Database seeding complete.");
    process.exit(0);
  }
  catch (error) {
    console.error("Error during database seeding:", error);
    process.exit(1);
  }
};

main();
