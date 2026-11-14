"use client";
import { motion, type HTMLMotionProps } from "framer-motion";
import { VERDICTS, type Verdict } from "@/lib/types";

/** Fade-and-rise on scroll into view. Use for every landing/page section. */
export function Reveal({ delay = 0, ...props }: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    />
  );
}

/** Rubber-stamp style verdict badge. `stamp` animates it slamming in. */
export function VerdictBadge({ verdict, size = "md", stamp = false }: { verdict: Verdict; size?: "sm" | "md" | "lg"; stamp?: boolean }) {
  const v = VERDICTS[verdict];
  const cls = size === "lg" ? "px-5 py-2 text-base" : size === "sm" ? "px-2.5 py-0.5 text-[10px]" : "px-3.5 py-1 text-xs";
  return (
    <motion.span
      initial={stamp ? { scale: 2.2, opacity: 0, rotate: -14 } : false}
      animate={{ scale: 1, opacity: 1, rotate: stamp ? -4 : 0 }}
      transition={{ type: "spring", stiffness: 520, damping: 18, delay: stamp ? 0.15 : 0 }}
      className={`inline-flex items-center gap-1.5 rounded-md border-2 font-mono font-bold uppercase tracking-[0.14em] ${cls}`}
      style={{ color: v.color, borderColor: v.color, background: `color-mix(in srgb, ${v.color} 10%, transparent)` }}
    >
      {v.label}
    </motion.span>
  );
}

export function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub?: string }) {
  return (
    <Reveal className="mb-12 max-w-2xl">
      <p className="eyebrow mb-4">{eyebrow}</p>
      <h2 className="display text-5xl sm:text-6xl">{title}</h2>
      {sub && <p className="mt-5 text-lg text-mute">{sub}</p>}
    </Reveal>
  );
}
