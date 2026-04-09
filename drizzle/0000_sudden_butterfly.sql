CREATE TYPE "public"."api_tier" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."detection_type" AS ENUM('audio', 'video', 'camera', 'microphone', 'text', 'screen', 'image');--> statement-breakpoint
CREATE TYPE "public"."feedback_label" AS ENUM('ai_generated', 'real', 'deepfake_video', 'ai_audio', 'human_audio', 'ai_text', 'human_text');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_feedback" AS ENUM('correct', 'incorrect', 'unsure');--> statement-breakpoint
CREATE TYPE "public"."verdict" AS ENUM('safe', 'suspicious', 'deepfake');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"keyHash" varchar(128) NOT NULL,
	"keyPrefix" varchar(16) NOT NULL,
	"tier" "api_tier" DEFAULT 'free' NOT NULL,
	"usageCount" integer DEFAULT 0 NOT NULL,
	"dailyLimit" integer DEFAULT 100 NOT NULL,
	"isActive" integer DEFAULT 1 NOT NULL,
	"lastUsedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_keyHash_unique" UNIQUE("keyHash")
);
--> statement-breakpoint
CREATE TABLE "api_usage_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"apiKeyId" integer NOT NULL,
	"endpoint" varchar(100) NOT NULL,
	"statusCode" integer DEFAULT 200 NOT NULL,
	"responseTimeMs" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "detection_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"type" "detection_type" NOT NULL,
	"fileName" varchar(255),
	"fileUrl" varchar(1024),
	"riskScore" integer DEFAULT 0 NOT NULL,
	"verdict" "verdict" DEFAULT 'safe' NOT NULL,
	"analysisReport" text,
	"duration" integer,
	"fileSize" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"userFeedback" "user_feedback",
	"feedbackLabel" "feedback_label",
	"feedbackNote" text,
	"feedbackAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "shared_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(32) NOT NULL,
	"userId" integer,
	"detectionRecordId" integer,
	"type" "detection_type" NOT NULL,
	"fileName" varchar(255),
	"fileUrl" varchar(1024),
	"riskScore" integer DEFAULT 0 NOT NULL,
	"verdict" "verdict" DEFAULT 'safe' NOT NULL,
	"analysisReport" text,
	"viewCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp,
	CONSTRAINT "shared_reports_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "usage_quotas" (
	"id" serial PRIMARY KEY NOT NULL,
	"fingerprint" varchar(128),
	"userId" integer,
	"date" varchar(10) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_apiKeyId_api_keys_id_fk" FOREIGN KEY ("apiKeyId") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detection_records" ADD CONSTRAINT "detection_records_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_reports" ADD CONSTRAINT "shared_reports_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_reports" ADD CONSTRAINT "shared_reports_detectionRecordId_detection_records_id_fk" FOREIGN KEY ("detectionRecordId") REFERENCES "public"."detection_records"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_quotas" ADD CONSTRAINT "usage_quotas_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;