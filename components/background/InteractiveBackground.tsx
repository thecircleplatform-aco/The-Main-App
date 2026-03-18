"use client";

import * as React from "react";
import "./gridBackground.css";
import { createRandomIcons, type IconObject } from "./iconObjects";
import { stepPhysics, type PointerForce } from "./physicsEngine";

type InteractiveBackgroundProps = {
  maxIcons?: number;
  hideGrid?: boolean;
};

export function InteractiveBackground({ maxIcons = 6, hideGrid = false }: InteractiveBackgroundProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const frameRef = React.useRef<number>();
  const lastTimeRef = React.useRef<number | null>(null);
   const lastPhysicsTimeRef = React.useRef<number | null>(null);
  const pointerRef = React.useRef<PointerForce | undefined>(undefined);
  const [icons, setIcons] = React.useState<IconObject[]>([]);
  const [viewport, setViewport] = React.useState({ width: 0, height: 0 });
  const [physicsEnabled, setPhysicsEnabled] = React.useState(true);
  const lastInteractionRef = React.useRef<number>(0);
  const dragState = React.useRef<{
    id: number | null;
    offsetX: number;
    offsetY: number;
  }>({ id: null, offsetX: 0, offsetY: 0 });

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setViewport({ width, height });

      // Avoid spawning icons until we have a valid layout size.
      if (!width || !height) {
        setIcons([]);
        return;
      }

      const prefersReducedMotion =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const lowConcurrency =
        typeof navigator !== "undefined" &&
        typeof navigator.hardwareConcurrency === "number" &&
        navigator.hardwareConcurrency <= 4;
      const smallScreen = width < 768;

      // On lower power / small devices, fall back to mostly-static icons.
      setPhysicsEnabled(!(prefersReducedMotion || lowConcurrency || smallScreen));

      // Reinitialize icon positions whenever the viewport changes so they
      // are distributed across the full screen using the latest dimensions.
      setIcons(createRandomIcons(maxIcons, width, height));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [maxIcons]);

  React.useEffect(() => {
    if (!viewport.width || !viewport.height || !physicsEnabled) return;

    let animationFrameId: number;

    const loop = (ts: number) => {
      const last = lastTimeRef.current ?? ts;
      const dtRaw = ts - last;
      lastTimeRef.current = ts;

      // Cap physics updates to ~30 FPS.
      const MIN_FRAME_MS = 1000 / 30;
      const lastPhysics = lastPhysicsTimeRef.current ?? ts;
      const sinceLastPhysics = ts - lastPhysics;

      if (sinceLastPhysics < MIN_FRAME_MS || document.visibilityState === "hidden") {
        animationFrameId = window.requestAnimationFrame(loop);
        frameRef.current = animationFrameId;
        return;
      }

      lastPhysicsTimeRef.current = ts;
      const dt = Math.min(dtRaw, 32);

      setIcons((current) => {
        if (!current.length) return current;
        const now = typeof performance !== "undefined" ? performance.now() : Date.now();
        const idleMs = now - (lastInteractionRef.current || now);
        const isIdle = idleMs > 3000;

        const next = stepPhysics(
          { width: viewport.width, height: viewport.height, icons: current },
          dt,
          pointerRef.current,
          isIdle
        ).icons;
        pointerRef.current = undefined;
        return next;
      });

      animationFrameId = window.requestAnimationFrame(loop);
      frameRef.current = animationFrameId;
    };

    animationFrameId = window.requestAnimationFrame(loop);
    frameRef.current = animationFrameId;

    return () => {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, [viewport.width, viewport.height]);

  const applyPointer = React.useCallback(
    (clientX: number, clientY: number, strength = 0.035) => {
      if (!viewport.width || !viewport.height || !physicsEnabled) return;
      const rect = containerRef.current?.getBoundingClientRect();
      const x = rect ? clientX - rect.left : clientX;
      const y = rect ? clientY - rect.top : clientY;
      lastInteractionRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();
      pointerRef.current = {
        x,
        y,
        radius: Math.max(viewport.width, viewport.height) * 0.25,
        strength,
      };
    },
    [viewport.width, viewport.height, physicsEnabled]
  );

  const findIconAt = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const x = rect ? clientX - rect.left : clientX;
    const y = rect ? clientY - rect.top : clientY;
    for (let i = icons.length - 1; i >= 0; i--) {
      const icon = icons[i];
      const dx = x - icon.x;
      const dy = y - icon.y;
      if (dx * dx + dy * dy <= icon.radius * icon.radius) {
        return { icon, x, y };
      }
    }
    return null;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!physicsEnabled) return;
    if (dragState.current.id != null) {
      const rect = containerRef.current?.getBoundingClientRect();
      const x = rect ? event.clientX - rect.left : event.clientX;
      const y = rect ? event.clientY - rect.top : event.clientY;
      const id = dragState.current.id;

      setIcons((current) =>
        current.map((icon) =>
          icon.id === id
            ? {
                ...icon,
                x: x - dragState.current.offsetX,
                y: y - dragState.current.offsetY,
                vx: 0,
                vy: 0,
              }
            : icon
        )
      );
      return;
    }

    if (event.buttons === 1 || event.pointerType === "mouse") {
      applyPointer(event.clientX, event.clientY, 0.015);
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!physicsEnabled) return;
    if (event.button !== 0) return;
    const hit = findIconAt(event.clientX, event.clientY);
    if (!hit) {
      applyPointer(event.clientX, event.clientY, 0.04);
      return;
    }
    // Give a small impulse on click so icons feel responsive
    applyPointer(event.clientX, event.clientY, 0.06);
    dragState.current = {
      id: hit.icon.id,
      offsetX: hit.x - hit.icon.x,
      offsetY: hit.y - hit.icon.y,
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!physicsEnabled) return;
    if (dragState.current.id == null) return;
    const rect = containerRef.current?.getBoundingClientRect();
    const x = rect ? event.clientX - rect.left : event.clientX;
    const y = rect ? event.clientY - rect.top : event.clientY;

    setIcons((current) =>
      current.map((icon) =>
        icon.id === dragState.current.id
          ? {
              ...icon,
              vx: (x - icon.x) * 0.01,
              vy: (y - icon.y) * 0.01,
            }
          : icon
      )
    );

    dragState.current = { id: null, offsetX: 0, offsetY: 0 };
    try {
      (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <>
      {!hideGrid && <div className="interactive-grid-bg" aria-hidden="true" />}
      <div
        ref={containerRef}
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: 0 }}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="relative h-full w-full">
          {icons.map((icon) => (
            <div
              key={icon.id}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                transform: `translate3d(${icon.x}px, ${icon.y}px, 0) translate3d(-50%, -50%, 0) rotate(${icon.rotation}rad)`,
                transition: "transform 0.06s ease-out",
                opacity: icon.opacity,
              }}
              className="pointer-events-none"
            >
              <div className="pointer-events-auto interactive-bg-icon">
                <IconVisual kind={icon.kind} size={icon.radius * 2} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

type IconVisualProps = {
  kind: IconObject["kind"];
  size: number;
};

function IconVisual({ kind, size }: IconVisualProps) {
  const gradientId = React.useId();
  const glowId = React.useId();

  const palette =
    kind === "circle" || kind === "node"
      ? ["#38bdf8", "#a855f7", "#22c55e"]
      : ["#6366f1", "#22c55e", "#f97316"];

  const [primary, secondary, accent] = palette;
  const strokeWidth = 1.4;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primary} stopOpacity="0.85" />
          <stop offset="50%" stopColor={secondary} stopOpacity="0.85" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.75" />
        </linearGradient>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="0 0 0 0 0.45  0 0 0 0 0.78  0 0 0 0 1  0 0 0 0.8 0"
          />
        </filter>
      </defs>
      <g fill="none" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {/* soft outer glow */}
        <g
          stroke={`url(#${gradientId})`}
          filter={`url(#${glowId})`}
          opacity={0.8}
        >
          {kind === "circle" && <circle cx="50" cy="50" r="26" />}
          {kind === "triangle" && <path d="M50 22 L76 72 H24 Z" />}
          {kind === "square" && <rect x="26" y="26" width="48" height="48" rx="8" />}
          {kind === "node" && (
            <>
              <circle cx="30" cy="32" r="6" />
              <circle cx="72" cy="36" r="6" />
              <circle cx="42" cy="70" r="7" />
              <circle cx="68" cy="68" r="5" />
              <path d="M36 36 L66 38" />
              <path d="M34 38 L40 64" />
              <path d="M70 42 L69 62" />
              <path d="M46 70 L63 68" />
            </>
          )}
        </g>

        {/* crisp inner stroke */}
        <g stroke={`url(#${gradientId})`} opacity={0.9}>
        {kind === "circle" && <circle cx="50" cy="50" r="26" />}
        {kind === "triangle" && (
          <path d="M50 22 L76 72 H24 Z" />
        )}
        {kind === "square" && <rect x="26" y="26" width="48" height="48" rx="8" />}
        {kind === "node" && (
          <>
            <circle cx="30" cy="32" r="6" />
            <circle cx="72" cy="36" r="6" />
            <circle cx="42" cy="70" r="7" />
            <circle cx="68" cy="68" r="5" />
            <path d="M36 36 L66 38" />
            <path d="M34 38 L40 64" />
            <path d="M70 42 L69 62" />
            <path d="M46 70 L63 68" />
          </>
        )}
        </g>
      </g>
    </svg>
  );
}
