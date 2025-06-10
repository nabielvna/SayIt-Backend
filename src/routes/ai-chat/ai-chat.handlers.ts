import type { AppRouteHandler } from "@/lib/types";
import type {
  CreateChatRoute,
  DeleteChatRoute,
  GetChatDetailsRoute,
  ListChatsRoute,
  SendMessageRoute,
  UpdateChatRoute,
} from "./ai-chat.routes";
import db from "@/db/index";
import { ai_chats, ai_messages, users } from "@/db/schema";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import * as HttpStatusCode from "@/constants/http-status-codes";
import { aiService } from "@/services/ai.service";
import { formatDates } from "@/utils/format-date";
import { validateUserAndGetId } from "@/utils/user-helpers";
// Import 'Tiktoken' untuk tipe objek, bukan 'TiktokenEncoding'
import type { Tiktoken } from "tiktoken";
import { get_encoding } from "tiktoken";

// =================================================================
// PENGATURAN TOKENIZER DAN BIAYA
// =================================================================

// Inisialisasi tokenizer sekali untuk efisiensi.
const encoding: Tiktoken = get_encoding("cl100k_base"); // <-- PERBAIKAN TIPE DI SINI

// Model biaya yang fleksibel.
const TOKEN_UNIT_COST_INPUT = 0.02;
const TOKEN_UNIT_COST_OUTPUT = 0.03;

/**
 * Fungsi helper untuk menghitung jumlah token dalam sebuah teks.
 * @param text Teks yang akan dihitung.
 * @returns Jumlah token.
 */
function countTokens(text: string): number {
  return encoding.encode(text).length; // Sekarang .encode() akan ditemukan
}

// =================================================================
// HANDLERS
// =================================================================

// Create a new chat
export const createChat: AppRouteHandler<CreateChatRoute> = async (c) => {
  try {
    const user = c.get("user");
    const userValidation = await validateUserAndGetId(user?.userId);

    if (!userValidation.success) {
      return c.json({ error: userValidation.error }, userValidation.statusCode) as any;
    }

    const userId = userValidation.userId!;
    const body = await c.req.json();
    const { title } = body;

    const [newChat] = await db.insert(ai_chats).values({
      userId,
      title,
      preview: "New conversation started",
    }).returning();

    const formattedChat = formatDates(newChat);
    return c.json(formattedChat, HttpStatusCode.CREATED);
  }
  catch (error) {
    console.error("Error creating chat:", error);
    return c.json({ error: "Failed to create chat" }, HttpStatusCode.INTERNAL_SERVER_ERROR) as any;
  }
};

// List all chats for a user
export const listChats: AppRouteHandler<ListChatsRoute> = async (c) => {
  try {
    const user = c.get("user");
    const userValidation = await validateUserAndGetId(user?.userId);

    if (!userValidation.success) {
      return c.json({ error: userValidation.error }, userValidation.statusCode) as any;
    }

    const userId = userValidation.userId!;

    const chats = await db
      .select()
      .from(ai_chats)
      .where(and(eq(ai_chats.userId, userId), isNull(ai_chats.deletedAt)))
      .orderBy(desc(ai_chats.updatedAt));

    const formattedChats = chats.map(formatDates);
    return c.json(formattedChats, HttpStatusCode.OK);
  }
  catch (error) {
    console.error("Error listing chats:", error);
    return c.json({ error: "Failed to list chats" }, HttpStatusCode.INTERNAL_SERVER_ERROR) as any;
  }
};

// Get chat details with messages
export const getChatDetails: AppRouteHandler<GetChatDetailsRoute> = async (c) => {
  try {
    const user = c.get("user");
    const userValidation = await validateUserAndGetId(user?.userId);

    if (!userValidation.success) {
      return c.json({ error: userValidation.error }, userValidation.statusCode) as any;
    }

    const userId = userValidation.userId!;
    const { id } = c.req.param();

    const chat = await db.select().from(ai_chats).where(and(eq(ai_chats.id, id), eq(ai_chats.userId, userId), isNull(ai_chats.deletedAt))).limit(1).then(res => res[0]);

    if (!chat) {
      return c.json({ error: "Chat not found" }, HttpStatusCode.NOT_FOUND) as any;
    }

    const messages = await db.select().from(ai_messages).where(eq(ai_messages.chatId, id)).orderBy(ai_messages.createdAt);

    const formattedChat = formatDates(chat);
    const formattedMessages = messages.map(formatDates);

    return c.json({ chat: formattedChat, messages: formattedMessages }, HttpStatusCode.OK);
  }
  catch (error) {
    console.error("Error getting chat details:", error);
    return c.json({ error: "Failed to get chat details" }, HttpStatusCode.INTERNAL_SERVER_ERROR) as any;
  }
};

// Send a message
export const sendMessage: AppRouteHandler<SendMessageRoute> = async (c) => {
  try {
    const user = c.get("user");
    const userValidation = await validateUserAndGetId(user?.userId);
    if (!userValidation.success) {
      return c.json({ error: userValidation.error }, userValidation.statusCode) as any;
    }
    const userId = userValidation.userId!;
    const { id: chatId } = c.req.param();
    const { content: newContent } = await c.req.json();

    const result = await db.transaction(async (tx) => {
      // LANGKAH 1: Validasi Chat & Ambil Riwayat
      const chat = await tx.query.ai_chats.findFirst({
        where: and(eq(ai_chats.id, chatId), eq(ai_chats.userId, userId), isNull(ai_chats.deletedAt)),
        with: { messages: { orderBy: ai_messages.createdAt } },
      });

      if (!chat)
        throw new Error("CHAT_NOT_FOUND");

      const previousMessages = chat.messages;

      // LANGKAH 2: Hitung Biaya Input & Lakukan Pengecekan Awal
      const historyText = previousMessages.map(m => m.content).join("\n");
      const inputTokens = countTokens(historyText) + countTokens(newContent);
      const inputCost = Math.ceil(inputTokens * TOKEN_UNIT_COST_INPUT);

      const userRecord = await tx.query.users.findFirst({
        columns: { tokenBalance: true },
        where: eq(users.id, userId),
      });

      if (!userRecord || userRecord.tokenBalance < inputCost) {
        throw new Error("INSUFFICIENT_TOKENS_FOR_INPUT");
      }

      // LANGKAH 3: Panggil AI & Hitung Biaya Output
      const chatHistoryForAI = previousMessages.map(msg => ({
        role: msg.type === "user" ? ("user" as const) : ("assistant" as const),
        content: msg.content,
      }));
      chatHistoryForAI.push({ role: "user", content: newContent });

      const aiResponse = await aiService.generateResponse(chatHistoryForAI);

      const outputTokens = countTokens(aiResponse);
      const outputCost = Math.ceil(outputTokens * TOKEN_UNIT_COST_OUTPUT);
      const totalCost = inputCost + outputCost;

      // LANGKAH 4: Kurangi Total Biaya Dari Saldo Pengguna
      const [updatedUser] = await tx.update(users)
        .set({ tokenBalance: sql`${users.tokenBalance} - ${totalCost}` })
        .where(eq(users.id, userId))
        .returning({ newTokenBalance: users.tokenBalance });

      // LANGKAH 5: Simpan Pesan User dan AI
      const [userMessage] = await tx.insert(ai_messages).values({ chatId, type: "user", content: newContent }).returning();
      const [aiMessage] = await tx.insert(ai_messages).values({ chatId, type: "ai", content: aiResponse }).returning();

      // LANGKAH 6: Update Judul & Preview (Opsional)
      const isFirstMessage = previousMessages.length === 0;
      let newTitle;
      if (isFirstMessage) {
        newTitle = await aiService.generateTitle(newContent);
        await tx.update(ai_chats).set({
          preview: newContent.substring(0, 100),
          title: newTitle,
          updatedAt: new Date(),
        }).where(eq(ai_chats.id, chatId));
      }
      else {
        await tx.update(ai_chats).set({
          preview: newContent.substring(0, 100),
          updatedAt: new Date(),
        }).where(eq(ai_chats.id, chatId));
      }

      return {
        userMessage,
        aiMessage,
        newTokenBalance: updatedUser.newTokenBalance,
        costDetails: { inputTokens, outputTokens, totalCost },
        chatUpdated: isFirstMessage,
        newTitle: isFirstMessage ? newTitle : undefined,
      };
    });

    return c.json({
      userMessage: formatDates(result.userMessage),
      aiMessage: formatDates(result.aiMessage),
      newTokenBalance: result.newTokenBalance,
      costDetails: result.costDetails,
      chatUpdated: result.chatUpdated,
      newTitle: result.newTitle,
    }, HttpStatusCode.OK);
  }
  catch (error: any) {
    if (error.message === "CHAT_NOT_FOUND") {
      return c.json({ error: "Chat not found" }, HttpStatusCode.NOT_FOUND) as any;
    }
    if (error.message === "INSUFFICIENT_TOKENS_FOR_INPUT") {
      return c.json({ error: "Insufficient tokens to start this request." }, HttpStatusCode.PAYMENT_REQUIRED) as any;
    }
    console.error("Error sending message:", error);
    return c.json({ error: "Failed to process message" }, HttpStatusCode.INTERNAL_SERVER_ERROR) as any;
  }
};

// Update chat properties
export const updateChat: AppRouteHandler<UpdateChatRoute> = async (c) => {
  try {
    const user = c.get("user");
    const userValidation = await validateUserAndGetId(user?.userId);

    if (!userValidation.success) {
      return c.json({ error: userValidation.error }, userValidation.statusCode) as any;
    }

    const userId = userValidation.userId!;
    const { id } = c.req.param();
    const body = await c.req.json();

    const chat = await db.select().from(ai_chats).where(and(eq(ai_chats.id, id), eq(ai_chats.userId, userId), isNull(ai_chats.deletedAt))).limit(1).then(res => res[0]);

    if (!chat) {
      return c.json({ error: "Chat not found" }, HttpStatusCode.NOT_FOUND) as any;
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };

    if (body.starred !== undefined) {
      updateData.starred = body.starred;
    }
    if (body.title) {
      updateData.title = body.title;
    }

    const [updatedChat] = await db.update(ai_chats).set(updateData).where(eq(ai_chats.id, id)).returning();

    const formattedChat = formatDates(updatedChat);
    return c.json(formattedChat, HttpStatusCode.OK);
  }
  catch (error) {
    console.error("Error updating chat:", error);
    return c.json({ error: "Failed to update chat" }, HttpStatusCode.INTERNAL_SERVER_ERROR) as any;
  }
};

// Delete a chat (soft delete)
export const deleteChat: AppRouteHandler<DeleteChatRoute> = async (c) => {
  try {
    const user = c.get("user");
    const userValidation = await validateUserAndGetId(user?.userId);

    if (!userValidation.success) {
      return c.json({ error: userValidation.error }, userValidation.statusCode) as any;
    }

    const userId = userValidation.userId!;
    const { id } = c.req.param();

    const chat = await db.select().from(ai_chats).where(and(eq(ai_chats.id, id), eq(ai_chats.userId, userId), isNull(ai_chats.deletedAt))).limit(1).then(res => res[0]);

    if (!chat) {
      return c.json({ error: "Chat not found" }, HttpStatusCode.NOT_FOUND) as any;
    }

    await db.update(ai_chats).set({ deletedAt: new Date() }).where(eq(ai_chats.id, id));

    return c.json({ success: true, message: "Chat deleted successfully" }, HttpStatusCode.OK);
  }
  catch (error) {
    console.error("Error deleting chat:", error);
    return c.json({ error: "Failed to delete chat" }, HttpStatusCode.INTERNAL_SERVER_ERROR) as any;
  }
};
