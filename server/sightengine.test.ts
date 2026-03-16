import { describe, it, expect } from 'vitest';

// Test SightEngine and Illuminarty API connectivity
// Uses stable public image URLs that SightEngine can download

// Real photo (not AI) - Pexels allows direct access
const REAL_PHOTO_URL = 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg';

describe('SightEngine API', () => {
  it('should have SIGHTENGINE_API_USER and SIGHTENGINE_API_SECRET env vars set', () => {
    expect(process.env.SIGHTENGINE_API_USER).toBeTruthy();
    expect(process.env.SIGHTENGINE_API_SECRET).toBeTruthy();
    expect(process.env.SIGHTENGINE_API_USER).toBe('708729595');
  });

  it('should successfully call SightEngine genai detection API and return ai_generated score', async () => {
    const apiUser = process.env.SIGHTENGINE_API_USER;
    const apiSecret = process.env.SIGHTENGINE_API_SECRET;

    const params = new URLSearchParams({
      url: REAL_PHOTO_URL,
      models: 'genai',
      api_user: apiUser!,
      api_secret: apiSecret!,
    });

    const res = await fetch(`https://api.sightengine.com/1.0/check.json?${params}`);
    expect(res.ok).toBe(true);

    const data = await res.json() as { status?: string; type?: { ai_generated?: number } };
    console.log('[SightEngine] API response:', JSON.stringify(data));

    // Should return success status
    expect(data.status).toBe('success');
    // Should return ai_generated score between 0 and 1
    expect(typeof data.type?.ai_generated).toBe('number');
    expect(data.type!.ai_generated).toBeGreaterThanOrEqual(0);
    expect(data.type!.ai_generated).toBeLessThanOrEqual(1);

    // This is a real photo, should score low for AI generation
    console.log(`[SightEngine] ai_generated score for real photo: ${data.type?.ai_generated}`);
  }, 15000);
});

describe('Illuminarty API', () => {
  it('should have ILLUMINARTY_API_KEY env var set', () => {
    expect(process.env.ILLUMINARTY_API_KEY).toBeTruthy();
    expect(process.env.ILLUMINARTY_API_KEY).toBe('oxlm568Cu0KH1WWWPE0e');
  });

  it('should connect to Illuminarty API without auth error', async () => {
    const apiKey = process.env.ILLUMINARTY_API_KEY;

    const res = await fetch('https://api.illuminarty.ai/detect', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: REAL_PHOTO_URL }),
    });

    console.log('[Illuminarty] HTTP status:', res.status);

    // Should NOT return 401 (unauthorized) or 403 (forbidden) - that would mean invalid API key
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
    // 200 is expected (even if body is empty - API may be async)
    expect(res.status).toBe(200);
    console.log('[Illuminarty] API key is valid, connection successful');
  }, 15000);
});
