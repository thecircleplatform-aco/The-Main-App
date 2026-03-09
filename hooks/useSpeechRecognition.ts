"use client";

import * as React from "react";

export type SpeechRecognitionState = "idle" | "listening" | "processing" | "unsupported";

export function useSpeechRecognition() {
  const [state, setState] = React.useState<SpeechRecognitionState>("idle");
  const [transcript, setTranscript] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const recognitionRef = React.useRef<{
    start: () => void;
    stop: () => void;
  } | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  React.useEffect(() => {
    if (!isSupported) {
      setState("unsupported");
      return;
    }
    const win = window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown };
    const SpeechRecognitionConstructor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) return;

    const recognition = new SpeechRecognitionConstructor() as {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      start: () => void;
      stop: () => void;
      onstart: () => void;
      onend: () => void;
      onresult: (e: unknown) => void;
      onerror: (e: unknown) => void;
    };
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";

    recognition.onstart = () => setState("listening");
    recognition.onend = () => setState("idle");
    recognition.onresult = (event: unknown) => {
      const e = event as { resultIndex: number; results: { length: number; [i: number]: { [j: number]: { transcript: string } } } };
      let result = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        result += e.results[i][0].transcript;
      }
      setTranscript((prev) => (prev + result).trim());
    };
    recognition.onerror = (ev: unknown) => {
      const err = (ev as { error?: string }).error;
      if (err === "no-speech" || err === "aborted") {
        setState("idle");
      } else {
        setError(err ?? "unknown");
        setState("idle");
      }
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    };
  }, [isSupported]);

  const start = React.useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;
    setError(null);
    setTranscript("");
    setState("listening");
    try {
      recognitionRef.current.start();
    } catch {
      setState("idle");
    }
  }, [isSupported]);

  const stop = React.useCallback(() => {
    if (recognitionRef.current && state === "listening") {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      setState("idle");
    }
  }, [state]);

  const reset = React.useCallback(() => {
    setTranscript("");
    setError(null);
    setState("idle");
  }, []);

  return {
    isSupported,
    state,
    transcript,
    error,
    start,
    stop,
    reset,
  };
}
