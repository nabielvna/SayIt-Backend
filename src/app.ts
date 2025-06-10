import createApp from "@/lib/create-app";
import configureOpenAPI from "@/lib/configure-open-api";

// --- (Publik) ---
import index from "@/routes/index.route";
import clerk from "@/routes/webhooks/clerk/clerk.index";
import midtrans from "@/routes/webhooks/midtrans/midtrans.index";

// --- (API Terlindungi) ---
import demo from "@/routes/demo/demo.index";
import user from "@/routes/user/user.index";
import chat from "@/routes/ai-chat/ai-chat.index";
import notes from "@/routes/notes/notes.index";
import payment from "@/routes/payment/payment.index";
import billing from "@/routes/billing/billing.index";
import subscription from "@/routes/subscription/subscription.index";

const app = createApp();

// 1. Kelompokkan rute publik dan rute API
const publicRoutes = [index, clerk, midtrans];
const apiRoutes = [demo, user, chat, notes, billing, payment, subscription];

// 2. Daftarkan rute-rute publik ke root path `/`
publicRoutes.forEach((route) => {
  app.route("/", route);
});

// 3. Daftarkan SEMUA rute API yang dilindungi ke base path `/api`
apiRoutes.forEach((route) => {
  app.route("/api", route);
});

// Konfigurasi OpenAPI
configureOpenAPI(app);

export default app;
