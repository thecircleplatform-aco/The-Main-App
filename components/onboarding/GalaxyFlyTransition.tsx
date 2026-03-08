"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GalaxyBackground } from "./GalaxyBackground";

function useWarpSound() {
  const playedRef = React.useRef(false);

  React.useEffect(() => {
    if (playedRef.current) return;
    playedRef.current = true;

    try {
      const Ctx = typeof window !== "undefined" && window.AudioContext ? window.AudioContext : null;
      if (!Ctx) return;
      const ctx = new Ctx();
      const play = () => {
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.8);

        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);
        osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 1.2);
        osc.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 1.8);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(2000, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(8000, ctx.currentTime + 0.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.8);
      };

      if (ctx.state === "suspended") ctx.resume().then(play);
      else play();

      return () => {
        ctx.close();
      };
    } catch {
      // Silently fail if Web Audio isn't supported
    }
  }, []);
}

type GalaxyFlyTransitionProps = {
  active: boolean;
  onComplete: () => void;
  children: React.ReactNode;
};

export function GalaxyFlyTransition({
  active,
  onComplete,
  children,
}: GalaxyFlyTransitionProps) {
  useWarpSound();

  React.useEffect(() => {
    if (!active) return;
    const t = setTimeout(onComplete, 2400);
    return () => clearTimeout(t);
  }, [active, onComplete]);

  return (
    <>
      {children}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <GalaxyBackground warp />
            {/* Warp lines effect */}
            <motion.div
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute left-1/2 top-1/2 h-px w-1/2 origin-left -translate-y-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  style={{ transform: `rotate(${i * 30}deg)` }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: [0, 2], opacity: [0, 0.6, 0] }}
                  transition={{ duration: 2, delay: 0.1 + i * 0.02 }}
                />
              ))}
            </motion.div>
            <motion.p
              className="relative z-10 text-lg font-medium text-white/90"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Entering Circle…
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
