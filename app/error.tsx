"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-black px-4 text-white">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-center text-sm text-white/70">
        {error.message || "An error occurred. Try refreshing the page."}
      </p>
      <Button
        onClick={reset}
        variant="ghost"
        className="border border-white/20 text-white hover:bg-white/10"
      >
        Try again
      </Button>
    </div>
  );
}
