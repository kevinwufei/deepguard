import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const detectionTypeEnum = pgEnum("detection_type", [
  "audio", "video", "camera", "microphone", "text", "screen", "image",
]);
export const verdictEnum = pgEnum("verdict", ["safe", "suspicious", "deepfake"]);
export const userFeedbackEnum = pgEnum("user_feedback", ["correct", "incorrect", "unsure"]);
export const feedbackLabelEnum = pgEnum("feedback_label", [
  "ai_generated", "real", "deepfake_video", "ai_audio", "human_audio", "ai_text", "human_text",
]);
export const apiTierEnum = pgEnum("api_tier", ["free", "pro", "enterprise"]);

// ─── Tables ───────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const detectionRecords = pgTable("detection_records", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id, { onDelete: "set null" }),
  type: detectionTypeEnum("type").notNull(),
  fileName: varchar("fileName", { length: 255 }),
  fileUrl: varchar("fileUrl", { length: 1024 }),
  riskScore: integer("riskScore").notNull().default(0),
  verdict: verdictEnum("verdict").notNull().default("safe"),
  analysisReport: text("analysisReport"),
  duration: integer("duration"),
  fileSize: integer("fileSize"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  userFeedback: userFeedbackEnum("userFeedback"),
  feedbackLabel: feedbackLabelEnum("feedbackLabel"),
  feedbackNote: text("feedbackNote"),
  feedbackAt: timestamp("feedbackAt"),
});
export type DetectionRecord = typeof detectionRecords.$inferSelect;
export type InsertDetectionRecord = typeof detectionRecords.$inferInsert;

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  keyHash: varchar("keyHash", { length: 128 }).notNull().unique(),
  keyPrefix: varchar("keyPrefix", { length: 16 }).notNull(),
  tier: apiTierEnum("tier").notNull().default("free"),
  usageCount: integer("usageCount").notNull().default(0),
  dailyLimit: integer("dailyLimit").notNull().default(100),
  isActive: integer("isActive").notNull().default(1),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

export const apiUsageLogs = pgTable("api_usage_logs", {
  id: serial("id").primaryKey(),
  apiKeyId: integer("apiKeyId").notNull().references(() => apiKeys.id, { onDelete: "cascade" }),
  endpoint: varchar("endpoint", { length: 100 }).notNull(),
  statusCode: integer("statusCode").notNull().default(200),
  responseTimeMs: integer("responseTimeMs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ApiUsageLog = typeof apiUsageLogs.$inferSelect;

export const sharedReports = pgTable("shared_reports", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 32 }).notNull().unique(),
  userId: integer("userId").references(() => users.id, { onDelete: "set null" }),
  detectionRecordId: integer("detectionRecordId").references(() => detectionRecords.id, { onDelete: "set null" }),
  type: detectionTypeEnum("type").notNull(),
  fileName: varchar("fileName", { length: 255 }),
  fileUrl: varchar("fileUrl", { length: 1024 }),
  riskScore: integer("riskScore").notNull().default(0),
  verdict: verdictEnum("verdict").notNull().default("safe"),
  analysisReport: text("analysisReport"),
  viewCount: integer("viewCount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});
export type SharedReport = typeof sharedReports.$inferSelect;
export type InsertSharedReport = typeof sharedReports.$inferInsert;

export const usageQuotas = pgTable("usage_quotas", {
  id: serial("id").primaryKey(),
  fingerprint: varchar("fingerprint", { length: 128 }),
  userId: integer("userId").references(() => users.id, { onDelete: "cascade" }),
  date: varchar("date", { length: 10 }).notNull(),
  count: integer("count").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type UsageQuota = typeof usageQuotas.$inferSelect;
export type InsertUsageQuota = typeof usageQuotas.$inferInsert;
