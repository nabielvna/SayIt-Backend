import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { generateReadableId } from "./utils/readable-id";

// Users table schema
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerk_id: text("clerk_id").notNull().unique(),
  username: varchar("username", { length: 50 }).unique().notNull().$defaultFn(() => generateReadableId()),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Table for storing AI conversations (ai_chats)
export const ai_chats = pgTable("ai_chats", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  preview: text("preview"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  starred: boolean("starred").default(false),
  deletedAt: timestamp("deleted_at"),
}, table => [
  index("idx_ai_chats_user_id").on(table.userId),
  index("idx_ai_chats_starred").on(table.starred),
]);

// Moods table schema
export const moods = pgTable("moods", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).notNull(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => [
  // Create a unique constraint on mood name per user
  uniqueIndex("idx_moods_user_name").on(table.userId, table.name),
  index("idx_moods_user_id").on(table.userId),
]);

// Tags table schema
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).notNull(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => [
  // Create a unique constraint on tag name per user
  uniqueIndex("idx_tags_user_name").on(table.userId, table.name),
  index("idx_tags_user_id").on(table.userId),
]);

// Notes table schema (updated to reference moods and tags)
export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  starred: boolean("starred").default(false),
  moodId: uuid("mood_id").references(() => moods.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, table => [
  index("idx_notes_user_id").on(table.userId),
  index("idx_notes_starred").on(table.starred),
  index("idx_notes_mood_id").on(table.moodId),
]);

// Join table for notes and tags (many-to-many relationship)
export const note_tags = pgTable("note_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  noteId: uuid("note_id").notNull().references(() => notes.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => [
  // Create a unique constraint to prevent duplicate note-tag pairs
  uniqueIndex("idx_note_tags_unique").on(table.noteId, table.tagId),
  index("idx_note_tags_note_id").on(table.noteId),
  index("idx_note_tags_tag_id").on(table.tagId),
]);

// Enum for message types
export const MessageType = {
  USER: "user",
  AI: "ai",
} as const;

export type MessageTypeValues = typeof MessageType[keyof typeof MessageType];

// Table for storing messages in AI chats
export const ai_messages = pgTable("ai_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id").notNull().references(() => ai_chats.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 10 }).notNull().$type<MessageTypeValues>(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index("idx_ai_messages_chat_id").on(table.chatId),
]);

// Relations

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  aiChats: many(ai_chats),
  notes: many(notes),
  tags: many(tags),
  moods: many(moods),
}));

// AI Chat relations
export const aiChatsRelations = relations(ai_chats, ({ one, many }) => ({
  user: one(users, {
    fields: [ai_chats.userId],
    references: [users.id],
  }),
  messages: many(ai_messages),
}));

// AI Message relations
export const aiMessagesRelations = relations(ai_messages, ({ one }) => ({
  chat: one(ai_chats, {
    fields: [ai_messages.chatId],
    references: [ai_chats.id],
  }),
}));

// Notes relations
export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
  mood: one(moods, {
    fields: [notes.moodId],
    references: [moods.id],
  }),
  note_tags: many(note_tags),
}));

// Moods relations
export const moodsRelations = relations(moods, ({ one, many }) => ({
  user: one(users, {
    fields: [moods.userId],
    references: [users.id],
  }),
  notes: many(notes),
}));

// Tags relations
export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  note_tags: many(note_tags),
}));

// Note-Tags relations
export const noteTagsRelations = relations(note_tags, ({ one }) => ({
  note: one(notes, {
    fields: [note_tags.noteId],
    references: [notes.id],
  }),
  tag: one(tags, {
    fields: [note_tags.tagId],
    references: [tags.id],
  }),
}));
