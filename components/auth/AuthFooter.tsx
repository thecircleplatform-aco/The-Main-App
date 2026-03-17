"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Footer for auth pages: sign-in options logos (Google, GitHub, ACO) and
 * "Secured by ACO Ghosts" — right-click to see spooky animation and explanation.
 */
export function AuthFooter() {
  const [showGhostModal, setShowGhostModal] = React.useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowGhostModal(true);
  };

  return (
    <>
      <footer id="auth-footer" className="mt-8 flex flex-col items-center gap-4 border-t border-gray-200/80 pt-6 dark:border-white/10">
        <div className="flex items-center justify-center gap-4">
          <Image src="/google.svg" alt="Google" width={24} height={24} className="h-6 w-6 opacity-80 dark:opacity-90" />
          <Image src="/github.svg" alt="GitHub" width={24} height={24} className="h-6 w-6 opacity-80 dark:invert dark:opacity-90" />
          <Image src="/aco-logo.svg" alt="ACO" width={24} height={24} className="h-6 w-6" />
        </div>
        <button
          type="button"
          onContextMenu={handleContextMenu}
          className="flex cursor-context-menu items-center justify-center gap-2 rounded-xl px-2 py-1 text-center transition hover:bg-gray-100/80 dark:hover:bg-white/5"
          title="Right-click to learn more"
        >
          <Image src="/aco-ghosts.svg" alt="ACO Ghosts" width={20} height={20} className="h-5 w-5 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-600 dark:text-white/70">
            Secured by ACO Ghosts
          </span>
        </button>
        <p className="text-[11px] text-gray-500 dark:text-white/50 text-center max-w-[260px]">
          ACO Ghosts is the official security system of ACO.
        </p>
      </footer>

      <AnimatePresence>
        {showGhostModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowGhostModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-sm rounded-3xl border border-violet-200/50 bg-gray-900/95 p-6 shadow-2xl dark:border-white/20"
            >
              {/* Floating ghost decorations */}
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="pointer-events-none absolute"
                  style={{
                    left: `${15 + i * 18}%`,
                    top: `${10 + (i % 3) * 25}%`,
                  }}
                  animate={{
                    y: [0, -8, 0],
                    opacity: [0.4, 0.8, 0.4],
                  }}
                  transition={{
                    duration: 2 + i * 0.3,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                >
                  <Image src="/aco-ghosts.svg" alt="" width={28} height={28} className="h-7 w-7" />
                </motion.div>
              ))}

              <div className="relative text-center">
                <motion.div
                  animate={{ rotate: [0, -3, 3, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="mb-4 inline-block"
                >
                  <Image src="/aco-ghosts.svg" alt="ACO Ghosts" width={48} height={48} className="h-12 w-12 mx-auto" />
                </motion.div>
                <h3 className="text-lg font-semibold text-white">ACO Ghosts</h3>
                <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                  The official security system of ACO. Ghosts watch over sign-in and account safety,
                  detect suspicious activity, and help keep the platform secure for everyone.
                </p>
                <p className="mt-3 text-xs text-gray-500">
                  Right-click &quot;Secured by ACO Ghosts&quot; anytime to see this.
                </p>
                <button
                  type="button"
                  onClick={() => setShowGhostModal(false)}
                  className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
