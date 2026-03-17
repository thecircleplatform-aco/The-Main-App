/**
 * Typing effect utility for AI responses.
 * Renders text character-by-character with configurable speed.
 * Non-blocking: uses setTimeout for progressive updates.
 */

import * as React from "react";

export const DEFAULT_TYPING_SPEED_MS = 12;

export type TypeTextOptions = {
  /** ms per character (higher = slower) */
  speedMs?: number;
  /** if true, skip animation and show full text */
  instant?: boolean;
};

export type TypeTextRenderer = (displayed: string, isComplete: boolean) => void;

/**
 * Streams text to a renderer character-by-character.
 * Returns a cleanup function. Non-blocking.
 */
export function typeText(
  text: string,
  renderer: TypeTextRenderer,
  options: TypeTextOptions = {}
): () => void {
  const { speedMs = DEFAULT_TYPING_SPEED_MS, instant = false } = options;

  if (instant || speedMs <= 0) {
    renderer(text, true);
    return () => {};
  }

  let cancelled = false;
  let idx = 0;

  const tick = () => {
    if (cancelled) return;
    if (idx >= text.length) {
      renderer(text, true);
      return;
    }
    idx += 1;
    renderer(text.slice(0, idx), false);
    setTimeout(tick, speedMs);
  };

  renderer("", false);
  setTimeout(tick, speedMs);

  return () => {
    cancelled = true;
  };
}

/**
 * React hook for progressive text reveal. Returns [displayedText, isComplete].
 * When speedMs <= 0, returns full text immediately (no animation).
 */
export function useTypewriter(
  text: string,
  speedMs: number = DEFAULT_TYPING_SPEED_MS
): [string, boolean] {
  const [displayed, setDisplayed] = React.useState("");
  const [isComplete, setIsComplete] = React.useState(false);

  React.useEffect(() => {
    if (speedMs <= 0) {
      setDisplayed(text);
      setIsComplete(true);
      return;
    }
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = (idx: number) => {
      if (cancelled) return;
      if (idx >= text.length) {
        setDisplayed(text);
        setIsComplete(true);
        return;
      }
      setDisplayed(text.slice(0, idx + 1));
      timeoutId = setTimeout(() => tick(idx + 1), speedMs);
    };

    setDisplayed("");
    setIsComplete(false);
    timeoutId = setTimeout(() => tick(0), speedMs);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [text, speedMs]);

  return [displayed, isComplete];
}
