"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type FadeInProps = {
  children: ReactNode;
  className?: string;
  /** Délai en secondes. */
  delay?: number;
};

/**
 * Apparition discrète (150–250 ms) respectant prefers-reduced-motion.
 */
export function FadeIn({ children, className, delay = 0 }: FadeInProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
