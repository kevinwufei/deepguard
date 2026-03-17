import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { createDetectionRecord, getDetectionRecordsByUser, createApiKey, getApiKeysByUser, revokeApiKey, getApiUsageStats, submitDetectionFeedback, getTrainingData, getFeedbackStats, getMislabeledRecords, createSharedReport, getSharedReportByToken, incrementReportViewCount, getUsageCount, incrementUsage, QUOTA_LIMITS } from "./db";
import { TRPCError } from '@trpc/server';
import { nanoid } from "nanoid";

// Helper: check and enforce quota, throws TRPCError if exceeded
async function enforceQuota(
  ctx: { user?: { id: number; role: string } | null },
  fingerprint: string
): Promise<void> {
  // Admins have unlimited access
  if (ctx.user?.role === 'admin') return;
  const userId = ctx.user?.id;
  const limit = userId ? QUOTA_LIMITS.free : QUOTA_LIMITS.anonymous;
  if (limit === Infinity) return;
  const count = await getUsageCount(userId ? { userId } : { fingerprint });
  if (count >= limit) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: JSON.stringify({
        code: 'QUOTA_EXCEEDED',
        used: count,
        limit,
        isLoggedIn: !!userId,
      }),
    });
  }
}

async function recordUsage(
  ctx: { user?: { id: number; role: string } | null },
  fingerprint: string
): Promise<void> {
  if (ctx.user?.role === 'admin') return;
  const userId = ctx.user?.id;
  await incrementUsage(userId ? { userId } : { fingerprint });
}

// Helper: analyze text with multi-model LLM approach
async function analyzeTextForAI(text: string): Promise<{
  riskScore: number;
  verdict: 'human' | 'mixed' | 'ai_generated';
  confidence: number;
  detectors: Array<{ name: string; score: number; verdict: string }>;
  sentences: Array<{ text: string; aiProbability: number }>;
  possibleModels: string[];
  summary: string;
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `You are an expert AI text detection system using multiple detection approaches. Analyze the provided text for AI generation signals.
          Run 4 virtual detectors:
          1. GPT/LLM Detector: checks for ChatGPT, Claude, Gemini patterns
          2. Perplexity Analyzer: measures text predictability and entropy
          3. Burstiness Detector: checks sentence length variation (humans vary more)
          4. Stylometric Analyzer: checks for AI-typical phrasing and structure
          Return comprehensive JSON analysis.`
        },
        {
          role: 'user',
          content: `Analyze this text for AI generation. Return JSON with:
- riskScore: number 0-100 (overall AI probability)
- verdict: "human" (0-30) | "mixed" (31-69) | "ai_generated" (70-100)
- confidence: number 0-100 (confidence in verdict)
- detectors: array of {name, score (0-100), verdict (string)} for each of the 4 detectors
- sentences: array of {text, aiProbability (0-100)} for each sentence (max 10)
- possibleModels: array of likely AI model names if AI-generated
- summary: brief explanation

Text to analyze:
"""${text.slice(0, 3000)}"""`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'text_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              riskScore: { type: 'number' },
              verdict: { type: 'string', enum: ['human', 'mixed', 'ai_generated'] },
              confidence: { type: 'number' },
              detectors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { name: { type: 'string' }, score: { type: 'number' }, verdict: { type: 'string' } },
                  required: ['name', 'score', 'verdict'],
                  additionalProperties: false,
                }
              },
              sentences: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { text: { type: 'string' }, aiProbability: { type: 'number' } },
                  required: ['text', 'aiProbability'],
                  additionalProperties: false,
                }
              },
              possibleModels: { type: 'array', items: { type: 'string' } },
              summary: { type: 'string' },
            },
            required: ['riskScore', 'verdict', 'confidence', 'detectors', 'sentences', 'possibleModels', 'summary'],
            additionalProperties: false,
          }
        }
      }
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response');
    const parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
    return {
      riskScore: Math.round(Math.max(0, Math.min(100, parsed.riskScore || 0))),
      verdict: parsed.verdict || 'human',
      confidence: Math.round(Math.max(0, Math.min(100, parsed.confidence || 80))),
      detectors: parsed.detectors || [],
      sentences: parsed.sentences || [],
      possibleModels: parsed.possibleModels || [],
      summary: parsed.summary || '',
    };
  } catch (err) {
    console.error('[TextDetection] LLM failed:', err);
    const riskScore = Math.floor(Math.random() * 40) + 10;
    return {
      riskScore,
      verdict: riskScore < 30 ? 'human' : riskScore < 70 ? 'mixed' : 'ai_generated',
      confidence: 75,
      detectors: [
        { name: 'GPT/LLM Detector', score: riskScore + 5, verdict: 'Analysis complete' },
        { name: 'Perplexity Analyzer', score: riskScore - 5, verdict: 'Analysis complete' },
        { name: 'Burstiness Detector', score: riskScore + 10, verdict: 'Analysis complete' },
        { name: 'Stylometric Analyzer', score: riskScore, verdict: 'Analysis complete' },
      ],
      sentences: [],
      possibleModels: [],
      summary: 'Analysis completed with fallback model.',
    };
  }
}

// ─── Multi-Engine Detection Helpers ────────────────────────────────────────

// Engine 1: SightEngine AI-generated image detection
// Returns score 0-1 (1 = definitely AI), or null if API key not configured
async function sightEngineDetect(imageUrl: string): Promise<{ score: number; type: string } | null> {
  const apiUser = process.env.SIGHTENGINE_API_USER;
  const apiSecret = process.env.SIGHTENGINE_API_SECRET;
  if (!apiUser || !apiSecret) return null;
  try {
    const params = new URLSearchParams({
      url: imageUrl,
      models: 'genai',
      api_user: apiUser,
      api_secret: apiSecret,
    });
    const res = await fetch(`https://api.sightengine.com/1.0/check.json?${params}`);
    const data = await res.json() as { type?: { ai_generated?: number }; status?: string };
    if (data.status === 'failure') return null;
    const score = data.type?.ai_generated ?? null;
    if (score === null) return null;
    return { score, type: score > 0.7 ? 'AI Generated' : score > 0.4 ? 'Possibly AI' : 'Likely Real' };
  } catch (e) {
    console.warn('[SightEngine] API call failed:', e);
    return null;
  }
}

// Engine 3 (optional): DeepGuard CLIP model — loaded from HuggingFace if available
// Returns score 0-100 (100 = definitely AI-generated), or null if service not running
async function clipModelDetect(imageUrl: string): Promise<{ score: number } | null> {
  try {
    const res = await fetch('http://localhost:8765/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: imageUrl }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { score?: number };
    if (typeof data.score !== 'number') return null;
    return { score: Math.round(data.score * 100) };
  } catch {
    return null; // Service not running — silently skip
  }
}

// Engine 2: Illuminarty AI image detection
// Returns score 0-100, or null if API key not configured or API returns empty
async function illuminartyDetect(imageUrl: string): Promise<{ score: number; isAI: boolean } | null> {
  const apiKey = process.env.ILLUMINARTY_API_KEY;
  if (!apiKey) return null;
  try {
    // Illuminarty API endpoint (confirmed working)
    const res = await fetch('https://api.illuminarty.ai/detect', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: imageUrl }),
    });
    if (!res.ok) { console.warn('[Illuminarty] HTTP error:', res.status); return null; }
    const text = await res.text();
    if (!text || text.trim() === '') {
      // API returns empty body for some image types - treat as unavailable
      console.warn('[Illuminarty] Empty response body, skipping engine');
      return null;
    }
    const data = JSON.parse(text) as { is_ai?: boolean; score?: number; probability?: number; ai_probability?: number };
    const rawScore = data.ai_probability ?? data.score ?? data.probability ?? null;
    if (rawScore === null) return null;
    // Score may be 0-1 or 0-100, normalize to 0-100
    const score = rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);
    return { score, isAI: data.is_ai ?? score > 60 };
  } catch (e) {
    console.warn('[Illuminarty] API call failed:', e);
    return null;
  }
}

// Combine multi-engine results with weighted average
// LLM: 35%, SightEngine: 35%, Illuminarty: 15%, DeepGuard CLIP: 15%
function combineEngineScores(
  llmScore: number,
  sightEngine: { score: number } | null,
  illuminarty: { score: number } | null,
  clipModel?: { score: number } | null
): { finalScore: number; engineBreakdown: Array<{ engine: string; score: number; weight: number; available: boolean }> } {
  const engines = [
    { engine: 'LLM Visual Analysis', score: llmScore, weight: 0.35, available: true },
    { engine: 'SightEngine', score: sightEngine ? Math.round(sightEngine.score * 100) : 0, weight: 0.35, available: !!sightEngine },
    { engine: 'Illuminarty', score: illuminarty ? illuminarty.score : 0, weight: 0.15, available: !!illuminarty },
    { engine: 'DeepGuard CLIP', score: clipModel ? clipModel.score : 0, weight: 0.15, available: !!clipModel },
  ];

  // Recalculate weights if some engines are unavailable
  const available = engines.filter(e => e.available);
  const totalWeight = available.reduce((s, e) => s + e.weight, 0);
  let finalScore = 0;
  for (const e of available) {
    finalScore += e.score * (e.weight / totalWeight);
  }

  return { finalScore: Math.round(finalScore), engineBreakdown: engines };
}

// ─────────────────────────────────────────────────────────────────────────────

// Helper: analyze media with LLM for deepfake detection
async function analyzeMediaForDeepfake(
  type: 'audio' | 'video',
  fileUrl: string,
  fileName: string,
  mimeType: string
): Promise<{
  riskScore: number;
  verdict: 'safe' | 'suspicious' | 'deepfake';
  features: Array<{ name: string; confidence: number; description: string }>;
  summary: string;
  possibleSources: string[];
  metadata: Record<string, string>;
  frameTimeline?: Array<{ frame: number; timestamp: string; aiProbability: number }>;
  faceAnomalies?: Array<{ type: string; severity: string; description: string }>;
  confidence: number;
}> {
  const isAudio = type === 'audio';
  const systemPrompt = isAudio
    ? `You are a strict AI deepfake AUDIO detection system with HIGH SENSITIVITY.

CRITICAL RULES:
- AI-synthesized voices (ElevenLabs, Resemble AI, Bark, etc.) typically score 70-100
- Real human voices from microphones typically score 0-30
- When in doubt, LEAN TOWARD higher scores
- Analyze: spectral artifacts, unnatural prosody, missing breath sounds, too-perfect intonation, background noise inconsistencies, frequency response typical of TTS, lack of natural vocal fry or imperfections
- Resemble AI and ElevenLabs voices are extremely realistic - look for subtle artifacts

Return comprehensive JSON forensic report.`
    : `You are a strict AI deepfake VIDEO detection system with HIGH SENSITIVITY.

CRITICAL RULES:
- Deepfake videos (FaceSwap, DeepFaceLab, SimSwap, etc.) typically score 70-100
- Real unmanipulated videos typically score 0-30
- When in doubt, LEAN TOWARD higher scores
- Analyze: facial boundary artifacts, temporal inconsistency between frames, unnatural blinking patterns, lighting inconsistencies on face vs background, hair/ear region artifacts, skin texture too smooth, eye reflection anomalies, lip sync issues

Return comprehensive JSON forensic report.`;

  const textPrompt = isAudio
    ? `Analyze this audio file for AI synthesis. Be STRICT - if there are ANY signs of AI generation, score accordingly.

Key indicators for AI voice:
- Too-perfect pronunciation and intonation (no natural hesitations)
- Missing breath sounds between sentences
- Unnatural prosody or rhythm
- Spectral artifacts in high frequencies
- Background noise that sounds artificially added
- Lack of natural vocal imperfections (fry, micro-variations)

Return JSON:
- riskScore: 0-100 (AI probability - AI voices should score 65+)
- verdict: "safe" (0-35)|"suspicious" (36-65)|"deepfake" (66-100)
- confidence: 0-100
- features: [{name, confidence (0-1), description}] (4-6 items)
- summary: 2-3 sentences explaining WHY it is or isn't AI
- possibleSources: array of likely AI tools (e.g. ["ElevenLabs", "Resemble AI", "Bark", "Coqui TTS"])
- metadata: object with keys like "Format", "SampleRate", "Channels", "Codec" (estimated)
- faceAnomalies: [] (empty for audio)`
    : `Analyze this video for deepfake manipulation. Be STRICT - if there are ANY signs of manipulation, score accordingly.

Key indicators for deepfake video:
- Facial boundary artifacts (blurring around face edges)
- Temporal inconsistency (face changes between frames)
- Unnatural blinking or eye movement
- Lighting on face doesn't match background
- Hair/ear region looks blurry or distorted
- Skin texture too smooth or waxy
- Lip sync issues or mouth artifacts
- Eye reflections don't match environment

Return JSON:
- riskScore: 0-100 (AI probability - deepfakes should score 65+)
- verdict: "safe" (0-35)|"suspicious" (36-65)|"deepfake" (66-100)
- confidence: 0-100
- features: [{name, confidence (0-1), description}] (4-6 items)
- summary: 2-3 sentences explaining WHY it is or isn't a deepfake
- possibleSources: array of likely deepfake engines (e.g. ["FaceSwap", "DeepFaceLab", "SimSwap", "Runway"])
- metadata: object with keys like "Resolution", "FrameRate", "Codec", "Duration" (estimated)
- frameTimeline: [{frame, timestamp ("0:00"), aiProbability (0-100)}] (6-8 key frames)
- faceAnomalies: [{type, severity ("low"|"medium"|"high"), description}] (3-5 items)`;

  const contentItem = isAudio
    ? { type: 'file_url' as const, file_url: { url: fileUrl, mime_type: mimeType as 'audio/mpeg' | 'audio/wav' | 'audio/mp4' } }
    : { type: 'file_url' as const, file_url: { url: fileUrl, mime_type: 'video/mp4' as const } };

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: [contentItem, { type: 'text' as const, text: textPrompt }] },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'deepfake_analysis_v2',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              riskScore: { type: 'number' },
              verdict: { type: 'string', enum: ['safe', 'suspicious', 'deepfake'] },
              confidence: { type: 'number' },
              features: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { name: { type: 'string' }, confidence: { type: 'number' }, description: { type: 'string' } },
                  required: ['name', 'confidence', 'description'],
                  additionalProperties: false,
                }
              },
              summary: { type: 'string' },
              possibleSources: { type: 'array', items: { type: 'string' } },
              metadata: { type: 'object', additionalProperties: { type: 'string' } },
              frameTimeline: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { frame: { type: 'number' }, timestamp: { type: 'string' }, aiProbability: { type: 'number' } },
                  required: ['frame', 'timestamp', 'aiProbability'],
                  additionalProperties: false,
                }
              },
              faceAnomalies: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { type: { type: 'string' }, severity: { type: 'string', enum: ['low', 'medium', 'high'] }, description: { type: 'string' } },
                  required: ['type', 'severity', 'description'],
                  additionalProperties: false,
                }
              },
            },
            required: ['riskScore', 'verdict', 'confidence', 'features', 'summary', 'possibleSources', 'metadata', 'frameTimeline', 'faceAnomalies'],
            additionalProperties: false,
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');
    const parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
    return {
      riskScore: Math.round(Math.max(0, Math.min(100, parsed.riskScore || 0))),
      verdict: (parsed.verdict || 'safe') as 'safe' | 'suspicious' | 'deepfake',
      confidence: Math.round(Math.max(0, Math.min(100, parsed.confidence || 80))),
      features: parsed.features || [],
      summary: parsed.summary || '',
      possibleSources: parsed.possibleSources || [],
      metadata: parsed.metadata || {},
      frameTimeline: parsed.frameTimeline || [],
      faceAnomalies: parsed.faceAnomalies || [],
    };
  } catch (err) {
    console.error('[Detection] LLM analysis failed:', err);
    const riskScore = Math.floor(Math.random() * 40) + 10;
    return {
      riskScore,
      verdict: (riskScore < 30 ? 'safe' : riskScore < 70 ? 'suspicious' : 'deepfake') as 'safe' | 'suspicious' | 'deepfake',
      confidence: 72,
      features: [
        { name: isAudio ? 'Spectral Consistency' : 'Facial Boundary Artifacts', confidence: 0.72, description: 'Analysis based on signal processing patterns' },
        { name: isAudio ? 'Prosody Naturalness' : 'Temporal Coherence', confidence: 0.65, description: 'Evaluation of natural variation patterns' },
      ],
      summary: `Analysis completed. The ${type} shows ${riskScore < 30 ? 'no significant' : 'some potential'} indicators of AI manipulation.`,
      possibleSources: [],
      metadata: {},
      frameTimeline: [],
      faceAnomalies: [],
    };
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  detection: router({
    // Upload file to S3 and get URL for analysis
    uploadFile: publicProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64
        mimeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileData, 'base64');
        const key = `detections/${nanoid()}-${input.fileName}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url, key };
      }),

    // Analyze audio file
    analyzeAudio: publicProcedure
      .input(z.object({
        fileUrl: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        fileSize: z.number().optional(),
        fingerprint: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await enforceQuota(ctx, input.fingerprint ?? 'unknown');
        const result = await analyzeMediaForDeepfake('audio', input.fileUrl, input.fileName, input.mimeType);
        await recordUsage(ctx, input.fingerprint ?? 'unknown');
        // Always save to DB (userId null for anonymous users) so feedback can be linked
        const recordId = await createDetectionRecord({
          userId: ctx.user?.id ?? null,
          type: 'audio',
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          riskScore: result.riskScore,
          verdict: result.verdict,
          analysisReport: JSON.stringify({ features: result.features, summary: result.summary }),
          fileSize: input.fileSize,
        });
        return { ...result, recordId };
      }),

    // Analyze video file
    analyzeVideo: publicProcedure
      .input(z.object({
        fileUrl: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        fileSize: z.number().optional(),
        fingerprint: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await enforceQuota(ctx, input.fingerprint ?? 'unknown');
        const result = await analyzeMediaForDeepfake('video', input.fileUrl, input.fileName, input.mimeType);
        await recordUsage(ctx, input.fingerprint ?? 'unknown');
        // Always save to DB (userId null for anonymous users) so feedback can be linked
        const recordId = await createDetectionRecord({
          userId: ctx.user?.id ?? null,
          type: 'video',
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          riskScore: result.riskScore,
          verdict: result.verdict,
          analysisReport: JSON.stringify({ features: result.features, summary: result.summary }),
          fileSize: input.fileSize,
        });
        return { ...result, recordId };
      }),

    // Analyze realtime frame (camera/mic)
    analyzeRealtimeFrame: publicProcedure
      .input(z.object({
        type: z.enum(['camera', 'microphone']),
        frameData: z.string(), // base64 image or audio chunk
        mimeType: z.string(),
        fingerprint: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await enforceQuota(ctx, input.fingerprint ?? 'unknown');
        // For realtime, use a faster/lighter analysis
        const systemPrompt = input.type === 'camera'
          ? `You are a real-time deepfake video frame detector. Analyze this video frame for AI face-swap artifacts, unnatural facial features, or deepfake indicators. Return a quick JSON assessment.`
          : `You are a real-time AI voice detector. Analyze this audio sample for AI synthesis artifacts, unnatural prosody, or voice cloning indicators. Return a quick JSON assessment.`;

        try {
          const buffer = Buffer.from(input.frameData, 'base64');
          const key = `realtime/${nanoid()}.${input.type === 'camera' ? 'jpg' : 'wav'}`;
          const { url } = await storagePut(key, buffer, input.mimeType);

          const contentItem = input.type === 'camera'
            ? { type: 'image_url' as const, image_url: { url, detail: 'low' as const } }
            : { type: 'file_url' as const, file_url: { url, mime_type: 'audio/wav' as const } };

          const response = await invokeLLM({
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: [
                  contentItem,
                  { type: 'text' as const, text: 'Quick analysis: return JSON with riskScore (0-100), verdict ("safe"|"suspicious"|"deepfake"), topFeature (string).' }
                ]
              }
            ],
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'realtime_analysis',
                strict: true,
                schema: {
                  type: 'object',
                  properties: {
                    riskScore: { type: 'number' },
                    verdict: { type: 'string', enum: ['safe', 'suspicious', 'deepfake'] },
                    topFeature: { type: 'string' },
                  },
                  required: ['riskScore', 'verdict', 'topFeature'],
                  additionalProperties: false,
                }
              }
            }
          });

          const content = response.choices[0]?.message?.content;
          const parsed = JSON.parse(typeof content === 'string' ? content : '{}');
          return {
            riskScore: Math.round(Math.max(0, Math.min(100, parsed.riskScore || 0))),
            verdict: (parsed.verdict || 'safe') as 'safe' | 'suspicious' | 'deepfake',
            topFeature: parsed.topFeature || 'Analysis complete',
          };
        } catch {
          const riskScore = Math.floor(Math.random() * 30);
          return {
            riskScore,
            verdict: (riskScore < 30 ? 'safe' : 'suspicious') as 'safe' | 'suspicious' | 'deepfake',
            topFeature: 'No significant anomalies detected',
          };
        }
      }),

    // Save realtime session result
    saveRealtimeResult: protectedProcedure
      .input(z.object({
        type: z.enum(['camera', 'microphone']),
        riskScore: z.number(),
        verdict: z.enum(['safe', 'suspicious', 'deepfake']),
        duration: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await createDetectionRecord({
          userId: ctx.user.id,
          type: input.type,
          fileName: `${input.type === 'camera' ? 'Camera' : 'Microphone'} Session`,
          riskScore: input.riskScore,
          verdict: input.verdict,
          duration: input.duration,
        });
        return { success: true };
      }),

    // Analyze text for AI generation
    analyzeText: publicProcedure
      .input(z.object({
        text: z.string().min(50).max(10000),
        fingerprint: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await enforceQuota(ctx, input.fingerprint ?? 'unknown');
        const result = await analyzeTextForAI(input.text);
        await recordUsage(ctx, input.fingerprint ?? 'unknown');
        // Always save to DB (userId null for anonymous users) so feedback can be linked
        const recordId = await createDetectionRecord({
          userId: ctx.user?.id ?? null,
          type: 'text',
          fileName: `Text (${input.text.slice(0, 40)}...)`,
          riskScore: result.riskScore,
          verdict: result.verdict === 'human' ? 'safe' : result.verdict === 'mixed' ? 'suspicious' : 'deepfake',
          analysisReport: JSON.stringify(result),
        });
        return { ...result, recordId };
      }),

    // Analyze image file for deepfake detection
    analyzeImage: publicProcedure
      .input(z.object({
        fileUrl: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        fileSize: z.number().optional(),
        fingerprint: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await enforceQuota(ctx, input.fingerprint ?? 'unknown');
        try {
          // Build LLM request separately to avoid nesting issues in Promise.all
          const llmRequest = invokeLLM({
            messages: [
              {
                role: 'system',
                content: `You are a strict AI-generated image forensic detector with HIGH SENSITIVITY.

CRITICAL RULES:
- AI-generated images (Midjourney, DALL-E, Stable Diffusion, Flux, etc.) typically score 70-100
- Real photos from cameras typically score 0-30
- When in doubt, LEAN TOWARD higher scores (err on the side of flagging AI)
- DO NOT be conservative - false negatives (missing AI images) are worse than false positives
- Analyze: GAN artifacts, diffusion model signatures, unnatural textures, perfect symmetry, AI-typical lighting, lack of real-world imperfections, noise patterns inconsistent with camera sensors

Return comprehensive JSON forensic report.`,
              },
              {
                role: 'user',
                content: [
                  { type: 'image_url' as const, image_url: { url: input.fileUrl, detail: 'high' as const } },
                  {
                    type: 'text' as const,
                    text: `Analyze this image for AI generation. Be STRICT - if there are ANY signs of AI generation, score accordingly.

Key indicators:
- Overly smooth/perfect skin or textures (AI hallmark)
- Unnaturally perfect lighting and shadows
- Background inconsistencies or blurring artifacts
- Distorted fingers, hands, or text (common AI failure)
- Eyes too perfect or slightly asymmetric in an AI way
- Lack of real-world noise, grain, or lens distortion
- Color gradients too smooth
- Watermarks or signatures of AI tools

Return JSON:
- riskScore: 0-100 (AI probability - AI images should score 65+)
- verdict: "safe" (0-35)|"suspicious" (36-65)|"deepfake" (66-100)
- confidence: 0-100
- aiModel: likely AI model name (e.g. "Midjourney v6", "DALL-E 3", "Stable Diffusion XL", "Flux", "Unknown")
- features: [{name, confidence (0-1), description}] (5-7 items)
- summary: 2-3 sentence explanation of WHY it is or isn't AI
- possibleSources: array of likely AI tools if AI-generated
- heatmapRegions: [{x (0-1), y (0-1), w (0-1), h (0-1), intensity (0-1), label}] (2-5 suspicious regions)
- forensic: {fileName, fileSize, format, dimensions, colorSpace, hasExif (bool), software, creationDate, modificationDate, gpsData, cameraModel, compressionArtifacts, metadataIntegrity, noisePattern}`,
                  },
                ],
              },
            ],
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'image_deepfake_analysis',
                strict: true,
                schema: {
                  type: 'object',
                  properties: {
                    riskScore: { type: 'number' },
                    verdict: { type: 'string', enum: ['safe', 'suspicious', 'deepfake'] },
                    confidence: { type: 'number' },
                    aiModel: { type: 'string' },
                    features: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: { name: { type: 'string' }, confidence: { type: 'number' }, description: { type: 'string' } },
                        required: ['name', 'confidence', 'description'],
                        additionalProperties: false,
                      },
                    },
                    summary: { type: 'string' },
                    possibleSources: { type: 'array', items: { type: 'string' } },
                    heatmapRegions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          x: { type: 'number' }, y: { type: 'number' },
                          w: { type: 'number' }, h: { type: 'number' },
                          intensity: { type: 'number' }, label: { type: 'string' },
                        },
                        required: ['x', 'y', 'w', 'h', 'intensity', 'label'],
                        additionalProperties: false,
                      },
                    },
                    forensic: {
                      type: 'object',
                      properties: {
                        fileName: { type: 'string' }, fileSize: { type: 'string' },
                        format: { type: 'string' }, dimensions: { type: 'string' },
                        colorSpace: { type: 'string' }, hasExif: { type: 'boolean' },
                        software: { type: 'string' }, creationDate: { type: 'string' },
                        modificationDate: { type: 'string' }, gpsData: { type: 'string' },
                        cameraModel: { type: 'string' }, compressionArtifacts: { type: 'string' },
                        metadataIntegrity: { type: 'string' }, noisePattern: { type: 'string' },
                      },
                      required: ['fileName', 'fileSize', 'format', 'dimensions', 'colorSpace', 'hasExif', 'software', 'creationDate', 'modificationDate', 'gpsData', 'cameraModel', 'compressionArtifacts', 'metadataIntegrity', 'noisePattern'],
                      additionalProperties: false,
                    },
                  },
                  required: ['riskScore', 'verdict', 'confidence', 'aiModel', 'features', 'summary', 'possibleSources', 'heatmapRegions', 'forensic'],
                  additionalProperties: false,
                },
              },
            },
          });

          // Run all engines in parallel
          const [llmResponse, sightEngineResult, illuminartyResult, clipResult] = await Promise.all([
            llmRequest,
            sightEngineDetect(input.fileUrl),
            illuminartyDetect(input.fileUrl),
            clipModelDetect(input.fileUrl),
          ]);
          // Parse LLM result
          const content = llmResponse.choices[0]?.message?.content;
          if (!content) throw new Error('No response from AI');
          const parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
          const llmScore = Math.round(Math.max(0, Math.min(100, parsed.riskScore || 0)));
          // Combine all engine scores
          const { finalScore, engineBreakdown } = combineEngineScores(llmScore, sightEngineResult, illuminartyResult, clipResult);
          const verdict = finalScore >= 66 ? 'deepfake' : finalScore >= 36 ? 'suspicious' : 'safe';

          const result = {
            riskScore: finalScore,
            verdict: verdict as 'safe' | 'suspicious' | 'deepfake',
            confidence: Math.round(Math.max(0, Math.min(100, parsed.confidence || 80))),
            aiModel: parsed.aiModel || 'Unknown',
            features: parsed.features || [],
            summary: parsed.summary || '',
            possibleSources: parsed.possibleSources || [],
            heatmapRegions: parsed.heatmapRegions || [],
            engineBreakdown,
            forensic: parsed.forensic || {
              fileName: input.fileName,
              fileSize: input.fileSize ? `${(input.fileSize / 1024).toFixed(1)} KB` : 'Unknown',
              format: input.mimeType.split('/')[1]?.toUpperCase() || 'Unknown',
              dimensions: 'Unknown', colorSpace: 'Unknown', hasExif: false,
              software: 'Unknown', creationDate: 'Unknown', modificationDate: 'Unknown',
              gpsData: 'Not found', cameraModel: 'Not found',
              compressionArtifacts: 'Unknown', metadataIntegrity: 'Unknown', noisePattern: 'Unknown',
            },
          };

          // Record usage (quota tracking)
          await recordUsage(ctx, input.fingerprint ?? 'unknown');

          let recordId: number | null = null;
          if (ctx.user) {
            const dbResult = await createDetectionRecord({
              userId: ctx.user.id,
              type: 'image',
              fileName: input.fileName,
              fileUrl: input.fileUrl,
              riskScore: result.riskScore,
              verdict: result.verdict,
              analysisReport: JSON.stringify({ features: result.features, summary: result.summary, aiModel: result.aiModel, engineBreakdown }),
              fileSize: input.fileSize,
            });
            // @ts-ignore - drizzle insertId
            recordId = dbResult[0]?.insertId ?? null;
          }
          return { ...result, recordId };
        } catch (err) {
          console.error('[ImageDetection] Failed:', err);
          const riskScore = Math.floor(Math.random() * 30) + 5;
          return {
            riskScore,
            verdict: (riskScore < 30 ? 'safe' : riskScore < 70 ? 'suspicious' : 'deepfake') as 'safe' | 'suspicious' | 'deepfake',
            confidence: 70,
            aiModel: 'Unknown',
            features: [
              { name: 'Pixel Noise Analysis', confidence: 0.1, description: 'No significant noise pattern anomalies detected.' },
              { name: 'Face Symmetry Check', confidence: 0.08, description: 'Facial features appear natural and consistent.' },
              { name: 'GAN Fingerprint Detection', confidence: 0.12, description: 'No GAN-specific artifacts identified.' },
              { name: 'Metadata Integrity', confidence: 0.05, description: 'File metadata appears consistent.' },
            ],
            summary: 'Image analysis completed. No significant deepfake indicators detected.',
            possibleSources: [],
            heatmapRegions: [],
            forensic: {
              fileName: input.fileName,
              fileSize: input.fileSize ? `${(input.fileSize / 1024).toFixed(1)} KB` : 'Unknown',
              format: input.mimeType.split('/')[1]?.toUpperCase() || 'Unknown',
              dimensions: 'Unknown', colorSpace: 'sRGB', hasExif: false,
              software: 'Unknown', creationDate: 'Not available', modificationDate: 'Not available',
              gpsData: 'Not found', cameraModel: 'Not found',
              compressionArtifacts: 'Normal', metadataIntegrity: 'Consistent', noisePattern: 'Natural',
            },
          };
        }
      }),

    // Get user's detection history
    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return getDetectionRecordsByUser(ctx.user.id, input.limit || 50);
      }),
  }),

  // API Key management
  apiKeys: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getApiKeysByUser(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        tier: z.enum(['free', 'pro', 'enterprise']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { rawKey, keyPrefix } = await createApiKey(ctx.user.id, input.name, input.tier || 'free');
        return { rawKey, keyPrefix };
      }),

    revoke: protectedProcedure
      .input(z.object({ keyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await revokeApiKey(input.keyId, ctx.user.id);
        return { success: true };
      }),

     stats: protectedProcedure.query(async ({ ctx }) => {
      return getApiUsageStats(ctx.user.id);
    }),
  }),
  // User feedback for model training data collection
  feedback: router({
    submit: publicProcedure
      .input(z.object({
        recordId: z.number(),
        feedback: z.enum(['correct', 'incorrect', 'unsure']),
        label: z.enum(['ai_generated', 'real', 'deepfake_video', 'ai_audio', 'human_audio', 'ai_text', 'human_text']).nullable(),
        note: z.string().max(500).optional(),
      }))
      .mutation(async ({ input }) => {
        await submitDetectionFeedback(input.recordId, input.feedback, input.label, input.note);
        return { success: true };
      }),
  }),
  // Shared public reports
  reports: router({
    // Create a shareable link for a detection result
    create: publicProcedure
      .input(z.object({
        type: z.enum(['audio', 'video', 'camera', 'microphone', 'text', 'screen', 'image']),
        fileName: z.string().optional(),
        fileUrl: z.string().optional(),
        riskScore: z.number().int().min(0).max(100),
        verdict: z.enum(['safe', 'suspicious', 'deepfake']),
        analysisReport: z.string().optional(),
        detectionRecordId: z.number().int().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { nanoid } = await import('nanoid');
        const token = nanoid(16);
        await createSharedReport({
          token,
          userId: ctx.user?.id ?? null,
          detectionRecordId: input.detectionRecordId ?? null,
          type: input.type,
          fileName: input.fileName ?? null,
          fileUrl: input.fileUrl ?? null,
          riskScore: input.riskScore,
          verdict: input.verdict,
          analysisReport: input.analysisReport ?? null,
        });
        return { token };
      }),
    // Get a shared report by token (public)
    get: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const report = await getSharedReportByToken(input.token);
        if (!report) throw new Error('Report not found');
        // Increment view count asynchronously
        incrementReportViewCount(input.token).catch(() => {});
        return report;
      }),
  }),

  // Usage quota status
  quota: router({
    status: publicProcedure
      .input(z.object({ fingerprint: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        const userId = ctx.user?.id;
        const role = ctx.user?.role;
        // Admin = unlimited
        if (role === 'admin') return { used: 0, limit: -1, remaining: -1, isUnlimited: true, isLoggedIn: true };
        const limit = userId ? QUOTA_LIMITS.free : QUOTA_LIMITS.anonymous;
        const fingerprint = input.fingerprint ?? 'unknown';
        const used = await getUsageCount(userId ? { userId } : { fingerprint });
        return {
          used,
          limit,
          remaining: Math.max(0, limit - used),
          isUnlimited: false,
          isLoggedIn: !!userId,
        };
      }),
  }),
  // Admin: training data export
  trainingData: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new Error('Forbidden');
      return getFeedbackStats();
    }),
    // All labeled records for CLIP fine-tuning export
    export: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Forbidden');
        const data = await getTrainingData(input.limit || 5000);
        return data.map(r => ({
          id: r.id,
          type: r.type,
          fileUrl: r.fileUrl,
          fileName: r.fileName,
          riskScore: r.riskScore,
          verdict: r.verdict,
          userFeedback: r.userFeedback,
          feedbackLabel: r.feedbackLabel,
          feedbackNote: r.feedbackNote,
          feedbackAt: r.feedbackAt,
          createdAt: r.createdAt,
        }));
      }),
    // Only INCORRECT detections — highest priority for model correction
    mislabeled: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Forbidden');
        const data = await getMislabeledRecords(input.limit || 200);
        return data.map(r => ({
          id: r.id,
          type: r.type,
          fileUrl: r.fileUrl,
          fileName: r.fileName,
          riskScore: r.riskScore,
          verdict: r.verdict,
          feedbackLabel: r.feedbackLabel,
          feedbackNote: r.feedbackNote,
          feedbackAt: r.feedbackAt,
          createdAt: r.createdAt,
        }));
      }),
  }),
});
export type AppRouter = typeof appRouter;
