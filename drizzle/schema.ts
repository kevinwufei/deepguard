import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here

export const detectionRecords = mysqlTable('detection_records', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').references(() => users.id, { onDelete: 'set null' }),
  type: mysqlEnum('type', ['audio', 'video', 'camera', 'microphone', 'text', 'screen', 'image']).notNull(),
  fileName: varchar('fileName', { length: 255 }),
  fileUrl: varchar('fileUrl', { length: 1024 }),
  riskScore: int('riskScore').notNull().default(0),
  verdict: mysqlEnum('verdict', ['safe', 'suspicious', 'deepfake']).notNull().default('safe'),
  analysisReport: text('analysisReport'),
  duration: int('duration'),
  fileSize: int('fileSize'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  // User feedback for model training data collection
  userFeedback: mysqlEnum('userFeedback', ['correct', 'incorrect', 'unsure']),
  feedbackLabel: mysqlEnum('feedbackLabel', ['ai_generated', 'real', 'deepfake_video', 'ai_audio', 'human_audio']),
  feedbackNote: text('feedbackNote'),
  feedbackAt: timestamp('feedbackAt'),
});

export type DetectionRecord = typeof detectionRecords.$inferSelect;
export type InsertDetectionRecord = typeof detectionRecords.$inferInsert;

export const apiKeys = mysqlTable('api_keys', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  keyHash: varchar('keyHash', { length: 128 }).notNull().unique(),
  keyPrefix: varchar('keyPrefix', { length: 16 }).notNull(),
  tier: mysqlEnum('tier', ['free', 'pro', 'enterprise']).notNull().default('free'),
  usageCount: int('usageCount').notNull().default(0),
  dailyLimit: int('dailyLimit').notNull().default(100),
  isActive: int('isActive').notNull().default(1),
  lastUsedAt: timestamp('lastUsedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

export const apiUsageLogs = mysqlTable('api_usage_logs', {
  id: int('id').autoincrement().primaryKey(),
  apiKeyId: int('apiKeyId').notNull().references(() => apiKeys.id, { onDelete: 'cascade' }),
  endpoint: varchar('endpoint', { length: 100 }).notNull(),
  statusCode: int('statusCode').notNull().default(200),
  responseTimeMs: int('responseTimeMs'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export type ApiUsageLog = typeof apiUsageLogs.$inferSelect;