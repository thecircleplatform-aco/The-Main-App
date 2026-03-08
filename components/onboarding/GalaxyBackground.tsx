"use client";

import * as React from "react";
import { motion } from "framer-motion";
import "@/styles/galaxy.css";
import { cn } from "@/lib/utils";

type GalaxyBackgroundProps = {
  className?: string;
  warp?: boolean;
};

const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  delay: Math.random() * 2,
  duration: 2 + Math.random() * 2,
}));

export function GalaxyBackground({ className, warp = false }: GalaxyBackgroundProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 overflow-hidden",
        warp ? "bg-galaxy-warp" : "bg-galaxy",
        className
      )}
    >
      {/* Star field */}
      <div className="absolute inset-0">
        {STARS.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              boxShadow: "0 0 4px 1px rgba(255,255,255,0.6)",
            }}
            animate={
              warp
                ? {
                    scale: [0.3, 3],
                    opacity: [0, 0.9, 0],
                  }
                : {
                    opacity: [0.5, 1, 0.5],
                  }
            }
            transition={{
              duration: warp ? 2.2 : star.duration,
              delay: warp ? 0 : star.delay,
              repeat: warp ? 0 : Infinity,
            }}
          />
        ))}
      </div>

      {/* Central nebula glow */}
      {warp && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="h-64 w-64 rounded-full bg-violet-500/40 blur-[80px]"
            animate={{ scale: [1, 2, 3], opacity: [0.6, 0.4, 0] }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
        </motion.div>
      )}
    </div>
  );
}
