"use client";

import * as React from "react";
import {
  Heart,
  MessageCircle,
  Play,
  Share2,
  ArrowLeft,
  MoreHorizontal,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type VideoDrop = {
  id: string;
  type: "video";
  userName: string;
  userAvatar: string;
  circleName: string;
  circleSlug: string;
  videoUrl: string;
  caption?: string;
  durationSeconds: number;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  comments: { id: string; author: string; text: string; createdAt: string }[];
};

type Props = {
  videos: VideoDrop[];
  onLike: (id: string) => void;
  onComment: (id: string) => void;
  onShare?: (id: string) => void;
  onExit?: () => void;
};

export function VideoDropstream({
  videos,
  onLike,
  onComment,
  onShare,
  onExit,
}: Props) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [overlayVisible, setOverlayVisible] = React.useState(true);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [menuAnchor, setMenuAnchor] = React.useState<"top" | "bottom">("top");
  const [captionExpanded, setCaptionExpanded] = React.useState(false);
  const [heartBurst, setHeartBurst] = React.useState<null | { id: string; key: number }>(null);
  const transitioningRef = React.useRef(false);

  const activeVideo = videos[activeIndex];
  const activeVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const prevVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const nextVideoRef = React.useRef<HTMLVideoElement | null>(null);

  const overlayHideTimer = React.useRef<number | null>(null);
  const tapTimer = React.useRef<number | null>(null);
  const lastTapAt = React.useRef<number>(0);
  const longPressTimer = React.useRef<number | null>(null);
  const pointerDownAt = React.useRef<{ x: number; y: number; t: number } | null>(null);
  const didLongPressRef = React.useRef(false);

  const swipe = React.useRef({
    dragging: false,
    startY: 0,
    deltaY: 0,
    animating: false,
  });
  const [swipeDeltaY, setSwipeDeltaY] = React.useState(0);

  const clampIndex = React.useCallback(
    (i: number) => Math.max(0, Math.min(videos.length - 1, i)),
    [videos.length]
  );

  const showOverlayTemporarily = React.useCallback((force = false) => {
    if (overlayHideTimer.current) window.clearTimeout(overlayHideTimer.current);
    setOverlayVisible(true);
    if (!force) {
      overlayHideTimer.current = window.setTimeout(() => {
        setOverlayVisible(false);
      }, 2500);
    }
  }, []);

  const pause = React.useCallback(() => {
    const v = activeVideoRef.current;
    if (!v) return;
    v.pause();
    setIsPaused(true);
    showOverlayTemporarily();
  }, [showOverlayTemporarily]);

  const play = React.useCallback(() => {
    const v = activeVideoRef.current;
    if (!v) return;
    v.play().catch(() => {});
    setIsPaused(false);
    showOverlayTemporarily();
  }, [showOverlayTemporarily]);

  const togglePlayPause = React.useCallback(() => {
    const v = activeVideoRef.current;
    if (!v) return;
    if (v.paused) play();
    else pause();
  }, [pause, play]);

  const goTo = React.useCallback(
    (nextIndex: number) => {
      if (transitioningRef.current) return;
      const clamped = clampIndex(nextIndex);
      if (clamped === activeIndex) return;
      transitioningRef.current = true;
      setMenuOpen(false);
      setCaptionExpanded(false);
      setOverlayVisible(true);
      setProgress(0);
      setSwipeDeltaY(0);
      setActiveIndex(clamped);
      window.setTimeout(() => {
        transitioningRef.current = false;
      }, 260);
    },
    [activeIndex, clampIndex]
  );

  const goNext = React.useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = React.useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  React.useEffect(() => {
    // Auto play active, pause others, keep mute in sync.
    const active = activeVideoRef.current;
    const prev = prevVideoRef.current;
    const next = nextVideoRef.current;
    if (prev) {
      prev.pause();
      prev.currentTime = 0;
    }
    if (next) {
      next.pause();
      next.currentTime = 0;
    }
    if (active) {
      active.muted = muted;
      active.play().catch(() => {});
      setIsPaused(false);
      showOverlayTemporarily();
    }
  }, [activeIndex, muted, showOverlayTemporarily]);

  React.useEffect(() => {
    const v = activeVideoRef.current;
    if (!v) return;
    setProgress(0);
    const onTimeUpdate = () => {
      if (v.duration && Number.isFinite(v.duration)) {
        setProgress((v.currentTime / v.duration) * 100);
      }
    };
    const onEnded = () => {
      if (activeIndex < videos.length - 1) goNext();
      else pause();
    };
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("ended", onEnded);
    };
  }, [activeIndex, goNext, pause, videos.length]);

  React.useEffect(() => {
    return () => {
      if (overlayHideTimer.current) window.clearTimeout(overlayHideTimer.current);
      if (tapTimer.current) window.clearTimeout(tapTimer.current);
      if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    };
  }, []);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (el as HTMLElement | null)?.isContentEditable) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
        showOverlayTemporarily(true);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
        showOverlayTemporarily(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, showOverlayTemporarily]);

  const commitLike = React.useCallback(() => {
    if (!activeVideo) return;
    if (!activeVideo.isLiked) onLike(activeVideo.id);
    setHeartBurst({ id: activeVideo.id, key: Date.now() });
  }, [activeVideo, onLike]);

  const isInteractiveTarget = React.useCallback((t: EventTarget | null) => {
    const el = t as HTMLElement | null;
    if (!el) return false;
    return !!el.closest(
      'button,a,input,textarea,select,summary,[role="button"],[role="menuitem"],[data-interactive="true"]'
    );
  }, []);

  const onPointerDown = React.useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Allow taps on UI controls; don't capture pointer for swipe.
    if (isInteractiveTarget(e.target)) {
      showOverlayTemporarily();
      return;
    }
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    swipe.current.dragging = true;
    swipe.current.startY = e.clientY;
    swipe.current.deltaY = 0;
    setSwipeDeltaY(0);

    pointerDownAt.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    didLongPressRef.current = false;
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      didLongPressRef.current = true;
      const v = activeVideoRef.current;
      if (v && !v.paused) v.playbackRate = 0.5;
    }, 380);

    showOverlayTemporarily();
  }, [isInteractiveTarget, showOverlayTemporarily]);

  const onPointerMove = React.useCallback((e: React.PointerEvent) => {
    if (!swipe.current.dragging) return;
    const dy = e.clientY - swipe.current.startY;
    swipe.current.deltaY = dy;
    setSwipeDeltaY(dy);
  }, []);

  const endPointer = React.useCallback(() => {
    const v = activeVideoRef.current;
    if (v) v.playbackRate = 1;
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;

    const dy = swipe.current.deltaY;
    swipe.current.dragging = false;

    const absDy = Math.abs(dy);
    const threshold = Math.min(140, window.innerHeight * 0.16);
    if (absDy > threshold) {
      if (dy < 0) goNext();
      else goPrev();
    } else {
      setSwipeDeltaY(0);
    }
  }, [goNext, goPrev]);

  const onPointerUp = React.useCallback(() => {
    const downAt = pointerDownAt.current;
    const pressMs = downAt ? Date.now() - downAt.t : 0;
    pointerDownAt.current = null;
    endPointer();

    // Tap handling (ignore if it was a swipe)
    const absDy = Math.abs(swipe.current.deltaY);
    if (absDy > 12) return;

    // Holding your finger shouldn't pause; only a quick tap toggles play/pause.
    if (didLongPressRef.current || pressMs > 320) {
      showOverlayTemporarily();
      return;
    }

    const now = Date.now();
    const isDouble = now - lastTapAt.current < 260;
    lastTapAt.current = now;

    if (tapTimer.current) window.clearTimeout(tapTimer.current);
    if (isDouble) {
      commitLike();
      return;
    }

    tapTimer.current = window.setTimeout(() => {
      // Mobile-first: if overlays are hidden, first tap reveals UI.
      if (!overlayVisible) {
        showOverlayTemporarily();
        return;
      }
      togglePlayPause();
    }, 220);
  }, [commitLike, endPointer, overlayVisible, showOverlayTemporarily, togglePlayPause]);

  const onPointerCancel = React.useCallback(() => {
    pointerDownAt.current = null;
    endPointer();
  }, [endPointer]);

  const onWheel = React.useCallback((e: React.WheelEvent) => {
    if (transitioningRef.current) return;
    if (Math.abs(e.deltaY) < 18) return;
    if (e.deltaY > 0) goNext();
    else goPrev();
  }, [goNext, goPrev]);

  const copyLink = React.useCallback(async () => {
    const url = `${window.location.origin}/drops?video=${encodeURIComponent(activeVideo.id)}`;
    await navigator.clipboard.writeText(url);
  }, [activeVideo?.id]);

  const share = React.useCallback(async () => {
    const url = `${window.location.origin}/drops?video=${encodeURIComponent(activeVideo.id)}`;
    const text = `${activeVideo.userName} in ${activeVideo.circleName}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Drop", text, url });
        return;
      } catch {
        // ignore
      }
    }
    await navigator.clipboard.writeText(url);
    onShare?.(activeVideo.id);
  }, [activeVideo, onShare]);

  const onSeek = React.useCallback((pct: number) => {
    const v = activeVideoRef.current;
    if (!v || !v.duration || !Number.isFinite(v.duration)) return;
    v.currentTime = (pct / 100) * v.duration;
    setProgress(pct);
  }, []);

  const viewportHeight = "100dvh";
  const translateY = swipeDeltaY;

  if (videos.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        No videos yet. Tap + to upload one.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[55] select-none",
        "bg-[#f5f7fb] text-slate-900",
        "dark:bg-[#0b0f19] dark:text-white"
      )}
      style={{ height: viewportHeight, touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onWheel={onWheel}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translate3d(0, ${translateY}px, 0)`,
          transition: swipe.current.dragging ? "none" : "transform 220ms ease",
        }}
      >
        {/* Previous */}
        {activeIndex > 0 && (
          <div
            className="absolute inset-0"
            style={{ transform: "translate3d(0, -100%, 0)" }}
          >
            <video
              ref={(el) => {
                prevVideoRef.current = el;
              }}
              src={videos[activeIndex - 1].videoUrl}
              className="h-full w-full object-cover"
              muted
              playsInline
              preload="auto"
            />
          </div>
        )}

        {/* Current */}
        <div className="absolute inset-0">
          <video
            ref={(el) => {
              activeVideoRef.current = el;
            }}
            src={activeVideo.videoUrl}
            className="h-full w-full object-cover"
            muted={muted}
            playsInline
            disablePictureInPicture
            controls={false}
            preload="auto"
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              if (v.duration > 60) v.currentTime = 0;
            }}
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-0",
              "bg-gradient-to-t from-black/60 via-black/10 to-black/35",
              "dark:from-black/70 dark:via-black/10 dark:to-black/45"
            )}
          />

          {isPaused && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="rounded-full bg-black/45 p-4 text-white backdrop-blur">
                <Play className="h-7 w-7 fill-white text-white" />
              </div>
            </div>
          )}

          {/* Heart burst */}
          {heartBurst?.id === activeVideo.id && (
            <div
              key={heartBurst.key}
              className="pointer-events-none absolute inset-0 grid place-items-center"
            >
              <div className="video-like-burst">
                <Heart className="video-like-heart h-16 w-16 fill-pink-500 text-pink-500 drop-shadow" />
                <div className="video-like-particle p1" />
                <div className="video-like-particle p2" />
                <div className="video-like-particle p3" />
                <div className="video-like-particle p4" />
                <div className="video-like-particle p5" />
                <div className="video-like-particle p6" />
              </div>
            </div>
          )}

          {/* Overlays */}
          <div
            className={cn(
              "absolute inset-0",
              overlayVisible ? "opacity-100" : "opacity-0",
              "transition-opacity duration-200"
            )}
          >
            {/* Top bar */}
            <div
              className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-3"
              style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onExit?.();
                }}
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-full",
                  "bg-black/45 text-white backdrop-blur",
                  "hover:bg-black/60 active:bg-black/70"
                )}
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuAnchor("top");
                    setMenuOpen((v) => !v);
                    showOverlayTemporarily(true);
                  }}
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-full",
                    "bg-black/45 text-white backdrop-blur",
                    "hover:bg-black/60 active:bg-black/70"
                  )}
                  aria-label="Options"
                  aria-expanded={menuOpen}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>

                {menuAnchor === "top" && menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-white/10 bg-black/85 text-white shadow-xl backdrop-blur">
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-xs hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMuted((m) => !m);
                        setMenuOpen(false);
                        showOverlayTemporarily(true);
                      }}
                    >
                      <span className="inline-flex items-center gap-2">
                        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        {muted ? "Unmute" : "Mute"}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-xs hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyLink().catch(() => {});
                        setMenuOpen(false);
                        showOverlayTemporarily(true);
                      }}
                    >
                      Copy link
                    </button>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-xs hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        showOverlayTemporarily(true);
                        // Placeholder for report
                      }}
                    >
                      Report
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right action bar */}
            <div
              className="absolute z-30"
              style={{
                right: "max(6px, env(safe-area-inset-right))",
                // Keep it in the corner, but above the seek bar + safe-area.
                bottom: "max(86px, calc(env(safe-area-inset-bottom) + 86px))",
              }}
            >
              <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-black/20 p-1.5 backdrop-blur-md">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike(activeVideo.id);
                    showOverlayTemporarily(true);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-transform active:scale-95",
                    activeVideo.isLiked ? "text-pink-400" : "text-white"
                  )}
                  aria-label="Like"
                >
                  <Heart className={cn("h-6 w-6", activeVideo.isLiked ? "fill-current" : "")} />
                  <span className="text-[11px] font-semibold leading-none">
                    {activeVideo.likes > 0 ? activeVideo.likes : ""}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onComment(activeVideo.id);
                    showOverlayTemporarily(true);
                  }}
                  className="flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-white transition-transform active:scale-95"
                  aria-label="Comments"
                >
                  <MessageCircle className="h-6 w-6" />
                  <span className="text-[11px] font-semibold leading-none">
                    {activeVideo.comments.length > 0 ? activeVideo.comments.length : ""}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    share().catch(() => {});
                    showOverlayTemporarily(true);
                  }}
                  className="flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-white transition-transform active:scale-95"
                  aria-label="Share"
                >
                  <Share2 className="h-6 w-6" />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuAnchor("bottom");
                      setMenuOpen((v) => !v);
                      showOverlayTemporarily(true);
                    }}
                    className="flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-white/95 transition-transform active:scale-95"
                    aria-label="More options"
                    aria-expanded={menuOpen}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>

                  {menuAnchor === "bottom" && menuOpen && (
                    <div className="absolute bottom-full right-0 mb-2 w-44 overflow-hidden rounded-xl border border-white/10 bg-black/85 text-white shadow-xl backdrop-blur">
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left text-xs hover:bg-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMuted((m) => !m);
                          setMenuOpen(false);
                          showOverlayTemporarily(true);
                        }}
                      >
                        <span className="inline-flex items-center gap-2">
                          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                          {muted ? "Unmute" : "Mute"}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left text-xs hover:bg-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyLink().catch(() => {});
                          setMenuOpen(false);
                          showOverlayTemporarily(true);
                        }}
                      >
                        Copy link
                      </button>
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left text-xs hover:bg-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                          showOverlayTemporarily(true);
                          // Placeholder for report
                        }}
                      >
                        Report
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom left meta */}
            <div
              className="absolute bottom-0 left-0 right-0 z-30 flex items-end justify-between gap-4 p-4"
              style={{ paddingBottom: "max(18px, env(safe-area-inset-bottom))" }}
            >
              <div className="max-w-[72%] text-white">
                <div className="text-sm font-semibold">@{activeVideo.userName}</div>
                <div className="text-xs text-white/80">{activeVideo.circleName}</div>
                {activeVideo.caption && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCaptionExpanded((v) => !v);
                      showOverlayTemporarily(true);
                    }}
                    className={cn(
                      "mt-2 text-left text-sm text-white/95",
                      captionExpanded ? "" : "line-clamp-3"
                    )}
                    aria-label="Toggle caption"
                  >
                    {activeVideo.caption}
                  </button>
                )}
              </div>
            </div>

            {/* Progress + seek */}
            <div
              className="absolute bottom-0 left-0 right-0 z-40 px-0"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <input
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => onSeek(Number(e.target.value))}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  showOverlayTemporarily(true);
                }}
                className="video-seek w-full"
                style={{ ["--seek-pct" as any]: `${progress}%` }}
                aria-label="Seek"
              />
            </div>

            {/* Swipe hints removed */}
          </div>
        </div>

        {/* Next */}
        {activeIndex < videos.length - 1 && (
          <div
            className="absolute inset-0"
            style={{ transform: "translate3d(0, 100%, 0)" }}
          >
            <video
              ref={(el) => {
                nextVideoRef.current = el;
              }}
              src={videos[activeIndex + 1].videoUrl}
              className="h-full w-full object-cover"
              muted
              playsInline
              preload="auto"
            />
          </div>
        )}
      </div>
    </div>
  );
}
