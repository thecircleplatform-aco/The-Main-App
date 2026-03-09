/**
 * Share service - use native Share plugin on mobile, clipboard fallback on web.
 */

import { getShare } from "./capacitor";

export async function shareContent(options: {
  title?: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
}): Promise<boolean> {
  const Share = (await getShare())?.Share;
  if (Share) {
    try {
      await Share.share({
        title: options.title ?? "Circle Insight",
        text: options.text ?? "",
        url: options.url,
        dialogTitle: options.dialogTitle ?? "Share",
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
