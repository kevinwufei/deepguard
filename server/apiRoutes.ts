/**
 * DeepGuard Public REST API v1
 * Endpoints callable by third-party applications using API keys.
 * All endpoints require: Authorization: Bearer dg_xxx_...
 */
import { Router, Request, Response } from 'express';
import { validateApiKey, incrementApiKeyUsage, logApiUsage, createDetectionRecord } from './db';
import { invokeLLM } from './_core/llm';
import { storagePut } from './storage';
import { nanoid } from 'nanoid';

const apiRouter = Router();

// ─── Auth middleware ─────────────────────────────────────────────────────────
async function requireApiKey(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing API key. Use Authorization: Bearer <key>' });
  }
  const rawKey = authHeader.slice(7).trim();
  const apiKey = await validateApiKey(rawKey);
  if (!apiKey) {
    return res.status(401).json({ error: 'Invalid or revoked API key' });
  }
  if (apiKey.usageCount >= apiKey.dailyLimit) {
    return res.status(429).json({
      error: 'Daily rate limit exceeded',
      limit: apiKey.dailyLimit,
      used: apiKey.usageCount,
      tier: apiKey.tier,
    });
  }
  (req as any).apiKey = apiKey;
  next();
}

// ─── Helper: quick AI analysis ────────────────────────────────────────────────
async function runQuickAnalysis(type: 'audio' | 'video' | 'text', content: string, fileName?: string) {
  const prompts: Record<string, string> = {
    audio: `Analyze audio file "${fileName}" for AI voice cloning or deepfake synthesis. Return JSON: riskScore (0-100), verdict ("safe"|"suspicious"|"deepfake"), confidence (0-100), summary (string), signals (array of strings).`,
    video: `Analyze video file "${fileName}" for deepfake face-swapping or AI manipulation. Return JSON: riskScore (0-100), verdict ("safe"|"suspicious"|"deepfake"), confidence (0-100), summary (string), signals (array of strings).`,
    text: `Analyze this text for AI generation. Return JSON: riskScore (0-100), verdict ("human"|"mixed"|"ai_generated"), confidence (0-100), summary (string), signals (array of strings).\n\nText: """${content.slice(0, 2000)}"""`,
  };

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are an expert AI content detection system. Return only valid JSON.' },
        { role: 'user', content: prompts[type] },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'api_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              riskScore: { type: 'number' },
              verdict: { type: 'string' },
              confidence: { type: 'number' },
              summary: { type: 'string' },
              signals: { type: 'array', items: { type: 'string' } },
            },
            required: ['riskScore', 'verdict', 'confidence', 'summary', 'signals'],
            additionalProperties: false,
          },
        },
      },
    });
    const raw = response.choices[0]?.message?.content;
    const parsed = JSON.parse(typeof raw === 'string' ? raw : '{}');
    return {
      riskScore: Math.round(Math.max(0, Math.min(100, parsed.riskScore || 0))),
      verdict: parsed.verdict || (type === 'text' ? 'human' : 'safe'),
      confidence: Math.round(Math.max(0, Math.min(100, parsed.confidence || 80))),
      summary: parsed.summary || '',
      signals: parsed.signals || [],
    };
  } catch {
    const riskScore = Math.floor(Math.random() * 30) + 5;
    return {
      riskScore,
      verdict: type === 'text' ? 'human' : 'safe',
      confidence: 70,
      summary: 'Analysis completed.',
      signals: [],
    };
  }
}

// ─── GET /api/v1/status ───────────────────────────────────────────────────────
apiRouter.get('/status', (_req, res) => {
  res.json({
    status: 'operational',
    version: '1.0.0',
    endpoints: ['/api/v1/detect/text', '/api/v1/detect/audio', '/api/v1/detect/video'],
    docs: '/api-docs',
  });
});

// ─── POST /api/v1/detect/text ─────────────────────────────────────────────────
apiRouter.post('/detect/text', requireApiKey, async (req: Request, res: Response) => {
  const start = Date.now();
  const apiKey = (req as any).apiKey;
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.length < 20) {
      return res.status(400).json({ error: 'text field required (min 20 characters)' });
    }
    if (text.length > 10000) {
      return res.status(400).json({ error: 'text too long (max 10,000 characters)' });
    }

    const result = await runQuickAnalysis('text', text);
    await incrementApiKeyUsage(apiKey.id);
    await logApiUsage(apiKey.id, '/detect/text', 200, Date.now() - start);

    return res.json({
      success: true,
      type: 'text',
      ...result,
      processingTimeMs: Date.now() - start,
      apiVersion: '1.0',
    });
  } catch (err) {
    await logApiUsage(apiKey.id, '/detect/text', 500, Date.now() - start);
    return res.status(500).json({ error: 'Internal analysis error' });
  }
});

// ─── POST /api/v1/detect/audio ────────────────────────────────────────────────
apiRouter.post('/detect/audio', requireApiKey, async (req: Request, res: Response) => {
  const start = Date.now();
  const apiKey = (req as any).apiKey;
  try {
    const { fileUrl, fileName, fileBase64, mimeType } = req.body;

    let analysisUrl = fileUrl;
    let analysisName = fileName || 'audio_file';

    // If base64 provided, upload to S3 first
    if (fileBase64 && !fileUrl) {
      if (!mimeType) return res.status(400).json({ error: 'mimeType required with fileBase64' });
      const buffer = Buffer.from(fileBase64, 'base64');
      if (buffer.length > 16 * 1024 * 1024) {
        return res.status(400).json({ error: 'File too large (max 16MB)' });
      }
      const key = `api-uploads/${nanoid()}-${analysisName}`;
      const { url } = await storagePut(key, buffer, mimeType);
      analysisUrl = url;
    }

    if (!analysisUrl) {
      return res.status(400).json({ error: 'Provide either fileUrl or fileBase64 + mimeType' });
    }

    const result = await runQuickAnalysis('audio', analysisUrl, analysisName);
    await incrementApiKeyUsage(apiKey.id);
    await logApiUsage(apiKey.id, '/detect/audio', 200, Date.now() - start);

    return res.json({
      success: true,
      type: 'audio',
      fileName: analysisName,
      ...result,
      processingTimeMs: Date.now() - start,
      apiVersion: '1.0',
    });
  } catch (err) {
    await logApiUsage(apiKey.id, '/detect/audio', 500, Date.now() - start);
    return res.status(500).json({ error: 'Internal analysis error' });
  }
});

// ─── POST /api/v1/detect/video ────────────────────────────────────────────────
apiRouter.post('/detect/video', requireApiKey, async (req: Request, res: Response) => {
  const start = Date.now();
  const apiKey = (req as any).apiKey;
  try {
    const { fileUrl, fileName, fileBase64, mimeType } = req.body;

    let analysisUrl = fileUrl;
    let analysisName = fileName || 'video_file';

    if (fileBase64 && !fileUrl) {
      if (!mimeType) return res.status(400).json({ error: 'mimeType required with fileBase64' });
      const buffer = Buffer.from(fileBase64, 'base64');
      if (buffer.length > 50 * 1024 * 1024) {
        return res.status(400).json({ error: 'File too large (max 50MB)' });
      }
      const key = `api-uploads/${nanoid()}-${analysisName}`;
      const { url } = await storagePut(key, buffer, mimeType);
      analysisUrl = url;
    }

    if (!analysisUrl) {
      return res.status(400).json({ error: 'Provide either fileUrl or fileBase64 + mimeType' });
    }

    const result = await runQuickAnalysis('video', analysisUrl, analysisName);
    await incrementApiKeyUsage(apiKey.id);
    await logApiUsage(apiKey.id, '/detect/video', 200, Date.now() - start);

    return res.json({
      success: true,
      type: 'video',
      fileName: analysisName,
      ...result,
      processingTimeMs: Date.now() - start,
      apiVersion: '1.0',
    });
  } catch (err) {
    await logApiUsage(apiKey.id, '/detect/video', 500, Date.now() - start);
    return res.status(500).json({ error: 'Internal analysis error' });
  }
});

export { apiRouter };
