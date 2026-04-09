import { desc, eq, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser, users, detectionRecords, InsertDetectionRecord,
  apiKeys, apiUsageLogs, InsertApiKey, sharedReports, InsertSharedReport, usageQuotas,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { createHash } from 'crypto';

let _db: ReturnType<typeof drizzle> | null = null;

function resolveDbUrl(): string | null {
  let url = process.env.DATABASE_URL ?? "";
  // If DO template string is unresolved, scan for any postgres URL in env
  if (!url || url.startsWith("${")) {
    const found = Object.entries(process.env).find(
      ([k, v]) => k !== "DATABASE_URL" && v &&
        (v.startsWith("postgres://") || v.startsWith("postgresql://"))
    );
    if (found) url = found[1]!;
  }
  return url && !url.startsWith("${") ? url : null;
}

export async function getDb() {
  if (!_db) {
    const url = resolveDbUrl();
    if (url) {
      try {
        const client = postgres(url, { ssl: "require", max: 10 });
        _db = drizzle(client);
      } catch (error) {
        console.warn("[Database] Failed to connect:", error);
        _db = null;
      }
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet as any,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Detection records
export async function createDetectionRecord(record: InsertDetectionRecord): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.insert(detectionRecords).values(record).returning({ id: detectionRecords.id });
    return result[0]?.id ?? null;
  } catch (err) {
    console.error('[DB] createDetectionRecord failed:', err);
    return null;
  }
}

export async function getDetectionRecordsByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(detectionRecords)
    .where(eq(detectionRecords.userId, userId))
    .orderBy(desc(detectionRecords.createdAt))
    .limit(limit);
}

export async function getRecentDetections(limit = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(detectionRecords)
    .orderBy(desc(detectionRecords.createdAt))
    .limit(limit);
}

// API Key helpers
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export async function createApiKey(userId: number, name: string, tier: 'free' | 'pro' | 'enterprise' = 'free') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { nanoid } = await import('nanoid');
  const rawKey = `dg_${tier === 'free' ? 'free' : tier === 'pro' ? 'pro' : 'ent'}_${nanoid(32)}`;
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.slice(0, 12);
  const dailyLimit = tier === 'free' ? 100 : tier === 'pro' ? 10000 : 1000000;
  await db.insert(apiKeys).values({ userId, name, keyHash, keyPrefix, tier, dailyLimit });
  return { rawKey, keyPrefix };
}

export async function getApiKeysByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(desc(apiKeys.createdAt));
}

export async function revokeApiKey(keyId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(apiKeys)
    .set({ isActive: 0 })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)));
}

export async function validateApiKey(rawKey: string) {
  const db = await getDb();
  if (!db) return null;
  const keyHash = hashApiKey(rawKey);
  const result = await db.select().from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.isActive, 1)))
    .limit(1);
  return result[0] || null;
}

export async function incrementApiKeyUsage(keyId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(apiKeys)
    .set({ usageCount: sql`${apiKeys.usageCount} + 1`, lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyId));
}

export async function logApiUsage(apiKeyId: number, endpoint: string, statusCode: number, responseTimeMs?: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(apiUsageLogs).values({ apiKeyId, endpoint, statusCode, responseTimeMs });
}

export async function getApiUsageStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
  const totalCalls = keys.reduce((sum, k) => sum + k.usageCount, 0);
  return { keys, totalCalls };
}

// User feedback helpers for training data collection
export async function submitDetectionFeedback(
  recordId: number,
  feedback: 'correct' | 'incorrect' | 'unsure',
  label: 'ai_generated' | 'real' | 'deepfake_video' | 'ai_audio' | 'human_audio' | 'ai_text' | 'human_text' | null,
  note?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(detectionRecords)
    .set({ userFeedback: feedback, feedbackLabel: label ?? undefined, feedbackNote: note ?? null, feedbackAt: new Date() })
    .where(eq(detectionRecords.id, recordId));
}

export async function getTrainingData(limit = 5000) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(detectionRecords)
    .where(sql`${detectionRecords.userFeedback} IS NOT NULL`)
    .orderBy(desc(detectionRecords.createdAt))
    .limit(limit);
}

export async function getMislabeledRecords(limit = 200) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(detectionRecords)
    .where(eq(detectionRecords.userFeedback, 'incorrect'))
    .orderBy(desc(detectionRecords.feedbackAt))
    .limit(limit);
}

export async function getFeedbackStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const total = await db.select({ count: sql<number>`count(*)` }).from(detectionRecords);
  const withFeedback = await db.select({ count: sql<number>`count(*)` }).from(detectionRecords)
    .where(sql`${detectionRecords.userFeedback} IS NOT NULL`);
  const aiLabeled = await db.select({ count: sql<number>`count(*)` }).from(detectionRecords)
    .where(eq(detectionRecords.feedbackLabel, 'ai_generated'));
  const realLabeled = await db.select({ count: sql<number>`count(*)` }).from(detectionRecords)
    .where(eq(detectionRecords.feedbackLabel, 'real'));
  return {
    totalDetections: total[0]?.count ?? 0,
    labeledSamples: withFeedback[0]?.count ?? 0,
    aiSamples: aiLabeled[0]?.count ?? 0,
    realSamples: realLabeled[0]?.count ?? 0,
  };
}

// Shared report helpers
export async function createSharedReport(report: InsertSharedReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(sharedReports).values(report);
}

export async function getSharedReportByToken(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(sharedReports)
    .where(eq(sharedReports.token, token))
    .limit(1);
  return result[0] || null;
}

export async function incrementReportViewCount(token: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(sharedReports)
    .set({ viewCount: sql`${sharedReports.viewCount} + 1` })
    .where(eq(sharedReports.token, token));
}

// ─── Usage Quota Helpers ───────────────────────────────────────────────────
export const QUOTA_LIMITS = {
  anonymous: 3,
  free: 10,
  paid: Infinity,
  admin: Infinity,
} as const;

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getUsageCount(params: { userId?: number; fingerprint?: string }): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const today = getTodayDate();
  let result;
  if (params.userId) {
    result = await db.select({ count: usageQuotas.count })
      .from(usageQuotas)
      .where(and(eq(usageQuotas.userId, params.userId), eq(usageQuotas.date, today)))
      .limit(1);
  } else if (params.fingerprint) {
    result = await db.select({ count: usageQuotas.count })
      .from(usageQuotas)
      .where(and(eq(usageQuotas.fingerprint, params.fingerprint), eq(usageQuotas.date, today)))
      .limit(1);
  } else {
    return 0;
  }
  return result[0]?.count ?? 0;
}

export async function incrementUsage(params: { userId?: number; fingerprint?: string }): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const today = getTodayDate();
  if (params.userId) {
    await db.insert(usageQuotas)
      .values({ userId: params.userId, date: today, count: 1 })
      .onConflictDoUpdate({
        target: [usageQuotas.userId, usageQuotas.date],
        set: { count: sql`${usageQuotas.count} + 1`, updatedAt: new Date() },
      });
    const result = await db.select({ count: usageQuotas.count })
      .from(usageQuotas)
      .where(and(eq(usageQuotas.userId, params.userId), eq(usageQuotas.date, today)))
      .limit(1);
    return result[0]?.count ?? 1;
  } else if (params.fingerprint) {
    await db.insert(usageQuotas)
      .values({ fingerprint: params.fingerprint, date: today, count: 1 })
      .onConflictDoUpdate({
        target: [usageQuotas.fingerprint, usageQuotas.date],
        set: { count: sql`${usageQuotas.count} + 1`, updatedAt: new Date() },
      });
    const result = await db.select({ count: usageQuotas.count })
      .from(usageQuotas)
      .where(and(eq(usageQuotas.fingerprint, params.fingerprint), eq(usageQuotas.date, today)))
      .limit(1);
    return result[0]?.count ?? 1;
  }
  return 0;
}
