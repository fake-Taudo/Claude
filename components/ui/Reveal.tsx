"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Verzögerung in Sekunden – für gestaffelte Listen */
  delay?: number;
  /** Startversatz nach unten in Pixeln */
  y?: number;
  className?: string;
};

/**
 * Blendet Inhalte sanft ein, sobald sie in den Viewport scrollen.
 * Respektiert automatisch "prefers-reduced-motion".
 */
export function Reveal({ children, delay = 0, y = 18, className }: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
