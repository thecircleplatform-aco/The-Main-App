"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type PostUpdateFormProps = {
  circleSlug: string;
  onSuccess?: () => void;
  className?: string;
};

export function PostUpdateForm({
  circleSlug,
  onSuccess,
  className,
}: PostUpdateFormProps) {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/circle-updates/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          circleSlug,
          title: title.trim(),
          content: content.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to post update");
        return;
      }
      setTitle("");
      setContent("");
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-4",
        className
      )}
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Post update
      </h3>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>
      )}
      <input
        type="text"
        placeholder="Title (e.g. Match Update)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/50 mb-2"
      />
      <textarea
        placeholder="Content (e.g. Ronaldo scored 2 goals today.)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        rows={3}
        className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/50 resize-none mb-3"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {loading ? "Posting…" : "Post update"}
      </button>
    </form>
  );
}
