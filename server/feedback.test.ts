import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    submitDetectionFeedback: vi.fn().mockResolvedValue(undefined),
    getMislabeledRecords: vi.fn().mockResolvedValue([
      {
        id: 42,
        type: "image",
        fileUrl: "https://cdn.example.com/img.jpg",
        fileName: "test.jpg",
        riskScore: 30,
        verdict: "safe",
        feedbackLabel: "ai_generated",
        feedbackNote: "Midjourney v6",
        feedbackAt: new Date("2026-03-17T10:00:00Z"),
        createdAt: new Date("2026-03-17T09:00:00Z"),
      },
    ]),
    getFeedbackStats: vi.fn().mockResolvedValue({
      totalDetections: 100,
      labeledSamples: 25,
      aiSamples: 15,
      realSamples: 10,
    }),
    getTrainingData: vi.fn().mockResolvedValue([]),
    getUsageCount: vi.fn().mockResolvedValue(0),
    incrementUsage: vi.fn().mockResolvedValue(1),
    QUOTA_LIMITS: actual.QUOTA_LIMITS,
  };
});

// ─── Context helpers ──────────────────────────────────────────────────────────
function createCtx(role: "user" | "admin" | null = null): TrpcContext {
  const user = role
    ? {
        id: role === "admin" ? 99 : 1,
        openId: `${role}-openid`,
        email: `${role}@test.com`,
        name: role === "admin" ? "Admin User" : "Regular User",
        loginMethod: "manus",
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }
    : null;

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── feedback.submit ──────────────────────────────────────────────────────────
describe("feedback.submit", () => {
  it("accepts 'correct' feedback without a label", async () => {
    const caller = appRouter.createCaller(createCtx(null));
    const result = await caller.feedback.submit({
      recordId: 1,
      feedback: "correct",
      label: null,
    });
    expect(result).toEqual({ success: true });
  });

  it("accepts 'incorrect' feedback with a label and note", async () => {
    const caller = appRouter.createCaller(createCtx("user"));
    const result = await caller.feedback.submit({
      recordId: 7,
      feedback: "incorrect",
      label: "ai_generated",
      note: "Looks like Stable Diffusion XL",
    });
    expect(result).toEqual({ success: true });
  });

  it("accepts text-specific labels ai_text and human_text", async () => {
    const caller = appRouter.createCaller(createCtx(null));

    const r1 = await caller.feedback.submit({ recordId: 10, feedback: "incorrect", label: "ai_text" });
    expect(r1).toEqual({ success: true });

    const r2 = await caller.feedback.submit({ recordId: 11, feedback: "incorrect", label: "human_text" });
    expect(r2).toEqual({ success: true });
  });

  it("rejects notes longer than 500 characters", async () => {
    const caller = appRouter.createCaller(createCtx(null));
    await expect(
      caller.feedback.submit({
        recordId: 1,
        feedback: "unsure",
        label: null,
        note: "x".repeat(501),
      })
    ).rejects.toThrow();
  });
});

// ─── trainingData.stats (admin only) ─────────────────────────────────────────
describe("trainingData.stats", () => {
  it("returns stats for admin users", async () => {
    const caller = appRouter.createCaller(createCtx("admin"));
    const stats = await caller.trainingData.stats();
    expect(stats.totalDetections).toBe(100);
    expect(stats.labeledSamples).toBe(25);
  });

  it("throws for non-admin users", async () => {
    const caller = appRouter.createCaller(createCtx("user"));
    await expect(caller.trainingData.stats()).rejects.toThrow();
  });

  it("throws for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createCtx(null));
    await expect(caller.trainingData.stats()).rejects.toThrow();
  });
});

// ─── trainingData.mislabeled (admin only) ────────────────────────────────────
describe("trainingData.mislabeled", () => {
  it("returns mislabeled records for admin", async () => {
    const caller = appRouter.createCaller(createCtx("admin"));
    const records = await caller.trainingData.mislabeled({});
    expect(records).toHaveLength(1);
    expect(records[0]?.id).toBe(42);
    expect(records[0]?.feedbackLabel).toBe("ai_generated");
    expect(records[0]?.verdict).toBe("safe"); // system said safe, user said ai_generated
  });

  it("throws for regular users", async () => {
    const caller = appRouter.createCaller(createCtx("user"));
    await expect(caller.trainingData.mislabeled({})).rejects.toThrow();
  });
});

// ─── trainingData.export (admin only) ────────────────────────────────────────
describe("trainingData.export", () => {
  it("returns empty array when no labeled data", async () => {
    const caller = appRouter.createCaller(createCtx("admin"));
    const data = await caller.trainingData.export({});
    expect(Array.isArray(data)).toBe(true);
  });

  it("throws for non-admin", async () => {
    const caller = appRouter.createCaller(createCtx("user"));
    await expect(caller.trainingData.export({})).rejects.toThrow();
  });
});
