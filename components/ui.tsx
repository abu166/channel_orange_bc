"use client";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Check, CircleDashed, CircleHelp, TriangleAlert, X } from "lucide-react";
import { VERDICTS, type Verdict } from "@/lib/types";

/** Impeccable: "one authored moment, no section fades". Kept as a plain wrapper so call sites stay unchanged. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Reveal({ delay = 0, initial, whileInView, viewport, transition, ...props }: HTMLMotionProps<"div"> & { delay?: number }) {
  return <motion.div {...props} />;
}

/** Verdict colour is reserved for the evidence label. */
const VERDICT_ICON: Record<Verdict, typeof Check> = { supported: Check, partially_supported: CircleDashed, insufficient_evidence: CircleHelp, misleading: TriangleAlert, contradicted: X };

/** Verdict label: tinted fill, strong text and an icon, so meaning never depends on colour alone. */
export function VerdictBadge({ verdict, size = "md", stamp: _stamp = false }: { verdict: Verdict; size?: "sm" | "md" | "lg"; stamp?: boolean }) {
  void _stamp;
  const v = VERDICTS[verdict];
  const Icon = VERDICT_ICON[verdict];
  const cls = size === "lg" ? "px-4 py-3 text-lg gap-2" : size === "sm" ? "px-2 py-1 text-base gap-1" : "px-3 py-2 text-base gap-1.5";
  return (
    <span
      className={`inline-flex items-center rounded-md font-semibold ${cls}`}
      style={{ color: v.color, background: `color-mix(in srgb, ${v.color} 13%, white)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${v.color} 28%, transparent)` }}
    >
      <Icon size={size === "lg" ? 22 : 18} strokeWidth={2.4} aria-hidden="true" />
      {v.label}
    </span>
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
