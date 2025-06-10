import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { generateReadableId } from "./utils/readable-id";

// =================================================================
// ENUMS
// =================================================================

/** Status untuk langganan pengguna. */
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "unpaid",
]);

/** Tipe harga: sekali bayar atau berulang. */
export const pricingTypeEnum = pgEnum("pricing_type", ["one_time", "recurring"]);

/** Interval penagihan untuk harga berulang. */
export const pricingPlanIntervalEnum = pgEnum("pricing_plan_interval", [
  "day",
  "week",
  "month",
  "year",
]);

export const messageTypeEnum = pgEnum("message_type", ["user", "ai"]);

export const MessageType = {
  USER: "user",
  AI: "ai",
} as const;

export type MessageTypeValue = (typeof messageTypeEnum.enumValues)[number];

/** Status untuk transaksi pembayaran. */
export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "settlement",
  "capture",
  "deny",
  "cancel",
  "expire",
  "failure",
]);

// =================================================================
// CORE TABLES
// =================================================================

/** Tabel untuk menyimpan data pengguna. */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerk_id: text("clerk_id").notNull().unique(),
  username: varchar("username", { length: 50 })
    .unique()
    .notNull()
    .$defaultFn(() => generateReadableId()),
  tokenBalance: integer("token_balance").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Tabel untuk menyimpan percakapan dengan AI. */
export const ai_chats = pgTable("ai_chats", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  preview: text("preview"),
  starred: boolean("starred").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, table => ({
  userIdIdx: index("idx_ai_chats_user_id").on(table.userId),
}));

/** Tabel untuk menyimpan pesan dalam setiap percakapan AI. */
export const ai_messages = pgTable("ai_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id").notNull().references(() => ai_chats.id, { onDelete: "cascade" }),
  type: messageTypeEnum("type").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  chatIdIdx: index("idx_ai_messages_chat_id").on(table.chatId),
}));

/** Tabel untuk menyimpan mood yang ditentukan pengguna. */
export const moods = pgTable("moods", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 50 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  userMoodUniqueIdx: uniqueIndex("idx_moods_user_name").on(table.userId, table.name),
}));

/** Tabel untuk menyimpan tag yang ditentukan pengguna. */
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 50 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  userTagUniqueIdx: uniqueIndex("idx_tags_user_name").on(table.userId, table.name),
}));

/** Tabel untuk catatan atau jurnal pengguna. */
export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  starred: boolean("starred").default(false),
  moodId: uuid("mood_id").references(() => moods.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, table => ({
  userIdIdx: index("idx_notes_user_id").on(table.userId),
}));

/** Tabel penghubung (join table) untuk relasi Many-to-Many antara catatan dan tag. */
export const note_tags = pgTable("note_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  noteId: uuid("note_id").notNull().references(() => notes.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  noteTagUniqueIdx: uniqueIndex("idx_note_tags_unique").on(table.noteId, table.tagId),
}));

// =================================================================
// BILLING TABLES
// =================================================================

/** Menyimpan paket langganan yang ditawarkan (misal: Basic, Pro). */
export const billing_plans = pgTable("billing_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // e.g., "Pro Plan"
  description: text("description"),
  tokens: integer("tokens"), // Jumlah token AI yang didapat
  features: text("features").array(), // Fitur dalam bentuk array string
  isFeatured: boolean("is_featured").default(false), // Untuk menandai paket unggulan
  active: boolean("active").default(true).notNull(),
  // ID dari payment provider (misal: Stripe) untuk referensi. Opsional.
  stripeProductId: text("stripe_product_id").unique(),
});

/** Menyimpan harga spesifik untuk setiap paket (misal: bulanan, tahunan). */
export const prices = pgTable("prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id").references(() => billing_plans.id, { onDelete: "cascade" }),
  active: boolean("active").default(true).notNull(),
  description: text("description"),
  // Harga dalam satuan mata uang terkecil (misal: sen untuk IDR)
  unitAmount: integer("unit_amount"),
  currency: varchar("currency", { length: 3 }), // e.g., "idr"
  type: pricingTypeEnum("type"), // "one_time" or "recurring"
  interval: pricingPlanIntervalEnum("interval"), // e.g., "month", "year"
  intervalCount: integer("interval_count"),
  trialPeriodDays: integer("trial_period_days").default(0),
  // ID dari payment provider (misal: Stripe) untuk referensi. Opsional.
  stripePriceId: text("stripe_price_id").unique(),
});

/** Menyimpan status langganan aktif setiap pengguna. */
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  priceId: uuid("price_id").notNull().references(() => prices.id),
  status: subscriptionStatusEnum("status"),
  // ID langganan dari payment provider (misal: Midtrans order_id atau Stripe sub_id)
  paymentProviderSubscriptionId: text("payment_provider_subscription_id").unique(),
  metadata: text("metadata"), // Untuk menyimpan data tambahan dari webhook
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).defaultNow().notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  cancelAt: timestamp("cancel_at", { withTimezone: true }),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  trialStart: timestamp("trial_start", { withTimezone: true }),
  trialEnd: timestamp("trial_end", { withTimezone: true }),
}, table => ({
  userIdIdx: index("idx_subscriptions_user_id").on(table.userId),
}));

/** Menyimpan riwayat semua pembayaran dan tagihan untuk pengguna. */
export const billing_history = pgTable("billing_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
  priceId: uuid("price_id").references(() => prices.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  amount: integer("amount").notNull(), // Jumlah dalam satuan mata uang terkecil
  currency: varchar("currency", { length: 3 }).notNull(),
  status: text("status").notNull(), // e.g., "paid", "open", "void"
  invoicePdf: text("invoice_pdf"), // Link ke PDF invoice jika ada
  // ID invoice dari payment provider. Opsional.
  paymentProviderInvoiceId: text("payment_provider_invoice_id").unique(),
}, table => ({
  userIdIdx: index("idx_billing_history_user_id").on(table.userId),
}));

// =================================================================
// TRANSACTION TRACKING TABLE
// =================================================================

/** Mencatat setiap upaya transaksi yang dibuat, bertindak sebagai jembatan untuk webhook. */
export const transactions = pgTable("transactions", {
  // ID ini akan digunakan sebagai `order_id` untuk Midtrans
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  priceId: uuid("price_id").notNull().references(() => prices.id),
  status: transactionStatusEnum("status").notNull().default("pending"),
  grossAmount: integer("gross_amount").notNull(), // dalam satuan terkecil (sen)
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  userIdIdx: index("idx_transactions_user_id").on(table.userId),
}));

// =================================================================
// RELATIONS
// =================================================================

export const usersRelations = relations(users, ({ many, one }) => ({
  aiChats: many(ai_chats),
  notes: many(notes),
  tags: many(tags),
  moods: many(moods),
  subscription: one(subscriptions, { fields: [users.id], references: [subscriptions.userId] }),
  billingHistory: many(billing_history),
  transactions: many(transactions),
}));

export const aiChatsRelations = relations(ai_chats, ({ one, many }) => ({
  user: one(users, { fields: [ai_chats.userId], references: [users.id] }),
  messages: many(ai_messages),
}));

export const aiMessagesRelations = relations(ai_messages, ({ one }) => ({
  chat: one(ai_chats, { fields: [ai_messages.chatId], references: [ai_chats.id] }),
}));

export const moodsRelations = relations(moods, ({ one, many }) => ({
  user: one(users, { fields: [moods.userId], references: [users.id] }),
  notes: many(notes),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, { fields: [tags.userId], references: [users.id] }),
  note_tags: many(note_tags),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
  mood: one(moods, { fields: [notes.moodId], references: [moods.id] }),
  note_tags: many(note_tags),
}));

export const noteTagsRelations = relations(note_tags, ({ one }) => ({
  note: one(notes, { fields: [note_tags.noteId], references: [notes.id] }),
  tag: one(tags, { fields: [note_tags.tagId], references: [tags.id] }),
}));

export const billingPlansRelations = relations(billing_plans, ({ many }) => ({
  prices: many(prices),
}));

export const pricesRelations = relations(prices, ({ one }) => ({
  plan: one(billing_plans, { fields: [prices.planId], references: [billing_plans.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
  price: one(prices, { fields: [subscriptions.priceId], references: [prices.id] }),
}));

export const billingHistoryRelations = relations(billing_history, ({ one }) => ({
  user: one(users, { fields: [billing_history.userId], references: [users.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  price: one(prices, { fields: [transactions.priceId], references: [prices.id] }),
}));
