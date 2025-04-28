import type { AppRouteHandler } from "@/lib/types";
import db from "@/db/index";
import { moods, note_tags, notes, tags } from "@/db/schema";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import * as HttpStatusCode from "@/constants/http-status-codes";
import { validateUserAndGetId } from "@/utils/user-helpers";
import type {
  CreateNoteRoute,
  DeleteNoteRoute,
  GetAllNotesRoute,
  GetAvailableMoodsRoute,
  GetAvailableTagsRoute,
  GetNoteByIdRoute,
  ToggleStarNoteRoute,
  UpdateNoteRoute,
} from "./notes.routes";

// Helper function to format note data to match schema
async function formatNote(note: any) {
  // Get note tags
  const noteTags = await db
    .select({
      id: tags.id,
      name: tags.name,
    })
    .from(tags)
    .innerJoin(
      note_tags,
      eq(note_tags.tagId, tags.id),
    )
    .where(
      eq(note_tags.noteId, note.id),
    );

  // Get mood if exists
  let mood = null;
  if (note.moodId) {
    const moodResult = await db
      .select({
        id: moods.id,
        name: moods.name,
      })
      .from(moods)
      .where(
        eq(moods.id, note.moodId),
      )
      .limit(1);

    if (moodResult.length > 0) {
      mood = moodResult[0];
    }
  }

  return {
    id: note.id,
    userId: note.userId,
    title: note.title,
    content: note.content,
    tags: noteTags.map(tag => ({ id: tag.id, name: tag.name })),
    mood,
    starred: note.starred,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    deletedAt: note.deletedAt ? note.deletedAt.toISOString() : null,
  };
}

// Get All Notes Handler
export const getAllNotes: AppRouteHandler<GetAllNotesRoute> = async (c) => {
  try {
    const user = c.get("user");

    // Check if user is defined and get userId
    const userValidation = await validateUserAndGetId(user?.userId);

    if (!userValidation.success) {
      return c.json(
        { error: userValidation.error },
        userValidation.statusCode,
      );
    }

    // We can safely assert that userId is not null here because success is true
    const userId = userValidation.userId!;

    // Parse query parameters
    const { starred, tag, mood, search, limit, offset } = c.req.query();

    // Build query condition
    let queryCondition = and(
      eq(notes.userId, userId),
      isNull(notes.deletedAt),
    );

    // Add filters
    if (starred === "true") {
      queryCondition = and(queryCondition, eq(notes.starred, true));
    }

    // Filter by mood if provided
    if (mood) {
      // First find the mood id
      const moodResult = await db
        .select({ id: moods.id })
        .from(moods)
        .where(
          and(
            eq(moods.userId, userId),
            eq(moods.name, mood),
          ),
        )
        .limit(1);

      if (moodResult.length > 0) {
        const moodId = moodResult[0].id;
        queryCondition = and(queryCondition, eq(notes.moodId, moodId));
      }
      else {
        // Return empty results if mood doesn't exist
        return c.json(
          {
            notes: [],
            count: 0,
            total: 0,
          },
          HttpStatusCode.OK,
        );
      }
    }

    // Filter by tag if provided
    if (tag) {
      // Find the tag id
      const tagResult = await db
        .select({ id: tags.id })
        .from(tags)
        .where(
          and(
            eq(tags.userId, userId),
            eq(tags.name, tag),
          ),
        )
        .limit(1);

      if (tagResult.length > 0) {
        const tagId = tagResult[0].id;

        // Get note IDs that have this tag
        const noteIdsWithTag = await db
          .select({ noteId: note_tags.noteId })
          .from(note_tags)
          .where(eq(note_tags.tagId, tagId));

        if (noteIdsWithTag.length > 0) {
          // Add condition to filter notes by these IDs
          const noteIds = noteIdsWithTag.map(n => n.noteId);
          queryCondition = and(
            queryCondition,
            sql`${notes.id} IN (${noteIds.join(",")})`,
          );
        }
        else {
          // Return empty results if no notes have this tag
          return c.json(
            {
              notes: [],
              count: 0,
              total: 0,
            },
            HttpStatusCode.OK,
          );
        }
      }
      else {
        // Return empty results if tag doesn't exist
        return c.json(
          {
            notes: [],
            count: 0,
            total: 0,
          },
          HttpStatusCode.OK,
        );
      }
    }

    // Add search condition if provided
    if (search) {
      // Search in both title and content
      queryCondition = and(
        queryCondition,
        or(
          ilike(notes.title, `%${search}%`),
          ilike(notes.content, `%${search}%`),
        ),
      );
    }

    // Parse pagination parameters
    const limitNum = limit ? Number.parseInt(limit, 10) : 20;
    const offsetNum = offset ? Number.parseInt(offset, 10) : 0;

    // Execute query with all filters applied
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(notes)
      .where(queryCondition);

    const total = Number(countResult[0]?.count || 0);

    // Get notes with pagination
    const notesResult = await db
      .select()
      .from(notes)
      .where(queryCondition)
      .orderBy(desc(notes.updatedAt))
      .limit(limitNum)
      .offset(offsetNum);

    // Format notes with tags and mood
    const formattedNotesPromises = notesResult.map(formatNote);
    const formattedNotes = await Promise.all(formattedNotesPromises);

    return c.json(
      {
        notes: formattedNotes,
        count: formattedNotes.length,
        total,
      },
      HttpStatusCode.OK,
    );
  }
  catch (error) {
    console.error("Error fetching notes:", error);
    return c.json(
      { error: "Failed to fetch notes" },
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};

// Get Note By ID Handler
export const getNoteById: AppRouteHandler<GetNoteByIdRoute> = async (c) => {
  try {
    const user = c.get("user");

    // Check if user is defined and get userId
    const userValidation = await validateUserAndGetId(user?.userId);

    if (!userValidation.success) {
      return c.json(
        { error: userValidation.error },
        userValidation.statusCode,
      );
    }

    // We can safely assert that userId is not null here because success is true
    const userId = userValidation.userId!;
    const { id } = c.req.param();

    const noteResult = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.id, id),
          eq(notes.userId, userId),
          isNull(notes.deletedAt),
        ),
      )
      .limit(1);

    if (noteResult.length === 0) {
      return c.json({ error: "Note not found" }, HttpStatusCode.NOT_FOUND);
    }

    // Format note with tags and mood
    const formattedNote = await formatNote(noteResult[0]);

    return c.json(formattedNote, HttpStatusCode.OK);
  }
  catch (error) {
    console.error("Error fetching note:", error);
    return c.json(
      { error: "Failed to fetch note" },
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};

// Helper function to find or create a mood
async function findOrCreateMood(name: string, userId: string) {
  // Check if mood exists
  const existingMood = await db
    .select()
    .from(moods)
    .where(
      and(
        eq(moods.name, name),
        eq(moods.userId, userId),
      ),
    )
    .limit(1);

  if (existingMood.length > 0) {
    return existingMood[0];
  }

  // Create new mood
  const result = await db
    .insert(moods)
    .values({
      name,
      userId,
    })
    .returning();

  return result[0];
}

// Helper function to find or create a tag
async function findOrCreateTag(name: string, userId: string) {
  // Check if tag exists
  const existingTag = await db
    .select()
    .from(tags)
    .where(
      and(
        eq(tags.name, name),
        eq(tags.userId, userId),
      ),
    )
    .limit(1);

  if (existingTag.length > 0) {
    return existingTag[0];
  }

  // Create new tag
  const result = await db
    .insert(tags)
    .values({
      name,
      userId,
    })
    .returning();

  return result[0];
}

// Helper function to update note tags
async function updateNoteTags(noteId: string, tagNames: string[], userId: string) {
  // Delete existing note tags
  await db
    .delete(note_tags)
    .where(eq(note_tags.noteId, noteId));

  // Create tag objects for each tag name
  const tagPromises = tagNames.map(name => findOrCreateTag(name, userId));
  const tagObjects = await Promise.all(tagPromises);

  // Create note-tag relationships
  if (tagObjects.length > 0) {
    const noteTagValues = tagObjects.map(tag => ({
      noteId,
      tagId: tag.id,
    }));

    await db
      .insert(note_tags)
      .values(noteTagValues);
  }
}

// Create Note Handler
export const createNote: AppRouteHandler<CreateNoteRoute> = async (c) => {
  try {
    const user = c.get("user");

    // Check if user is defined and get userId
    const userValidation = await validateUserAndGetId(user?.userId);

    if (!userValidation.success) {
      return c.json(
        { error: userValidation.error },
        userValidation.statusCode,
      );
    }

    // We can safely assert that userId is not null here because success is true
    const userId = userValidation.userId!;
    const body = await c.req.json();

    // Validate required fields
    if (!body.title) {
      return c.json(
        { error: "Title is required" },
        HttpStatusCode.BAD_REQUEST,
      );
    }

    // Prepare note data
    const noteData: any = {
      userId,
      title: body.title,
      content: body.content || "",
      starred: body.starred || false,
    };

    // Handle mood if provided
    if (body.mood) {
      const moodObject = await findOrCreateMood(body.mood, userId);
      noteData.moodId = moodObject.id;
    }

    // Insert note into database
    const result = await db.insert(notes).values(noteData).returning();

    if (!result || result.length === 0) {
      return c.json(
        { error: "Failed to create note" },
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }

    const newNote = result[0];

    // Add tags if provided
    if (body.tags && Array.isArray(body.tags) && body.tags.length > 0) {
      await updateNoteTags(newNote.id, body.tags, userId);
    }

    // Format note with tags and mood
    const formattedNote = await formatNote(newNote);

    return c.json(formattedNote, HttpStatusCode.CREATED);
  }
  catch (error) {
    console.error("Error creating note:", error);
    return c.json(
      { error: "Failed to create note" },
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};

// Update Note Handler
export const updateNote: AppRouteHandler<UpdateNoteRoute> = async (c) => {
  try {
    const user = c.get("user");

    // Check if user is defined and get userId
    const userValidation = await validateUserAndGetId(user?.userId);

    if (!userValidation.success) {
      return c.json(
        { error: userValidation.error },
        userValidation.statusCode,
      );
    }

    // We can safely assert that userId is not null here because success is true
    const userId = userValidation.userId!;
    const { id } = c.req.param();

    // Check if note exists and belongs to user
    const existingNote = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.id, id),
          eq(notes.userId, userId),
          isNull(notes.deletedAt),
        ),
      )
      .limit(1);

    if (existingNote.length === 0) {
      return c.json({ error: "Note not found" }, HttpStatusCode.NOT_FOUND);
    }

    const body = await c.req.json();

    // Validate required fields
    if (!body.title) {
      return c.json(
        { error: "Title is required" },
        HttpStatusCode.BAD_REQUEST,
      );
    }

    // Prepare update data
    const updateData: any = {
      title: body.title,
      content: body.content !== undefined ? body.content : existingNote[0].content,
      starred: body.starred !== undefined ? body.starred : existingNote[0].starred,
      updatedAt: new Date(),
    };

    // Handle mood if provided or explicitly set to null
    if (body.mood !== undefined) {
      if (body.mood === null) {
        updateData.moodId = null;
      }
      else {
        const moodObject = await findOrCreateMood(body.mood, userId);
        updateData.moodId = moodObject.id;
      }
    }

    // Update note
    const result = await db
      .update(notes)
      .set(updateData)
      .where(eq(notes.id, id))
      .returning();

    if (!result || result.length === 0) {
      return c.json(
        { error: "Failed to update note" },
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }

    // Update tags if provided
    if (body.tags !== undefined) {
      await updateNoteTags(id, body.tags || [], userId);
    }

    // Format note with tags and mood
    const formattedNote = await formatNote(result[0]);

    return c.json(formattedNote, HttpStatusCode.OK);
  }
  catch (error) {
    console.error("Error updating note:", error);
    return c.json(
      { error: "Failed to update note" },
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};

// Delete Note Handler (soft delete)
export const deleteNote: AppRouteHandler<DeleteNoteRoute> = async (c) => {
  try {
    const user = c.get("user");

    // Check if user is defined and get userId
    const userValidation = await validateUserAndGetId(user?.userId);

    if (!userValidation.success) {
      return c.json(
        { error: userValidation.error },
        userValidation.statusCode,
      );
    }

    // We can safely assert that userId is not null here because success is true
    const userId = userValidation.userId!;
    const { id } = c.req.param();

    // Check if note exists and belongs to user
    const existingNote = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.id, id),
          eq(notes.userId, userId),
          isNull(notes.deletedAt),
        ),
      )
      .limit(1);

    if (existingNote.length === 0) {
      return c.json({ error: "Note not found" }, HttpStatusCode.NOT_FOUND);
    }

    // Soft delete the note
    await db
      .update(notes)
      .set({ deletedAt: new Date() })
      .where(eq(notes.id, id));

    return c.json(
      { success: true, message: "Note deleted successfully" },
      HttpStatusCode.OK,
    );
  }
  catch (error) {
    console.error("Error deleting note:", error);
    return c.json(
      { error: "Failed to delete note" },
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};

// Toggle Star Note Handler
export const toggleStarNote: AppRouteHandler<ToggleStarNoteRoute> = async (c) => {
  try {
    const user = c.get("user");

    // Check if user is defined and get userId
    const userValidation = await validateUserAndGetId(user?.userId);

    if (!userValidation.success) {
      return c.json(
        { error: userValidation.error },
        userValidation.statusCode,
      );
    }

    // We can safely assert that userId is not null here because success is true
    const userId = userValidation.userId!;
    const { id } = c.req.param();

    // Check if note exists and belongs to user
    const existingNote = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.id, id),
          eq(notes.userId, userId),
          isNull(notes.deletedAt),
        ),
      )
      .limit(1);

    if (existingNote.length === 0) {
      return c.json({ error: "Note not found" }, HttpStatusCode.NOT_FOUND);
    }

    const body = await c.req.json();
    const starred = body.starred !== undefined ? body.starred : !existingNote[0].starred;

    // Update the star status
    const result = await db
      .update(notes)
      .set({
        starred,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, id))
      .returning();

    if (!result || result.length === 0) {
      return c.json(
        { error: "Failed to update star status" },
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }

    // Format note with tags and mood
    const formattedNote = await formatNote(result[0]);

    return c.json(formattedNote, HttpStatusCode.OK);
  }
  catch (error) {
    console.error("Error toggling star status:", error);
    return c.json(
      { error: "Failed to update star status" },
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};

// Get Available Tags Handler
export const getAvailableTags: AppRouteHandler<GetAvailableTagsRoute> = async (c) => {
  try {
    const user = c.get("user");

    // Check if user is defined and get userId
    const userValidation = await validateUserAndGetId(user?.userId);

    if (!userValidation.success) {
      return c.json(
        { error: userValidation.error },
        userValidation.statusCode,
      );
    }

    // We can safely assert that userId is not null here because success is true
    const userId = userValidation.userId!;

    // Get all tags for the user with note count
    const userTags = await db
      .select({
        id: tags.id,
        name: tags.name,
        count: sql<number>`COUNT(${note_tags.noteId})`,
      })
      .from(tags)
      .leftJoin(note_tags, eq(tags.id, note_tags.tagId))
      .leftJoin(notes, eq(note_tags.noteId, notes.id))
      .where(
        and(
          eq(tags.userId, userId),
          or(isNull(notes.deletedAt), isNull(notes.id)),
        ),
      )
      .groupBy(tags.id, tags.name);

    // Format for response
    const formattedTags = userTags.map(tag => ({
      id: tag.id,
      name: tag.name,
      count: Number(tag.count),
    }));

    return c.json({ tags: formattedTags }, HttpStatusCode.OK);
  }
  catch (error) {
    console.error("Error fetching tags:", error);
    return c.json(
      { error: "Failed to fetch tags" },
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};

// Get Available Moods Handler
export const getAvailableMoods: AppRouteHandler<GetAvailableMoodsRoute> = async (c) => {
  try {
    const user = c.get("user");

    // Check if user is defined and get userId
    const userValidation = await validateUserAndGetId(user?.userId);

    if (!userValidation.success) {
      return c.json(
        { error: userValidation.error },
        userValidation.statusCode,
      );
    }

    // We can safely assert that userId is not null here because success is true
    const userId = userValidation.userId!;

    // Get all moods for the user with note count
    const userMoods = await db
      .select({
        id: moods.id,
        name: moods.name,
        count: sql<number>`COUNT(${notes.id})`,
      })
      .from(moods)
      .leftJoin(notes, eq(moods.id, notes.moodId))
      .where(
        and(
          eq(moods.userId, userId),
          or(isNull(notes.deletedAt), isNull(notes.id)),
        ),
      )
      .groupBy(moods.id, moods.name);

    // Format for response
    const formattedMoods = userMoods.map(mood => ({
      id: mood.id,
      name: mood.name,
      count: Number(mood.count),
    }));

    return c.json({ moods: formattedMoods }, HttpStatusCode.OK);
  }
  catch (error) {
    console.error("Error fetching moods:", error);
    return c.json(
      { error: "Failed to fetch moods" },
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};
