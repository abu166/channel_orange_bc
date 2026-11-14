"use client";
/**
 * The homepage's one authored moment: Vee surrounded by viral health posts. Every few seconds Vee turns to a post,
 * scans it, and stamps it "PROOF?". The stamp asks the question; it never claims a verdict (verdicts only come from
 * a real check). Clicking a post or Vee runs a real check on that claim.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Mic, Play } from "lucide-react";
import type { Mood } from "@/components/HeroScene";

const HeroScene = dynamic(() => import("@/components/HeroScene"), {
  ssr: false,
  loading: () => <div className="mx-auto mt-[18%] h-[58%] w-[46%] rounded-full bg-blush-pale/50" />,
});

export const VIRAL_POSTS: { text: string; source: string; icon: "play" | "mic" }[] = [
  { text: "Seed oils are toxic", source: "Reel", icon: "play" },
  { text: "Rosemary oil regrows hair", source: "TikTok", icon: "play" },
  { text: "Mouth taping improves sleep", source: "Podcast", icon: "mic" },
  { text: "Creatine improves memory", source: "Short", icon: "play" },
];

// Where each post sits around Vee (desktop), and which way Vee turns to read it.
const SPOTS = [
  { cls: "left-0 top-[2%] -rotate-3 sm:top-[4%] sm:-left-[2%]", side: -1 },
  { cls: "right-0 bottom-[2%] rotate-2 sm:bottom-auto sm:top-[12%] sm:-right-[3%]", side: 1 },
  { cls: "left-0 bottom-[8%] rotate-2 hidden sm:block sm:-left-[8%]", side: -1 },
  { cls: "right-0 bottom-[2%] -rotate-2 hidden sm:block sm:-right-[5%]", side: 1 },
];

const CYCLE_MS = 3600;
const SCAN_MS = 1250;

function Stamp({ reduced }: { reduced: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      initial={reduced ? false : { scale: 2.4, opacity: 0, rotate: -26 }}
      animate={{ scale: 1, opacity: 1, rotate: -11 }}
      transition={{ duration: 0.26, ease: [0.2, 0.9, 0.3, 1.25] }}
      className="pointer-events-none absolute bottom-1.5 right-2.5 select-none rounded-md border-[3px] border-double border-burgundy/85 px-2 font-sans text-base font-extrabold uppercase tracking-[0.16em] text-burgundy/85 [filter:url(#vh-ink)]"
    >
      Proof?
    </motion.span>
  );
}

function Post({ post, spot, scanning, stamped, shock, onCheck, delay, reduced }: {
  post: (typeof VIRAL_POSTS)[number]; spot: (typeof SPOTS)[number]; scanning: boolean; stamped: boolean; shock: number;
  onCheck: () => void; delay: number; reduced: boolean;
}) {
  const Icon = post.icon === "mic" ? Mic : Play;
  return (
    <motion.div
      className={`absolute z-10 w-[min(46%,210px)] ${spot.cls}`}
      initial={reduced ? false : { opacity: 0, y: 18, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <motion.div animate={reduced ? undefined : { y: [0, -7, 0] }} transition={{ duration: 5 + delay * 2, repeat: Infinity, ease: "easeInOut" }}>
        <motion.button
          type="button"
          onClick={onCheck}
          animate={shock && !reduced ? { x: shock % 2 ? [0, -4, 4, -2, 0] : [0, 4, -4, 2, 0] } : undefined}
          transition={{ duration: 0.3 }}
          aria-label={`Check the claim: ${post.text}`}
          className={`group relative block w-full overflow-hidden rounded-[10px] border bg-surface p-3 pb-9 pr-4 text-left shadow-[0_8px_24px_-12px_rgb(41_35_38/0.18)] transition-colors duration-200 hover:border-rose ${scanning ? "border-rose" : "border-line"}`}
        >
          <span className="flex items-center justify-between gap-2">
            <span className="eyebrow inline-flex items-center gap-1.5"><span className="grid h-5 w-5 place-items-center rounded-full bg-burgundy text-cream"><Icon size={11} fill={post.icon === "play" ? "currentColor" : "none"} aria-hidden="true" /></span>{post.source}</span>
            <ArrowUpRight size={16} className="text-muted transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-burgundy" aria-hidden="true" />
          </span>
          <span className={`mt-2 block font-display text-[1.08rem] leading-snug text-ink transition-opacity duration-300 ${stamped ? "opacity-80" : ""}`}>“{post.text}”</span>
          {/* scan line */}
          <AnimatePresence>
            {scanning && !reduced && (
              <motion.span
                key="scan"
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 h-0.5 bg-rose"
                initial={{ top: "0%", opacity: 0 }}
                animate={{ top: ["0%", "100%", "0%"], opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: SCAN_MS / 1000, ease: "easeInOut" }}
              />
            )}
          </AnimatePresence>
          {stamped && <Stamp reduced={reduced} />}
        </motion.button>
        {/* shockwave when the stamp lands */}
        {!!shock && !reduced && (
          <motion.span
            key={`ring${shock}`}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[10px] border-2 border-burgundy"
            initial={{ scale: 1, opacity: 0.45 }}
            animate={{ scale: 1.3, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

export default function HeroStage({ mood, onCheck }: { mood: Mood; onCheck: (text: string) => void }) {
  const reduced = !!useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);
  const [scanning, setScanning] = useState(false);
  const [stamped, setStamped] = useState<number[]>([]);
  const [shocks, setShocks] = useState<number[]>(VIRAL_POSTS.map(() => 0));
  const [visible, setVisible] = useState(true);
  const leaving = useRef(false);

  const stamp = useCallback((i: number) => {
    setStamped((s) => (s.includes(i) ? s : [...s, i]));
    setShocks((s) => s.map((n, j) => (j === i ? n + 1 : n)));
  }, []);

  // pause the loop when the hero is off-screen or the tab is hidden
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced) { setStamped(VIRAL_POSTS.map((_, i) => i)); return; }
    if (!visible) return;
    const timers: number[] = [];
    let i = active;
    const step = () => {
      if (document.hidden || leaving.current) return;
      i = (i + 1) % VIRAL_POSTS.length;
      if (i === 0) setStamped([]);
      setActive(i); setScanning(true);
      timers.push(window.setTimeout(() => { setScanning(false); stamp(i); }, SCAN_MS));
    };
    // first stamp lands right after Vee's entrance
    timers.push(window.setTimeout(step, active < 0 ? 1500 : 400));
    const loop = window.setInterval(step, CYCLE_MS);
    return () => { timers.forEach(clearTimeout); clearInterval(loop); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, visible, stamp]);

  const check = (i: number) => {
    if (leaving.current) return;
    leaving.current = true;
    setActive(i); setScanning(false); stamp(i);
    window.setTimeout(() => onCheck(VIRAL_POSTS[i].text), reduced ? 0 : 650);
  };

  const sceneMood: Mood = leaving.current ? "good" : mood !== "idle" ? mood : scanning ? "checking" : "idle";
  const focus = mood === "idle" && active >= 0 && scanning ? SPOTS[active].side : null;

  return (
    <div ref={box} className="relative h-[340px] sm:h-[460px] md:h-[540px]">
      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <filter id="vh-ink"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" /><feDisplacementMap in="SourceGraphic" scale="2.6" /></filter>
      </svg>
      {/* the stage: a solid blush disc with two hairline rings */}
      <div aria-hidden="true" className="absolute left-1/2 top-[48%] aspect-square w-[78%] max-w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blush-pale/70" />
      <div aria-hidden="true" className="absolute left-1/2 top-[48%] aspect-square w-[94%] max-w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-rose/15" />
      <div aria-hidden="true" className="absolute left-1/2 top-[48%] aspect-square w-[110%] max-w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-rose/10" />
      <div className="absolute inset-x-[2%] inset-y-[2%]">
        <HeroScene mood={sceneMood} focus={focus} onPoke={() => check(active >= 0 ? active : Math.floor(Math.random() * VIRAL_POSTS.length))} />
      </div>
      {VIRAL_POSTS.map((post, i) => (
        <Post key={post.text} post={post} spot={SPOTS[i]} scanning={scanning && active === i} stamped={stamped.includes(i)} shock={shocks[i]} onCheck={() => check(i)} delay={0.55 + i * 0.12} reduced={reduced} />
      ))}
    </div>
  );
}
