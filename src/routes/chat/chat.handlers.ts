import type { AppRouteHandler } from "@/lib/types";
import type {
  CreateChatRoute,
  DeleteChatRoute,
  GetChatDetailsRoute,
  ListChatsRoute,
  SendMessageRoute,
  UpdateChatRoute,
} from "./chat.routes";
import db from "@/db/index";
import { ai_chats, ai_messages, MessageType } from "@/db/schema";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import * as HttpStatusCode from "@/constants/http-status-codes";
import { aiService } from "@/services/ai.service";
import { formatDates } from "@/utils/format-date";
import { validateUserAndGetId } from "@/utils/user-helpers";

// Create a new chat
export const createChat: AppRouteHandler<CreateChatRoute> = async (c) => {
  try {
    const user = c.get("user");

    // Check if user is defined and get userId
    const userValidation = await validateUserAndGetId(user?.userId);

    if (!userValidation.success) {
      return c.json(
        { error: userValidation.error },
        userValidation.statusCode,
      ) as any;
    }

    // We can safely assert that userId is not null here because success is true
    const userId = userValidation.userId!;
    const body = await c.req.json();
    const { title } = body;

    // Insert the new chat
    const [newChat] = await db.insert(ai_chats)
      .values({
        userId,
        title,
        preview: "New conversation started",
      })
      .returning();

    // Format the dates for JSON response
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

    // Check if user is defined and get userId
    const userValidation = await validateUserAndGetId(user?.userId);

    if (!userValidation.success) {
      return c.json(
        { error: userValidation.error },
        userValidation.statusCode,
      ) as any;
    }

    // We can safely assert that userId is not null here because success is true
    const userId = userValidation.userId!;

    // Get all non-deleted chats for the user
    const chats = await db.select()
      .from(ai_chats)
      .where(
        and(
          eq(ai_chats.userId, userId),
          isNull(ai_chats.deletedAt),
        ),
      )
      .orderBy(desc(ai_chats.updatedAt));

    // Format all dates
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

    // Check if user is defined and get userId
    const userValidation = await validateUserAndGetId(user?.userId);

    if (!userValidation.success) {
      return c.json(
        { error: userValidation.error },
        userValidation.statusCode,
      ) as any;
    }

    // We can safely assert that userId is not null here because success is true
    const userId = userValidation.userId!;
    const { id } = c.req.param();

    // Get the chat with verification that it belongs to the user
    const chat = await db.select().from(ai_chats).where(
      and(
        eq(ai_chats.id, id),
        eq(ai_chats.userId, userId),
        isNull(ai_chats.deletedAt),
      ),
    ).limit(1).then(res => res[0]);

    if (!chat) {
      return c.json({ error: "Chat not found" }, HttpStatusCode.NOT_FOUND) as any;
    }

    // Get all messages for the chat
    const messages = await db.select()
      .from(ai_messages)
      .where(eq(ai_messages.chatId, id))
      .orderBy(ai_messages.createdAt);

    // Format dates
    const formattedChat = formatDates(chat);
    const formattedMessages = messages.map(formatDates);

    return c.json({
      chat: formattedChat,
      messages: formattedMessages,
    }, HttpStatusCode.OK);
  }
  catch (error) {
    console.error("Error getting chat details:", error);
    return c.json({ error: "Failed to get chat details" }, HttpStatusCode.INTERNAL_SERVER_ERROR) as any;
  }
};

// Send a message and get AI response
export const sendMessage: AppRouteHandler<SendMessageRoute> = async (c) => {
  try {
    const user = c.get("user");

    // Check if user is defined and get userId
    const userValidation = await validateUserAndGetId(user?.userId);

    if (!userValidation.success) {
      return c.json(
        { error: userValidation.error },
        userValidation.statusCode,
      ) as any;
    }

    // We can safely assert that userId is not null here because success is true
    const userId = userValidation.userId!;
    const { id } = c.req.param();
    const body = await c.req.json();
    const { content } = body;

    // Verify the chat exists and belongs to the user
    const chat = await db.select().from(ai_chats).where(
      and(
        eq(ai_chats.id, id),
        eq(ai_chats.userId, userId),
        isNull(ai_chats.deletedAt),
      ),
    ).limit(1).then(res => res[0]);

    if (!chat) {
      return c.json({ error: "Chat not found" }, HttpStatusCode.NOT_FOUND) as any;
    }

    // Count existing messages to check if this is the first message
    const [{ value: messageCount }] = await db.select({
      value: count(),
    }).from(ai_messages).where(eq(ai_messages.chatId, id));

    const isFirstMessage = messageCount === 0;

    // Insert the user message
    const [userMessage] = await db.insert(ai_messages)
      .values({
        chatId: id,
        type: MessageType.USER,
        content,
      })
      .returning();

    // Get previous messages for context
    const previousMessages = await db.select()
      .from(ai_messages)
      .where(eq(ai_messages.chatId, id))
      .orderBy(ai_messages.createdAt);

    // Prepare chat history for AI
    const chatHistory = previousMessages.map(msg => ({
      role: msg.type === MessageType.USER ? "user" as const : "assistant" as const,
      content: msg.content,
    }));

    // Add the current message to the chat history
    chatHistory.push({
      role: "user" as const,
      content,
    });

    // Get AI response
    const aiResponse = await aiService.generateResponse(chatHistory);

    // Insert the AI message
    const [aiMessage] = await db.insert(ai_messages)
      .values({
        chatId: id,
        type: MessageType.AI,
        content: aiResponse,
      })
      .returning();

    // Update preview
    const updateData: Record<string, any> = {
      preview: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
      updatedAt: new Date(),
    };

    // If this is the first message, generate a title using AI
    if (isFirstMessage) {
      const generatedTitle = await aiService.generateTitle(content);
      updateData.title = generatedTitle;
    }

    // Update chat preview and updated time (and title if it's the first message)
    await db.update(ai_chats)
      .set(updateData)
      .where(eq(ai_chats.id, id));

    // Format dates
    const formattedUserMessage = formatDates(userMessage);
    const formattedAiMessage = formatDates(aiMessage);

    return c.json({
      userMessage: formattedUserMessage,
      aiMessage: formattedAiMessage,
      chatUpdated: isFirstMessage,
      newTitle: isFirstMessage ? updateData.title : undefined,
    }, HttpStatusCode.OK);
  }
  catch (error) {
    console.error("Error sending message:", error);
    return c.json({ error: "Failed to process message" }, HttpStatusCode.INTERNAL_SERVER_ERROR) as any;
  }
};

// Update chat properties
export const updateChat: AppRouteHandler<UpdateChatRoute> = async (c) => {
  try {
    const user = c.get("user");

    // Check if user is defined and get userId
    const userValidation = await validateUserAndGetId(user?.userId);

    if (!userValidation.success) {
      return c.json(
        { error: userValidation.error },
        userValidation.statusCode,
      ) as any;
    }

    // We can safely assert that userId is not null here because success is true
    const userId = userValidation.userId!;
    const { id } = c.req.param();
    const body = await c.req.json();

    // Verify the chat exists and belongs to the user
    const chat = await db.select().from(ai_chats).where(
      and(
        eq(ai_chats.id, id),
        eq(ai_chats.userId, userId),
        isNull(ai_chats.deletedAt),
      ),
    ).limit(1).then(res => res[0]);

    if (!chat) {
      return c.json({ error: "Chat not found" }, HttpStatusCode.NOT_FOUND) as any;
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (body.starred !== undefined) {
      updateData.starred = body.starred;
    }

    if (body.title) {
      updateData.title = body.title;
    }

    // Update the chat
    const [updatedChat] = await db.update(ai_chats)
      .set(updateData)
      .where(eq(ai_chats.id, id))
      .returning();

    // Format dates
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

    // Check if user is defined and get userId
    const userValidation = await validateUserAndGetId(user?.userId);

    if (!userValidation.success) {
      return c.json(
        { error: userValidation.error },
        userValidation.statusCode,
      ) as any;
    }

    // We can safely assert that userId is not null here because success is true
    const userId = userValidation.userId!;
    const { id } = c.req.param();

    // Verify the chat exists and belongs to the user
    const chat = await db.select().from(ai_chats).where(
      and(
        eq(ai_chats.id, id),
        eq(ai_chats.userId, userId),
        isNull(ai_chats.deletedAt),
      ),
    ).limit(1).then(res => res[0]);

    if (!chat) {
      return c.json({ error: "Chat not found" }, HttpStatusCode.NOT_FOUND) as any;
    }

    // Soft delete by setting deletedAt
    await db.update(ai_chats)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(ai_chats.id, id));

    return c.json({
      success: true,
      message: "Chat deleted successfully",
    }, HttpStatusCode.OK);
  }
  catch (error) {
    console.error("Error deleting chat:", error);
    return c.json({ error: "Failed to delete chat" }, HttpStatusCode.INTERNAL_SERVER_ERROR) as any;
  }
};
