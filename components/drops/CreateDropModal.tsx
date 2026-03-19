"use client";

import * as React from "react";
import { X, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import type { PostDrop } from "@/components/drops/PostCard";
import type { VideoDrop } from "@/components/drops/VideoDropstream";

export type CreateMode = "post" | "video";

type Props = {
  open: boolean;
  mode: CreateMode;
  onClose: () => void;
  onPostCreated: (post: PostDrop) => void;
  onVideoCreated: (video: VideoDrop) => void;
};

export function CreateDropModal({
  open,
  mode,
  onClose,
  onPostCreated,
  onVideoCreated,
}: Props) {
  const [entered, setEntered] = React.useState(false);
  const [postText, setPostText] = React.useState("");
  const [postImageFile, setPostImageFile] = React.useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = React.useState<string | null>(
    null
  );
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = React.useState<string | null>(
    null
  );
  const [videoCaption, setVideoCaption] = React.useState("");
  const [videoDurationSeconds, setVideoDurationSeconds] = React.useState<
    number | null
  >(null);
  const previewVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setEntered(false);
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  React.useEffect(() => {
    return () => {
      if (postImagePreview) URL.revokeObjectURL(postImagePreview);
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [postImagePreview, videoPreviewUrl]);

  React.useEffect(() => {
    // Some browsers render a black box until play; seek a hair to paint a frame.
    const el = previewVideoRef.current;
    if (!el || !videoPreviewUrl) return;
    try {
      el.pause();
      el.currentTime = 0;
      // Force a frame render.
      el.currentTime = 0.01;
    } catch {
      // Non-fatal: preview will still work via native controls.
    }
  }, [videoPreviewUrl]);

  const handleSelectPostImage = (file: File | null) => {
    if (postImagePreview) URL.revokeObjectURL(postImagePreview);
    if (!file) {
      setPostImageFile(null);
      setPostImagePreview(null);
      return;
    }
    setPostImageFile(file);
    setPostImagePreview(URL.createObjectURL(file));
  };

  const handleSelectVideo = (file: File | null) => {
    setError(null);
    setVideoDurationSeconds(null);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    if (!file) {
      setVideoFile(null);
      setVideoPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";
    tempVideo.onloadedmetadata = () => {
      const duration = tempVideo.duration;
      URL.revokeObjectURL(tempVideo.src);
      if (duration > 60) {
        URL.revokeObjectURL(objectUrl);
        setVideoFile(null);
        setVideoPreviewUrl(null);
        setVideoDurationSeconds(null);
        setError("Video must be 60 seconds or less.");
        return;
      }
      setVideoFile(file);
      setVideoPreviewUrl(objectUrl);
      setVideoDurationSeconds(duration);
    };
    tempVideo.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setVideoFile(null);
      setVideoPreviewUrl(null);
      setError("Could not read video. Try a different file.");
    };
    tempVideo.src = objectUrl;
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = postText.trim();
    if (!trimmed && !postImageFile) {
      setError("Add text or an image to post.");
      return;
    }
    setIsSubmitting(true);
    try {
      const imageUrlToSend =
        postImagePreview && postImagePreview.startsWith("http")
          ? postImagePreview
          : undefined;
      const res = await fetch("/api/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "post",
          circleSlug: "ai-builders",
          text: trimmed || undefined,
          imageUrl: imageUrlToSend,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.drop) {
        onPostCreated(data.drop as PostDrop);
        setPostText("");
        handleSelectPostImage(null);
        onClose();
      } else if (res.status === 401) {
        setError("Sign in to publish.");
      } else {
        setError((data.error as string) || "Failed to create post.");
      }
    } catch {
      setError("Failed to create post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!videoFile || !videoPreviewUrl) {
      setError("Select a video under 60 seconds.");
      return;
    }
    if (!videoCaption.trim()) {
      setError("Add a short caption.");
      return;
    }
    if (!videoDurationSeconds || videoDurationSeconds > 60) {
      setError("Video must be 60 seconds or less.");
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("video", videoFile);
      const uploadRes = await fetch("/api/drops/upload-video", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json().catch(() => ({}));
      const videoUrl =
        uploadRes.ok && uploadData?.url
          ? uploadData.url
          : videoPreviewUrl;

      const res = await fetch("/api/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "video",
          circleSlug: "ai-builders",
          videoUrl,
          caption: videoCaption.trim(),
          durationSeconds: Math.round(videoDurationSeconds),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.drop) {
        onVideoCreated(data.drop as VideoDrop);
        setVideoFile(null);
        setVideoCaption("");
        setVideoDurationSeconds(null);
        handleSelectVideo(null);
        onClose();
      } else if (res.status === 401) {
        setError("Sign in to publish.");
      } else {
        setError((data.error as string) || "Failed to create video.");
      }
    } catch {
      setError("Failed to create video.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[65] flex items-end justify-center px-4 pb-6 pt-20",
        "bg-black/70 backdrop-blur-[2px]",
        "transition-opacity duration-200 ease-out",
        entered ? "opacity-100" : "opacity-0"
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Create post or video"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label="Close"
      />
      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl border p-4",
          "shadow-[0_20px_70px_rgba(2,6,23,0.22)]",
          "bg-white/85 text-slate-900 border-slate-200/80",
          "backdrop-blur-xl ring-1 ring-black/5",
          "dark:bg-[#0b0f19]/70 dark:text-slate-100 dark:border-white/10 dark:ring-white/10",
          "transition-all duration-200 ease-out",
          entered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            Create {mode === "post" ? "post" : "video"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
              "bg-slate-900/5 text-slate-700 hover:bg-slate-900/10",
              "dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
            )}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {error && (
          <div className="mb-3 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        {mode === "post" ? (
          <form className="space-y-3" onSubmit={handleSubmitPost}>
            <textarea
              rows={4}
              className={cn(
                "w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none",
                "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400",
                "focus:border-violet-500 focus:ring-1 focus:ring-violet-500",
                "dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/45"
              )}
              placeholder="What's on your mind?"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
            />
            {postImagePreview && (
              <div className="relative rounded-xl overflow-hidden bg-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={postImagePreview}
                  alt="Preview"
                  className="h-48 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleSelectPostImage(null)}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <label
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors",
                  "bg-slate-900/5 text-slate-700 hover:bg-slate-900/10",
                  "dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
                )}
              >
                <ImageIcon className="h-4 w-4" />
                <span>Add image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleSelectPostImage(e.target.files?.[0] ?? null)
                  }
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
              >
                Post
              </button>
            </div>
          </form>
        ) : (
          <form className="space-y-3" onSubmit={handleSubmitVideo}>
            {!videoPreviewUrl && (
              <label
                className={cn(
                  "flex cursor-pointer flex-col gap-2 rounded-2xl border border-dashed p-4 text-center transition-colors",
                  "border-slate-200/80 bg-white/70 hover:bg-white/90",
                  "backdrop-blur-xl ring-1 ring-black/5",
                  "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:ring-white/10"
                )}
              >
                <VideoIcon className="mx-auto h-8 w-8 text-slate-500 dark:text-slate-300" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Upload video (max 60s)
                </span>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) =>
                    handleSelectVideo(e.target.files?.[0] ?? null)
                  }
                />
              </label>
            )}
            {videoPreviewUrl && (
              <div
                className={cn(
                  "rounded-2xl overflow-hidden bg-black",
                  "border border-black/10 shadow-[0_14px_50px_rgba(2,6,23,0.18)]",
                  "dark:border-white/10"
                )}
              >
                <video
                  ref={previewVideoRef}
                  src={videoPreviewUrl}
                  className="h-48 w-full object-cover"
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  onLoadedData={() => {
                    const el = previewVideoRef.current;
                    if (!el) return;
                    try {
                      el.currentTime = Math.min(0.01, el.duration || 0.01);
                    } catch {
                      // ignore
                    }
                  }}
                />
                <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-700 dark:text-slate-200">
                  <span>
                    {videoDurationSeconds != null
                      ? `${Math.round(videoDurationSeconds)}s`
                      : "Checking…"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectVideo(null)}
                    className="text-slate-700 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
            <input
              type="text"
              className={cn(
                "w-full rounded-xl border px-3 py-2.5 text-sm outline-none",
                "border-slate-200/80 bg-white/85 text-slate-900 placeholder:text-slate-400",
                "focus:border-violet-500 focus:ring-1 focus:ring-violet-500",
                "shadow-[0_10px_30px_rgba(2,6,23,0.06)]",
                "dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/45"
              )}
              placeholder="Caption"
              value={videoCaption}
              onChange={(e) => setVideoCaption(e.target.value)}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !videoFile}
                className={cn(
                  "rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white",
                  "hover:bg-violet-500 disabled:opacity-50",
                  "shadow-[0_14px_40px_rgba(124,58,237,0.35)]",
                  "ring-1 ring-violet-500/30"
                )}
              >
                Upload video
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
