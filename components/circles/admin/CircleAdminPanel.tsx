"use client";

import * as React from "react";
import { PostUpdateForm } from "./PostUpdateForm";
import { MemberManagement } from "./MemberManagement";
import { cn } from "@/lib/utils";

export type CircleAdminPanelProps = {
  circleSlug: string;
  circleName: string;
  currentUserId: string;
  channelList: { slug: string; name: string }[];
  className?: string;
  circleImageUrl?: string | null;
};

type ChatMessageRow = {
  id: string;
  username: string;
  message_text: string;
  created_at: string;
  user_id?: string;
};

export function CircleAdminPanel({
  circleSlug,
  circleName,
  currentUserId,
  channelList,
  className,
  circleImageUrl,
}: CircleAdminPanelProps) {
  const [moderateChannel, setModerateChannel] = React.useState(
    channelList[0]?.slug ?? "general"
  );
  const [messages, setMessages] = React.useState<ChatMessageRow[]>([]);
  const [messagesLoading, setMessagesLoading] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState<string | null>(null);
  const [imageUrl, setImageUrl] = React.useState<string | null>(
    circleImageUrl ?? null
  );
  const [imageSaving, setImageSaving] = React.useState(false);
  const [imageError, setImageError] = React.useState<string | null>(null);

  async function updateCircleImage(body: unknown) {
    setImageError(null);
    setImageSaving(true);
    try {
      const res = await fetch(
        `/api/circles/${encodeURIComponent(circleSlug)}/image`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setImageError(data?.error || "Failed to update circle image");
        return;
      }
      setImageUrl(data.circle_image_url ?? null);
    } catch {
      setImageError("Failed to update circle image");
    } finally {
      setImageSaving(false);
    }
  }

  function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result?.toString() ?? "";
      if (!dataUrl) return;
      void updateCircleImage({ mode: "custom", imageUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  const loadMessages = React.useCallback(() => {
    setMessagesLoading(true);
    fetch(
      `/api/circle-messages/history?circleSlug=${encodeURIComponent(circleSlug)}&channel=${encodeURIComponent(moderateChannel)}&limit=30`,
      { credentials: "include" }
    )
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((data) => setMessages(data.messages ?? []))
      .catch(() => setMessages([]))
      .finally(() => setMessagesLoading(false));
  }, [circleSlug, moderateChannel]);

  React.useEffect(() => loadMessages(), [loadMessages]);

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Delete this message?")) return;
    setDeleteLoading(messageId);
    try {
      const res = await fetch("/api/circle-messages/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messageId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Failed to delete");
        return;
      }
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Circle image
        </h3>
        <p className="text-xs text-gray-600 dark:text-white/60 mb-3">
          Set a visual identity for this circle. Use a square, safe-for-work image.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex items-center gap-3">
            {/* simple inline avatar preview */}
            <div className="h-16 w-16 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-indigo-500 text-white flex items-center justify-center text-sm font-semibold">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={circleName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>
                  {circleName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase() || "?"}
                </span>
              )}
            </div>
            <div className="space-y-1 text-xs text-gray-600 dark:text-white/60">
              <p className="font-medium">
                {imageUrl ? "Custom image set" : "Using automatic initials avatar"}
              </p>
              <p>Recommended: square, at least 512×512px.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <label className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-3 py-1.5 font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-white/20 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
              Upload image
            </label>
            <button
              type="button"
              onClick={() => updateCircleImage({ mode: "auto" })}
              disabled={imageSaving}
              className="inline-flex items-center justify-center rounded-full bg-violet-600 px-3 py-1.5 font-medium text-white hover:bg-violet-700 disabled:opacity-50 text-xs"
            >
              {imageSaving ? "Saving…" : "Auto-generate from topic"}
            </button>
            <button
              type="button"
              onClick={() => updateCircleImage({ mode: "reset" })}
              disabled={imageSaving}
              className="inline-flex items-center justify-center rounded-full border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 dark:border-white/20 dark:text-white/80 dark:hover:bg-white/10 text-xs"
            >
              Reset image
            </button>
          </div>
        </div>
        {imageError && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            {imageError}
          </p>
        )}
      </div>

      <PostUpdateForm circleSlug={circleSlug} onSuccess={() => {}} />

      <MemberManagement
        circleSlug={circleSlug}
        currentUserId={currentUserId}
      />

      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Moderate chat
        </h3>
        {channelList.length > 1 && (
          <select
            value={moderateChannel}
            onChange={(e) => setModerateChannel(e.target.value)}
            className="mb-3 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-sm text-gray-900 dark:text-white py-1.5 px-2"
          >
            {channelList.map((ch) => (
              <option key={ch.slug} value={ch.slug}>
                {ch.name}
              </option>
            ))}
          </select>
        )}
        {messagesLoading ? (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-white/50 py-4">
            No messages in this channel.
          </p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {messages.map((m) => (
              <li
                key={m.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-gray-100 dark:border-white/5 px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {m.username}
                  </span>
                  <span className="text-gray-500 dark:text-white/50 text-xs ml-1">
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                  <p className="text-gray-700 dark:text-white/80 whitespace-pre-wrap break-words mt-0.5">
                    {m.message_text}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteMessage(m.id)}
                  disabled={deleteLoading === m.id}
                  className="shrink-0 rounded px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
                >
                  {deleteLoading === m.id ? "…" : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={loadMessages}
          className="mt-2 text-xs text-violet-600 dark:text-violet-400 hover:underline"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
