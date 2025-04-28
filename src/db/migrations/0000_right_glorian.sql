CREATE TABLE "ai_chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"preview" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"starred" boolean DEFAULT false,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ai_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"type" varchar(10) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"note_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"starred" boolean DEFAULT false,
	"mood_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"username" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "ai_chats" ADD CONSTRAINT "ai_chats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_chat_id_ai_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."ai_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moods" ADD CONSTRAINT "moods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_mood_id_moods_id_fk" FOREIGN KEY ("mood_id") REFERENCES "public"."moods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_chats_user_id" ON "ai_chats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ai_chats_starred" ON "ai_chats" USING btree ("starred");--> statement-breakpoint
CREATE INDEX "idx_ai_messages_chat_id" ON "ai_messages" USING btree ("chat_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_moods_user_name" ON "moods" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "idx_moods_user_id" ON "moods" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_note_tags_unique" ON "note_tags" USING btree ("note_id","tag_id");--> statement-breakpoint
CREATE INDEX "idx_note_tags_note_id" ON "note_tags" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "idx_note_tags_tag_id" ON "note_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_notes_user_id" ON "notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notes_starred" ON "notes" USING btree ("starred");--> statement-breakpoint
CREATE INDEX "idx_notes_mood_id" ON "notes" USING btree ("mood_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tags_user_name" ON "tags" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "idx_tags_user_id" ON "tags" USING btree ("user_id");