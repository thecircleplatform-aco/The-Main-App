"use client";

import * as React from "react";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type PostDrop = {
  id: string;
  type: "post";
  userName: string;
  userAvatar: string;
  circleName: string;
  circleSlug: string;
  text?: string;
  imageUrl?: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  comments: { id: string; author: string; text: string; createdAt: string }[];
};

type Props = {
  post: PostDrop;
  onLike: (id: string) => void;
  onComment: (id: string) => void;
  onShare?: (id: string) => void;
  onSave?: (id: string) => void;
};

export function PostCard({
  post,
  onLike,
  onComment,
  onShare,
  onSave,
}: Props) {
  return (
    <article
      className={cn(
        "w-full rounded-none px-0 py-4",
        // Subtle divider between posts; disappears on last card.
        "border-b border-slate-200/60 bg-white text-slate-900 last:border-b-0",
        "dark:border-white/10 dark:bg-[#111827] dark:text-slate-200"
      )}
    >
      {/* Top: avatar, username, circle, timestamp */}
      <header className="mb-3 flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
            "bg-slate-200 text-slate-700",
            "dark:bg-slate-700 dark:text-white"
          )}
          aria-hidden
        >
          {post.userAvatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-semibold text-slate-900 dark:text-white">
              {post.userName}
            </span>
            <span className="text-xs text-slate-500">{post.createdAt}</span>
          </div>
          <Link
            href={`/circles/${encodeURIComponent(post.circleSlug)}`}
            className="text-xs font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
          >
            {post.circleName}
          </Link>
        </div>
      </header>

      {/* Content: text + optional image */}
      {post.text && (
        <p className="mb-3 text-[15px] leading-snug text-slate-900 dark:text-slate-100">
          {post.text}
        </p>
      )}
      {post.imageUrl && (
        <div className="mb-3 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt="Post"
            className="w-full object-cover"
          />
        </div>
      )}

      {/* Bottom: like, comment, share, save */}
      <footer className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onLike(post.id)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium transition-colors",
            post.isLiked
              ? "text-pink-500 dark:text-pink-400"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          <Heart
            className={cn("h-4 w-4", post.isLiked ? "fill-current" : "")}
          />
          <span>{post.likes > 0 ? post.likes : "Like"}</span>
        </button>
        <button
          type="button"
          onClick={() => onComment(post.id)}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{post.comments.length > 0 ? post.comments.length : "Comment"}</span>
        </button>
        <button
          type="button"
          onClick={() => onShare?.(post.id)}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </button>
        <button
          type="button"
          onClick={() => onSave?.(post.id)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <Bookmark className="h-4 w-4" />
          <span>Save</span>
        </button>
      </footer>
    </article>
  );
}
