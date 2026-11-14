"use client";
import { motion, type HTMLMotionProps } from "framer-motion";
import { VERDICTS, type Verdict } from "@/lib/types";

/** Impeccable: "one authored moment, no section fades". Kept as a plain wrapper so call sites stay unchanged. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Reveal({ delay = 0, initial, whileInView, viewport, transition, ...props }: HTMLMotionProps<"div"> & { delay?: number }) {
  return <motion.div {...props} />;
}

/** Verdict colour is reserved for the evidence label. */
export function VerdictBadge({ verdict, size = "md", stamp: _stamp = false }: { verdict: Verdict; size?: "sm" | "md" | "lg"; stamp?: boolean }) {
  void _stamp;
  const v = VERDICTS[verdict];
  const cls = size === "lg" ? "px-5 py-2 text-base" : size === "sm" ? "px-2.5 py-0.5 text-base" : "px-3.5 py-1 text-base";
  return (
    <motion.span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${cls}`}
      style={{ color: v.color, borderColor: `color-mix(in srgb, ${v.color} 35%, transparent)`, background: `color-mix(in srgb, ${v.color} 10%, transparent)` }}
    >
      {v.label}
    </motion.span>
  );
}

/** Section heading. `eyebrow` is accepted for compatibility but not rendered (labels above headings are banned). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SectionTitle({ eyebrow, title, sub }: { eyebrow?: string; title: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-10 max-w-3xl">
      <h2 className="display text-4xl sm:text-6xl">{title}</h2>
      {sub && <p className="mt-4 max-w-[65ch] text-lg font-medium text-ink/80">{sub}</p>}
    </div>
  );
}
