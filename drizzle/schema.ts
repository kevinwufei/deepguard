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
  type: mysqlEnum('type', ['audio', 'video', 'camera', 'microphone']).notNull(),
  fileName: varchar('fileName', { length: 255 }),
  fileUrl: varchar('fileUrl', { length: 1024 }),
  riskScore: int('riskScore').notNull().default(0),
  verdict: mysqlEnum('verdict', ['safe', 'suspicious', 'deepfake']).notNull().default('safe'),
  analysisReport: text('analysisReport'),
  duration: int('duration'),
  fileSize: int('fileSize'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export type DetectionRecord = typeof detectionRecords.$inferSelect;
export type InsertDetectionRecord = typeof detectionRecords.$inferInsert;