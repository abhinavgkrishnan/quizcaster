CREATE TABLE "async_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"challenger_fid" bigint NOT NULL,
	"challenged_fid" bigint,
	"topic" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"challenge_message" text,
	"share_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "leaderboards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fid" bigint NOT NULL,
	"rank" integer NOT NULL,
	"leaderboard_type" text NOT NULL,
	"period_start" timestamp,
	"period_end" timestamp,
	"total_points" integer NOT NULL,
	"total_wins" integer NOT NULL,
	"matches_played" integer NOT NULL,
	"win_rate" numeric(5, 2),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leaderboards_fid_leaderboard_type_period_start_unique" UNIQUE("fid","leaderboard_type","period_start")
);
--> statement-breakpoint
CREATE TABLE "match_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"fid" bigint NOT NULL,
	"question_id" uuid NOT NULL,
	"question_number" integer NOT NULL,
	"answer_given" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"time_taken_ms" integer NOT NULL,
	"points_earned" integer NOT NULL,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "match_answers_match_id_fid_question_number_unique" UNIQUE("match_id","fid","question_number")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_type" text NOT NULL,
	"topic" text NOT NULL,
	"player1_fid" bigint NOT NULL,
	"player2_fid" bigint,
	"is_bot_opponent" boolean DEFAULT false NOT NULL,
	"player1_score" integer DEFAULT 0 NOT NULL,
	"player2_score" integer DEFAULT 0 NOT NULL,
	"winner_fid" bigint,
	"status" text NOT NULL,
	"questions_used" jsonb NOT NULL,
	"player1_completed_at" timestamp with time zone,
	"player2_completed_at" timestamp with time zone,
	"challenge_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "matchmaking_queue" (
	"fid" bigint PRIMARY KEY NOT NULL,
	"topic" text NOT NULL,
	"skill_level" integer DEFAULT 1000 NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic" text NOT NULL,
	"question" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_answer" text NOT NULL,
	"image_url" text,
	"difficulty" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"slug" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"icon_name" text,
	"color_class" text,
	"description" text,
	"question_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_stats_by_topic" (
	"fid" bigint NOT NULL,
	"topic" text NOT NULL,
	"matches_played" integer DEFAULT 0 NOT NULL,
	"matches_won" integer DEFAULT 0 NOT NULL,
	"matches_lost" integer DEFAULT 0 NOT NULL,
	"matches_drawn" integer DEFAULT 0 NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"questions_answered" integer DEFAULT 0 NOT NULL,
	"questions_correct" integer DEFAULT 0 NOT NULL,
	"avg_response_time_ms" integer,
	"best_streak" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_stats_overall" (
	"fid" bigint PRIMARY KEY NOT NULL,
	"total_matches" integer DEFAULT 0 NOT NULL,
	"total_wins" integer DEFAULT 0 NOT NULL,
	"total_losses" integer DEFAULT 0 NOT NULL,
	"total_draws" integer DEFAULT 0 NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"total_questions" integer DEFAULT 0 NOT NULL,
	"total_correct" integer DEFAULT 0 NOT NULL,
	"avg_response_time_ms" integer,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"global_rank" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"fid" bigint PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"pfp_url" text,
	"notification_token" text,
	"notification_url" text,
	"notifications_enabled" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "async_challenges" ADD CONSTRAINT "async_challenges_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "async_challenges" ADD CONSTRAINT "async_challenges_challenger_fid_users_fid_fk" FOREIGN KEY ("challenger_fid") REFERENCES "public"."users"("fid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "async_challenges" ADD CONSTRAINT "async_challenges_challenged_fid_users_fid_fk" FOREIGN KEY ("challenged_fid") REFERENCES "public"."users"("fid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboards" ADD CONSTRAINT "leaderboards_fid_users_fid_fk" FOREIGN KEY ("fid") REFERENCES "public"."users"("fid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_answers" ADD CONSTRAINT "match_answers_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_answers" ADD CONSTRAINT "match_answers_fid_users_fid_fk" FOREIGN KEY ("fid") REFERENCES "public"."users"("fid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_answers" ADD CONSTRAINT "match_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_player1_fid_users_fid_fk" FOREIGN KEY ("player1_fid") REFERENCES "public"."users"("fid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_player2_fid_users_fid_fk" FOREIGN KEY ("player2_fid") REFERENCES "public"."users"("fid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchmaking_queue" ADD CONSTRAINT "matchmaking_queue_fid_users_fid_fk" FOREIGN KEY ("fid") REFERENCES "public"."users"("fid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats_by_topic" ADD CONSTRAINT "user_stats_by_topic_fid_users_fid_fk" FOREIGN KEY ("fid") REFERENCES "public"."users"("fid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats_overall" ADD CONSTRAINT "user_stats_overall_fid_users_fid_fk" FOREIGN KEY ("fid") REFERENCES "public"."users"("fid") ON DELETE cascade ON UPDATE no action;