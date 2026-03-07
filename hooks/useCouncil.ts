import { useCallback, useMemo, useState } from "react";
import type { CouncilMessage, CouncilResponse } from "@/types/council";

type Status = "idle" | "running" | "error";

export function useCouncil() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<CouncilMessage[]>([]);

  const run = useCallback(async (idea: string) => {
    setStatus("running");
    setError(null);
    try {
      const res = await fetch("/api/council", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data?.error === "string"
            ? data.error
            : `Request failed (${res.status})`;
        throw new Error(msg);
      }
      setMessages((data as CouncilResponse).messages);
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }, []);

  return useMemo(
    () => ({
      status,
      error,
      messages,
      run,
      reset: () => {
        setMessages([]);
        setError(null);
        setStatus("idle");
      },
    }),
    [status, error, messages, run]
  );
}

