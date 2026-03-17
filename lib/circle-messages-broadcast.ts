/**
 * In-memory broadcaster for circle channel messages.
 * SSE clients subscribe by circleSlug:channelSlug; send route notifies after insert.
 */

export type CircleMessagePayload = {
  id: string;
  circle_id: string;
  channel_id: string;
  user_id: string;
  username: string;
  message_text: string;
  created_at: string;
};

type Listener = (data: CircleMessagePayload) => void;

const listeners = new Map<string, Set<Listener>>();

function key(circleSlug: string, channelSlug: string): string {
  return `${circleSlug}:${channelSlug}`;
}

export function subscribe(
  circleSlug: string,
  channelSlug: string,
  listener: Listener
): () => void {
  const k = key(circleSlug, channelSlug);
  if (!listeners.has(k)) listeners.set(k, new Set());
  listeners.get(k)!.add(listener);
  return () => {
    listeners.get(k)?.delete(listener);
    if (listeners.get(k)?.size === 0) listeners.delete(k);
  };
}

export function broadcast(
  circleSlug: string,
  channelSlug: string,
  payload: CircleMessagePayload
): void {
  const k = key(circleSlug, channelSlug);
  const set = listeners.get(k);
  if (!set) return;
  for (const fn of set) {
    try {
      fn(payload);
    } catch (e) {
      console.warn("Circle broadcast listener error:", e);
    }
  }
}
