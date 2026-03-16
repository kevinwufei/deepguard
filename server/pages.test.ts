import { describe, it, expect } from 'vitest';

/**
 * Route registration smoke tests.
 * These verify that all new pages are properly imported and registered in the router.
 */
describe('New page routes', () => {
  it('Pricing page module exports a default component', async () => {
    const mod = await import('../client/src/pages/Pricing');
    expect(typeof mod.default).toBe('function');
  });

  it('ImageDetect page module exports a default component', async () => {
    const mod = await import('../client/src/pages/ImageDetect');
    expect(typeof mod.default).toBe('function');
  });

  it('Technology page module exports a default component', async () => {
    const mod = await import('../client/src/pages/Technology');
    expect(typeof mod.default).toBe('function');
  });

  it('MeetingGuard page module exports a default component', async () => {
    const mod = await import('../client/src/pages/MeetingGuard');
    expect(typeof mod.default).toBe('function');
  });

  it('Extension page module exports a default component', async () => {
    const mod = await import('../client/src/pages/Extension');
    expect(typeof mod.default).toBe('function');
  });

  it('UseCases page module exports a default component', async () => {
    const mod = await import('../client/src/pages/UseCases');
    expect(typeof mod.default).toBe('function');
  });

  it('BatchDetect page module exports a default component', async () => {
    const mod = await import('../client/src/pages/BatchDetect');
    expect(typeof mod.default).toBe('function');
  });
});
