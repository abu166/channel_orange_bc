"use client";
/**
 * A realistic Reel mock that VetoHealth "checks": the post plays, the claim gets highlighted in the
 * caption, then a verdict sheet slides up. Verdicts and bottom lines are copied from our live test run
 * (docs/EVAL.md), labelled as such. Illustrations are drawn inline as SVG.
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Bookmark, Heart, MessageCircle, Music2, Send } from "lucide-react";
import { VERDICTS, type Verdict } from "@/lib/types";

type Art = "celery" | "collagen" | "citrus";
interface Post { art: Art; bg: string; handle: string; initials: string; hit: string; rest: string; tags: string; claim: string; verdict: Verdict; line: string; studies: number; likes: string; comments: string }

const POSTS: Post[] = [
  { art: "celery", bg: "#dfe9d6", handle: "glow.with.jess", initials: "GJ", hit: "Celery juice cured my eczema in 7 days", rest: " and it can heal yours too", tags: "#guthealth #detox", claim: "Celery juice cures eczema.", verdict: "misleading", line: "Overhyped: the research doesn't back “cures”.", studies: 9, likes: "48.2K", comments: "1,204" },
  { art: "collagen", bg: "#efdcd8", handle: "drskinfacts", initials: "DS", hit: "Collagen peptides improve skin elasticity", rest: ". Here's what the trials show", tags: "#skincare #antiaging", claim: "Collagen supplements improve skin elasticity.", verdict: "partially_supported", line: "Partly true: some human studies agree, but the effect is smaller than claimed.", studies: 10, likes: "12.9K", comments: "386" },
  { art: "citrus", bg: "#f6e1c8", handle: "biohack.bro", initials: "BB", hit: "Vitamin C prevents colds", rest: ". Megadose daily, never get sick", tags: "#immunity #biohacking", claim: "Vitamin C prevents the common cold.", verdict: "contradicted", line: "Probably not true: the strongest studies found no real effect.", studies: 9, likes: "96.4K", comments: "3,912" },
];

const CYCLE = 8000;

function Illustration({ art }: { art: Art }) {
  if (art === "celery") {
    return (
      <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true">
        <ellipse cx="100" cy="214" rx="58" ry="8" fill="#000" opacity=".08" />
        <path d="M128 40 L150 6" stroke="#c99a9d" strokeWidth="7" strokeLinecap="round" />
        <path d="M60 60 L140 60 L130 208 Q100 216 70 208 Z" fill="#ffffff" opacity=".55" stroke="#ffffff" strokeWidth="3" />
        <path d="M64 92 L136 92 L130 206 Q100 213 70 206 Z" fill="#7fae5a" />
        <path d="M64 92 L136 92 L135 104 Q100 110 65 104 Z" fill="#9ccb72" />
        <rect x="78" y="118" width="16" height="16" rx="3" fill="#ffffff" opacity=".45" transform="rotate(-12 86 126)" />
        <rect x="104" y="140" width="14" height="14" rx="3" fill="#ffffff" opacity=".4" transform="rotate(14 111 147)" />
        {[[84, 170], [112, 182], [96, 156], [120, 120]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.5" fill="#ffffff" opacity=".6" />)}
        <path d="M44 214 Q40 150 58 96" stroke="#6f9a49" strokeWidth="12" strokeLinecap="round" fill="none" />
        <path d="M58 96 Q50 76 38 70 M58 96 Q66 74 80 70 M58 96 Q56 72 60 58" stroke="#8fbf5f" strokeWidth="7" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  if (art === "collagen") {
    return (
      <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true">
        <ellipse cx="96" cy="212" rx="64" ry="8" fill="#000" opacity=".08" />
        <rect x="46" y="70" width="100" height="140" rx="14" fill="#fdfaf6" />
        <rect x="42" y="56" width="108" height="26" rx="8" fill="#512a35" />
        <rect x="60" y="112" width="72" height="56" rx="6" fill="#ead9d5" />
        <rect x="70" y="124" width="52" height="8" rx="4" fill="#854c5c" />
        <rect x="76" y="140" width="40" height="6" rx="3" fill="#c99a9d" />
        <rect x="76" y="152" width="40" height="6" rx="3" fill="#c99a9d" />
        <path d="M128 190 Q150 176 176 186" stroke="#854c5c" strokeWidth="6" strokeLinecap="round" fill="none" />
        <ellipse cx="128" cy="192" rx="22" ry="11" fill="#fdfaf6" stroke="#c99a9d" strokeWidth="3" />
        <ellipse cx="128" cy="189" rx="16" ry="6" fill="#f3e6df" />
        {[[150, 206], [158, 200], [144, 210], [166, 207]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2" fill="#fdfaf6" />)}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true">
      <ellipse cx="100" cy="212" rx="70" ry="8" fill="#000" opacity=".08" />
      <circle cx="88" cy="120" r="62" fill="#f39a3d" />
      <circle cx="88" cy="120" r="54" fill="#fbc067" />
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return <line key={i} x1="88" y1="120" x2={88 + Math.cos(a) * 52} y2={120 + Math.sin(a) * 52} stroke="#fde7c2" strokeWidth="3" />;
      })}
      <circle cx="88" cy="120" r="7" fill="#fde7c2" />
      {[[146, 186, -25], [168, 160, 30], [130, 206, 70]].map(([x, y, r]) => (
        <g key={`${x}${y}`} transform={`rotate(${r} ${x} ${y})`}>
          <rect x={x - 18} y={y - 8} width="36" height="16" rx="8" fill="#fdfaf6" />
          <rect x={x - 18} y={y - 8} width="18" height="16" rx="8" fill="#e8742a" />
        </g>
      ))}
    </svg>
  );
}

export default function ReelDemo({ onRun }: { onRun: (claim: string) => void }) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState(0); // 0 playing, 1 claim highlighted, 2 verdict sheet
  const [paused, setPaused] = useState(false);
  const p = POSTS[i];
  const v = VERDICTS[p.verdict];

  useEffect(() => {
    setPhase(reduced ? 2 : 0);
    if (reduced) return;
    const a = setTimeout(() => setPhase(1), 1400);
    const b = setTimeout(() => setPhase(2), 2600);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [i, reduced]);

  useEffect(() => {
    if (paused || reduced) return;
    const t = setTimeout(() => setI((x) => (x + 1) % POSTS.length), CYCLE);
    return () => clearTimeout(t);
  }, [i, paused, reduced]);

  return (
    <div className="mx-auto w-full max-w-[340px] text-ink" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      {/* example switcher */}
      <div className="mb-4 grid grid-cols-3 gap-1 rounded-md bg-cream/10 p-1" role="tablist" aria-label="Example posts">
        {POSTS.map((post, k) => (
          <button key={post.handle} role="tab" aria-selected={k === i} onClick={() => setI(k)}
            className={`min-h-11 rounded-[5px] px-2 text-sm transition-colors ${k === i ? "bg-cream text-burgundy" : "text-cream/80 hover:text-cream"}`}>
            {post.art === "celery" ? "Celery juice" : post.art === "collagen" ? "Collagen" : "Vitamin C"}
          </button>
        ))}
      </div>

      {/* phone */}
      <div className="relative overflow-hidden rounded-[28px] border-[6px] border-[#1d1719] bg-[#1d1719] shadow-[0_24px_60px_-24px_rgb(0_0_0/0.6)]">
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            className="relative aspect-[9/16] w-full overflow-hidden rounded-[22px]" style={{ background: p.bg }}>
            {/* the "video" */}
            <motion.div className="absolute inset-x-6 top-12 bottom-44" initial={{ scale: 1.06 }} animate={{ scale: reduced ? 1.06 : 1 }} transition={{ duration: CYCLE / 1000, ease: "linear" }}>
              <Illustration art={p.art} />
            </motion.div>

            {/* top bar + progress */}
            <div className="absolute inset-x-3 top-3">
              <div className="h-[3px] overflow-hidden rounded-full bg-black/15">
                <motion.div className="h-full bg-white" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: CYCLE / 1000, ease: "linear" }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm font-semibold text-black/70">
                <span>Reels</span><span className="rounded bg-white/70 px-1.5 py-0.5 text-xs font-medium">Example post</span>
              </div>
            </div>

            {/* right rail */}
            <div className="absolute bottom-40 right-3 flex flex-col items-center gap-4 text-black/75">
              {[[Heart, p.likes], [MessageCircle, p.comments], [Send, ""], [Bookmark, ""]].map(([Icon, n], k) => {
                const I2 = Icon as typeof Heart;
                return <span key={k} className="flex flex-col items-center text-xs font-semibold"><I2 size={24} strokeWidth={1.8} />{n as string}</span>;
              })}
            </div>

            {/* bottom: creator + caption */}
            <div className="absolute inset-x-0 bottom-0 bg-[#1d1719]/85 px-4 pb-4 pt-3 text-white">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-xs font-semibold text-ink">{p.initials}</span>
                <span className="text-sm font-semibold">{p.handle}</span>
                <span className="rounded-md border border-white/40 px-2 py-0.5 text-xs">Follow</span>
              </div>
              <p className="mt-2 text-[15px] leading-snug">
                <span className={`rounded-[3px] px-0.5 transition-colors duration-500 ${phase >= 1 ? "bg-blush-pale text-burgundy" : ""}`}>{p.hit}</span>
                {p.rest} <span className="text-white/70">{p.tags}</span>
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-white/70"><Music2 size={13} /> original audio · {p.handle}</p>
            </div>

            {/* verdict sheet */}
            <AnimatePresence>
              {phase >= 2 && (
                <motion.div initial={reduced ? false : { y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "tween", duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-x-2 bottom-2 rounded-[14px] bg-cream p-4 text-ink shadow-[0_-8px_30px_-12px_rgb(0_0_0/0.45)]">
                  <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink/15" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-semibold"><span className="grid h-6 w-6 place-items-center rounded-md bg-burgundy font-[family-name:var(--font-display)] text-sm text-cream">V</span>VetoHealth checked this</span>
                    <span className="rounded-md border px-2 py-0.5 text-xs font-semibold" style={{ color: v.color, borderColor: `color-mix(in srgb, ${v.color} 40%, transparent)`, background: `color-mix(in srgb, ${v.color} 10%, transparent)` }}>{v.label}</span>
                  </div>
                  <p className="mt-2 text-[15px] font-medium leading-snug">{p.line}</p>
                  <p className="mt-1 text-xs text-muted">{p.studies} PubMed studies · from our live test run</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      <button onClick={() => onRun(p.claim)} className="mx-auto mt-5 flex min-h-11 items-center gap-2 rounded-md border border-cream/50 px-5 text-[15px] font-medium text-cream transition-colors hover:border-cream hover:bg-cream/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream">
        Check this claim live <ArrowRight size={16} />
      </button>
    </div>
  );
}
