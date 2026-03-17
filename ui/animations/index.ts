import type { Transition, Variants } from "framer-motion";

export const softSpring: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 26,
  mass: 0.8,
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export const panelFade: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export const avatarPulse: Variants = {
  rest: { scale: 1, opacity: 0.9 },
  pulse: {
    scale: 1.06,
    opacity: 1,
    transition: {
      duration: 1.8,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
    },
  },
};

export const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      mass: 0.8,
      staggerChildren: 0.05,
    },
  },
};

export const cardHover = {
  rest: { y: 0, boxShadow: "0 0 0 0 rgba(255,255,255,0)", borderColor: "rgba(255,255,255,0.1)" },
  hover: {
    y: -4,
    boxShadow: "0 12px 40px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.15)",
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

export const barGrow: Variants = {
  hidden: { scaleX: 0, originX: 0 },
  visible: (delay: number) => ({
    scaleX: 1,
    originX: 0,
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};
