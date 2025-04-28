import type { AppRouteHandler } from "@/lib/types";
import type { ClerkWebhookRoute } from "./clerk.routes";
import drizzleDb from "@/db";
import { users } from "@/db/schema";
import { Webhook } from "svix";
import { z } from "zod";
import * as HttpStatusCode from "@/constants/http-status-codes";
import env from "@/env";
import { eq } from "drizzle-orm";

const userIdSchema = z.object({
  id: z.string(),
});

type WebhookEvent = {
  data: Record<string, any>;
  type: string;
} & Record<string, any>;

export const clerkWebhook: AppRouteHandler<ClerkWebhookRoute> = async (c) => {
  const svixId = c.req.header("svix-id");
  const svixTimestamp = c.req.header("svix-timestamp");
  const svixSignature = c.req.header("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.text("Missing Svix headers", HttpStatusCode.BAD_REQUEST);
  }

  const secret = env.CLERK_WEBHOOK_SIGNING_SECRET!;
  let rawBody: string;
  try {
    rawBody = await c.req.raw.text();
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (error) {
    try {
      // If that fails, try to parse as JSON
      const jsonBody = await c.req.json();
      rawBody = JSON.stringify(jsonBody);
    }
    // eslint-disable-next-line unused-imports/no-unused-vars
    catch (jsonError) {
      return c.text("Unable to read request body", HttpStatusCode.BAD_REQUEST);
    }
  }

  const webhook = new Webhook(secret);
  let evt: WebhookEvent;

  try {
    evt = webhook.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (err) {
    return c.text("Signature verification failed", HttpStatusCode.BAD_REQUEST);
  }

  if (evt.type === "user.created") {
    const parsed = userIdSchema.safeParse(evt.data);
    if (!parsed.success)
      return c.text("Invalid data", HttpStatusCode.BAD_REQUEST);

    const { id: clerkId } = parsed.data;

    await drizzleDb.insert(users).values({
      clerk_id: clerkId,
    });

    return c.text("User created", HttpStatusCode.OK);
  }

  if (evt.type === "user.deleted") {
    const parsed = userIdSchema.safeParse(evt.data);
    if (!parsed.success)
      return c.text("Invalid data", HttpStatusCode.BAD_REQUEST);

    const { id: clerkId } = parsed.data;

    await drizzleDb.delete(users)
      .where(eq(users.clerk_id, clerkId));

    return c.text("User deleted", HttpStatusCode.OK);
  }

  return c.text("Ignored", HttpStatusCode.OK);
};
