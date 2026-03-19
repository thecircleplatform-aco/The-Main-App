"use client";

import * as React from "react";
import {
  PostCard,
  type PostDrop,
} from "@/components/drops/PostCard";
import {
  VideoDropstream,
  type VideoDrop,
} from "@/components/drops/VideoDropstream";
import { CommentsSheet, type CommentItem } from "@/components/drops/CommentsSheet";
import { CreateDropModal } from "@/components/drops/CreateDropModal";

type FeedTab = "posts" | "videos";

export default function DropsPage() {
  const [feedTab, setFeedTab] = React.useState<FeedTab>("posts");
  const [posts, setPosts] = React.useState<PostDrop[]>([]);
  const [videos, setVideos] = React.useState<VideoDrop[]>([]);
  const [dropsLoading, setDropsLoading] = React.useState(false);
  const [dropsError, setDropsError] = React.useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [createMode, setCreateMode] = React.useState<"post" | "video">("post");

  const [commentsDropId, setCommentsDropId] = React.useState<string | null>(null);
  const [commentsDropType, setCommentsDropType] = React.useState<"post" | "video">("post");
  const [commentsList, setCommentsList] = React.useState<CommentItem[]>([]);
  const [commentDraft, setCommentDraft] = React.useState("");
  const [commentSubmitting, setCommentSubmitting] = React.useState(false);

  // Sync feed tab with header
  React.useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("drops-feed-tab-changed", { detail: { tab: feedTab } })
    );
    window.dispatchEvent(
      new CustomEvent("drops-video-mode-changed", {
        detail: { enabled: feedTab === "videos" },
      })
    );
  }, [feedTab]);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ tab: FeedTab }>;
      if (ev.detail?.tab) setFeedTab(ev.detail.tab);
    };
    window.addEventListener("drops-feed-tab", handler as EventListener);
    return () =>
      window.removeEventListener("drops-feed-tab", handler as EventListener);
  }, []);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ mode?: "post" | "video" }>;
      setCreateModalOpen(true);
      if (ev.detail?.mode) setCreateMode(ev.detail.mode);
    };
    window.addEventListener("open-drops-create-modal", handler as EventListener);
    return () =>
      window.removeEventListener("open-drops-create-modal", handler as EventListener);
  }, []);

  const fetchDrops = React.useCallback(() => {
    setDropsLoading(true);
    setDropsError(null);
    fetch("/api/drops")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load drops");
        return res.json();
      })
      .then((data: { posts: PostDrop[]; videos: VideoDrop[] }) => {
        setPosts(data.posts ?? []);
        setVideos(data.videos ?? []);
      })
      .catch((err) => {
        setDropsError(
          err instanceof Error ? err.message : "Failed to load drops"
        );
      })
      .finally(() => setDropsLoading(false));
  }, []);

  React.useEffect(() => {
    fetchDrops();
  }, [fetchDrops]);

  const updatePost = React.useCallback((id: string, upd: Partial<PostDrop>) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...upd } : p))
    );
  }, []);

  const updateVideo = React.useCallback((id: string, upd: Partial<VideoDrop>) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...upd } : v))
    );
  }, []);

  const handleLikePost = React.useCallback(
    async (id: string) => {
      const post = posts.find((p) => p.id === id);
      if (!post) return;
      const newLiked = !post.isLiked;
      const newCount = post.likes + (newLiked ? 1 : -1);
      updatePost(id, { isLiked: newLiked, likes: Math.max(0, newCount) });
      try {
        const res = await fetch(`/api/drops/${id}/like`, { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && typeof data.likesCount === "number") {
          updatePost(id, { likes: data.likesCount, isLiked: data.liked });
        }
      } catch {
        updatePost(id, { isLiked: post.isLiked, likes: post.likes });
      }
    },
    [posts, updatePost]
  );

  const handleLikeVideo = React.useCallback(
    async (id: string) => {
      const video = videos.find((v) => v.id === id);
      if (!video) return;
      const newLiked = !video.isLiked;
      const newCount = video.likes + (newLiked ? 1 : -1);
      updateVideo(id, { isLiked: newLiked, likes: Math.max(0, newCount) });
      try {
        const res = await fetch(`/api/drops/${id}/like`, { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && typeof data.likesCount === "number") {
          updateVideo(id, { likes: data.likesCount, isLiked: data.liked });
        }
      } catch {
        updateVideo(id, { isLiked: video.isLiked, likes: video.likes });
      }
    },
    [videos, updateVideo]
  );

  const openComments = React.useCallback(
    (dropId: string, type: "post" | "video") => {
      setCommentsDropId(dropId);
      setCommentsDropType(type);
      setCommentDraft("");
      const post = posts.find((p) => p.id === dropId);
      const video = videos.find((v) => v.id === dropId);
      const list = (post ?? video)?.comments ?? [];
      setCommentsList(
        list.map((c) => ({
          id: c.id,
          author: c.author,
          text: c.text,
          createdAt: c.createdAt,
          replies: (c as CommentItem).replies ?? [],
        }))
      );
    },
    [posts, videos]
  );

  const handleCommentSubmit = React.useCallback(async (opts?: { replyToId?: string }) => {
    const text = commentDraft.trim();
    if (!text || !commentsDropId) return;

    setCommentSubmitting(true);
    try {
      const res = await fetch(`/api/drops/${commentsDropId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, parentCommentId: opts?.replyToId ?? null }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.comment) {
        if (data.comment.parentCommentId) {
          setCommentsList((prev) =>
            prev.map((c) =>
              c.id === data.comment.parentCommentId
                ? { ...c, replies: [...(c.replies ?? []), data.comment] }
                : c
            )
          );
        } else {
          setCommentsList((prev) => [...prev, { ...data.comment, replies: [] }]);
        }
        setCommentDraft("");
        const newComment = data.comment as CommentItem;
        // The in-feed drop list isn't updated for replies right now; the sheet shows latest state.
      }
    } finally {
      setCommentSubmitting(false);
    }
  }, [
    commentDraft,
    commentsDropId,
    commentsDropType,
    posts,
    videos,
    updatePost,
    updateVideo,
  ]);

  const handlePostCreated = React.useCallback((post: PostDrop) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  const handleVideoCreated = React.useCallback((video: VideoDrop) => {
    setVideos((prev) => [video, ...prev]);
  }, []);

  const hasPosts = posts.length > 0;

  return (
    <div className="min-h-[calc(100dvh-7rem)] w-full text-slate-200">
      <CreateDropModal
        open={createModalOpen}
        mode={createMode}
        onClose={() => setCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
        onVideoCreated={handleVideoCreated}
      />

      <CommentsSheet
        open={commentsDropId !== null}
        onClose={() => setCommentsDropId(null)}
        title="Comments"
        comments={commentsList}
        commentDraft={commentDraft}
        onDraftChange={setCommentDraft}
        onSubmit={handleCommentSubmit}
        submitting={commentSubmitting}
      />

      {dropsError && !dropsLoading && (
        <div className="mx-4 rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">
          {dropsError}
        </div>
      )}

      {!dropsError && feedTab === "posts" && (
        <section
          className={[
            "w-full",
            // Offset the fixed header/footer without showing the Drops dark background.
            "pt-[calc(56px+env(safe-area-inset-top))]",
            "pb-[calc(88px+env(safe-area-inset-bottom))]",
            "bg-white text-slate-900",
            "dark:bg-[#111827] dark:text-slate-200",
          ].join(" ")}
        >
          {!hasPosts ? (
            <div className="flex min-h-[calc(100dvh-12rem)] items-center justify-center py-12 text-center text-slate-500">
              No posts yet. Tap + to create one.
            </div>
          ) : (
            <div>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLikePost}
                  onComment={(id) => openComments(id, "post")}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {!dropsError && feedTab === "videos" && (
        <section className="w-full -my-4">
          <VideoDropstream
            videos={videos}
            onLike={handleLikeVideo}
            onComment={(id) => openComments(id, "video")}
            onExit={() => {
              setFeedTab("posts");
              window.dispatchEvent(
                new CustomEvent("drops-feed-tab", { detail: { tab: "posts" } })
              );
              window.dispatchEvent(
                new CustomEvent("drops-feed-tab-changed", {
                  detail: { tab: "posts" },
                })
              );
            }}
          />
        </section>
      )}
    </div>
  );
}
