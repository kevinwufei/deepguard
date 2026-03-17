/**
 * Lightweight browser fingerprint generator.
 * Combines stable browser properties into a short hash.
 * NOT cryptographically secure — used only for soft rate limiting.
 */
export function getBrowserFingerprint(): string {
  const parts: string[] = [
    navigator.userAgent,
    navigator.language,
    String(screen.width) + 'x' + String(screen.height),
    String(screen.colorDepth),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(navigator.hardwareConcurrency ?? ''),
    String((navigator as { deviceMemory?: number }).deviceMemory ?? ''),
  ];

  // Simple djb2-style hash
  let hash = 5381;
  const str = parts.join('|');
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return 'fp_' + hash.toString(36);
}
