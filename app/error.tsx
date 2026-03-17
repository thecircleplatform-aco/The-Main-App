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
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-gray-900 dark:bg-black dark:text-white">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-center text-sm text-gray-600 dark:text-white/70">
        {error.message || "An error occurred. Try refreshing the page."}
      </p>
      <Button
        onClick={reset}
        variant="ghost"
        className="border border-gray-300 text-gray-900 hover:bg-gray-200 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
      >
        Try again
      </Button>
    </div>
  );
}
