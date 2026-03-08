/**
 * Generate a simple device fingerprint for one-account-per-device.
 * Uses screen, language, timezone as a stable identifier.
 * In production, consider using a library like fingerprintjs for robustness.
 */
export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "";
  const parts = [
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency ?? 0,
  ];
  let hash = 0;
  const str = parts.join("|");
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `fp_${Math.abs(hash).toString(36)}`;
}
