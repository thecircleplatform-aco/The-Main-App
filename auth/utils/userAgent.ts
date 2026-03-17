/**
 * Parse User-Agent for device name (browser + OS) for session display.
 */

export function parseDeviceName(userAgent: string | null): string {
  if (!userAgent || !userAgent.trim()) return "Unknown device";

  const ua = userAgent.trim();
  let browser = "Unknown browser";
  let os = "Unknown OS";

  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/MSIE|Trident/i.test(ua)) browser = "Internet Explorer";

  if (/Windows NT 10/i.test(ua)) os = "Windows 10/11";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/iPhone|iPad/i.test(ua)) os = /iPad/i.test(ua) ? "iPadOS" : "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Linux/i.test(ua)) os = "Linux";

  return `${browser} on ${os}`;
}
