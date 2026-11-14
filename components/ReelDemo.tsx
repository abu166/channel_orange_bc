"use client";
/**
 * "See it work": an example Reel plays with word-by-word captions, Vee scans the screen and pulls out the claim,
 * then "Check it live" runs the REAL pipeline (PubMed + rubric + AI) inside the phone. Nothing in the verdict sheet
 * is pre-written: before the user taps, the sheet only shows the extracted claim.
 * The posts, handles and counts are illustrative (labelled "Example post"); illustrations are inline SVG.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Bookmark, Check, Heart, Loader2, MessageCircle, Music2, RotateCcw, Send } from "lucide-react";
import { VerdictBadge } from "@/components/ui";
import { runAnalysis } from "@/lib/store";
import type { ClaimReport } from "@/lib/types";

type Art = "celery" | "collagen" | "citrus";
interface Post { tab: string; art: Art; bg: string; handle: string; initials: string; spoken: string; hit: string; rest: string; tags: string; claim: string; likes: string; comments: string }

const POSTS: Post[] = [
  { tab: "Celery juice", art: "celery", bg: "#dfe9d6", handle: "glow.with.jess", initials: "GJ", spoken: "Celery juice every morning cured my eczema in seven days", hit: "Celery juice cured my eczema in 7 days", rest: " and it can heal yours too", tags: "#guthealth #detox", claim: "Celery juice cures eczema.", likes: "48.2K", comments: "1,204" },
  { tab: "Collagen", art: "collagen", bg: "#efdcd8", handle: "drskinfacts", initials: "DS", spoken: "Collagen peptides make your skin so much more elastic", hit: "Collagen peptides improve skin elasticity", rest: ". Here's what I take daily", tags: "#skincare #antiaging", claim: "Collagen supplements improve skin elasticity.", likes: "12.9K", comments: "386" },
  { tab: "Vitamin C", art: "citrus", bg: "#f6e1c8", handle: "biohack.bro", initials: "BB", spoken: "Megadose vitamin C daily and you will never catch a cold", hit: "Vitamin C prevents colds", rest: ". Megadose daily, never get sick", tags: "#immunity #biohacking", claim: "Vitamin C prevents the common cold.", likes: "96.4K", comments: "3,912" },
];

const WORD_MS = 280;
const STEPS = [
  { title: "A Reel makes a claim", body: "Paste a TikTok, Reel or Short. Vee reads the captions and the speech." },
  { title: "Vee pulls out the claim", body: "Each health claim becomes one precise, checkable sentence." },
  { title: "Research answers, live", body: "PubMed studies are found and weighed by design. Try it in the phone." },
];
const STAGES: { id: string; label: string }[] = [
  { id: "extract", label: "Reading the claim" },
  { id: "search", label: "Searching 37M+ PubMed papers" },
  { id: "contradict", label: "Looking for studies that disagree" },
  { id: "assess", label: "Weighing studies by design" },
];

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
        {[[84, 170], [112, 182], [96, 156], [120, 120]].map(([x, y], k) => <circle key={`${x}${y}`} className="animate-[float_3s_ease-in-out_infinite]" style={{ animationDelay: `${k * 0.4}s` }} cx={x} cy={y} r="2.5" fill="#ffffff" opacity=".6" />)}
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
        <g className="origin-[128px_190px] animate-[float_2.4s_ease-in-out_infinite]">
          <path d="M128 190 Q150 176 176 186" stroke="#854c5c" strokeWidth="6" strokeLinecap="round" fill="none" />
          <ellipse cx="128" cy="192" rx="22" ry="11" fill="#fdfaf6" stroke="#c99a9d" strokeWidth="3" />
          <ellipse cx="128" cy="189" rx="16" ry="6" fill="#f3e6df" />
        </g>
        {[[150, 206], [158, 200], [144, 210], [166, 207]].map(([x, y], k) => <circle key={`${x}${y}`} className="animate-[float_2s_ease-in-out_infinite]" style={{ animationDelay: `${k * 0.3}s` }} cx={x} cy={y} r="2" fill="#fdfaf6" />)}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true">
      <ellipse cx="100" cy="212" rx="70" ry="8" fill="#000" opacity=".08" />
      <g className="origin-[88px_120px] animate-[spin_40s_linear_infinite]">
        <circle cx="88" cy="120" r="62" fill="#f39a3d" />
        <circle cx="88" cy="120" r="54" fill="#fbc067" />
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return <line key={i} x1="88" y1="120" x2={88 + Math.cos(a) * 52} y2={120 + Math.sin(a) * 52} stroke="#fde7c2" strokeWidth="3" />;
        })}
        <circle cx="88" cy="120" r="7" fill="#fde7c2" />
      </g>
      {[[146, 186, -25], [168, 160, 30], [130, 206, 70]].map(([x, y, r]) => (
        <g key={`${x}${y}`} transform={`rotate(${r} ${x} ${y})`}>
          <rect x={x - 18} y={y - 8} width="36" height="16" rx="8" fill="#fdfaf6" />
          <rect x={x - 18} y={y - 8} width="18" height="16" rx="8" fill="#e8742a" />
        </g>
      ))}
    </svg>
  );
}

/** Reels-style captions: three words at a time, the spoken word highlighted. */
function Captions({ words, at }: { words: string[]; at: number }) {
  const chunk = Math.floor(Math.max(0, at) / 3);
  const shown = words.slice(chunk * 3, chunk * 3 + 3);
  return (
    <div className="pointer-events-none absolute inset-x-4 top-[47%] flex justify-center" aria-hidden="true">
      <AnimatePresence mode="wait" initial={false}>
        <motion.p key={chunk} initial={{ opacity: 0, y: 8, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, transition: { duration: 0.08 } }} transition={{ duration: 0.16 }}
          className="flex flex-wrap justify-center gap-x-1 gap-y-1 text-center text-[23px] font-extrabold leading-tight text-white [text-shadow:0_2px_10px_rgb(0_0_0/0.5),0_0_2px_rgb(0_0_0/0.6)]">
          {shown.map((w, k) => <span key={`${w}${k}`} className={`rounded-[5px] px-1.5 py-0.5 transition-colors duration-100 ${chunk * 3 + k === at ? "bg-burgundy text-cream [text-shadow:none]" : ""}`}>{w}</span>)}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

type Phase = "playing" | "scanning" | "found" | "running" | "result" | "error";

export default function ReelDemo() {
  const reduced = !!useReducedMotion();
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [word, setWord] = useState(-1);
  const [touched, setTouched] = useState(false);
  const [stageIdx, setStageIdx] = useState(-1);
  const [stageMsg, setStageMsg] = useState("");
  const [result, setResult] = useState<ClaimReport | null>(null);
  const [error, setError] = useState("");
  const run = useRef(0);
  const p = POSTS[i];
  const words = p.spoken.split(" ");

  // play: captions word by word, then Vee scans, then the claim sheet
  useEffect(() => {
    run.current++;
    setResult(null); setError(""); setStageIdx(-1);
    if (reduced) { setWord(words.length - 1); setPhase("found"); return; }
    setPhase("playing"); setWord(-1);
    const timers: number[] = [];
    words.forEach((_, k) => timers.push(window.setTimeout(() => setWord(k), 450 + k * WORD_MS)));
    const end = 450 + words.length * WORD_MS + 500;
    timers.push(window.setTimeout(() => setPhase("scanning"), end));
    timers.push(window.setTimeout(() => setPhase((ph) => (ph === "scanning" ? "found" : ph)), end + 1300));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, reduced]);

  // until someone interacts, move to the next example a few seconds after the claim appears
  useEffect(() => {
    if (touched || reduced || phase !== "found") return;
    const t = window.setTimeout(() => setI((x) => (x + 1) % POSTS.length), 5200);
    return () => clearTimeout(t);
  }, [phase, touched, reduced]);

  async function checkLive() {
    setTouched(true);
    const id = ++run.current;
    setPhase("running"); setStageIdx(0); setStageMsg("Reading the claim"); setError("");
    try {
      const report = await runAnalysis({ text: p.claim, content_type: "text" }, (e) => {
        if (id !== run.current || e.type !== "stage") return;
        const k = STAGES.findIndex((s) => s.id === e.stage);
        if (k >= 0) setStageIdx((old) => Math.max(old, k));
        setStageMsg(e.message);
      });
      if (id !== run.current) return;
      const first = report.claims[0];
      if (!first) throw new Error("No checkable claim came back. Try again.");
      setResult(first); setPhase("result");
    } catch (e) {
      if (id !== run.current) return;
      setError(e instanceof Error ? e.message : "The check didn't finish. Try again."); setPhase("error");
    }
  }

  const step = phase === "playing" ? 0 : phase === "scanning" ? 1 : 2;
  const counts = result ? (["supports", "contradicts", "neutral"] as const).map((s) => result.evidence.filter((e) => e.stance === s).length) : [0, 0, 0];
  const total = counts.reduce((a, b) => a + b, 0);
  const liked = word >= Math.min(6, words.length - 1) || phase !== "playing";

  return (
    <div className="grid items-center gap-12 md:grid-cols-2">
      <div>
        <h2 className="display text-5xl text-cream">See it work</h2>
        <p className="mt-6 max-w-md text-lg text-cream/90">From a Reel to the research behind it, in about ten seconds.</p>
        <ol className="mt-10 max-w-md space-y-2">
          {STEPS.map((s, k) => (
            <li key={s.title} aria-current={k === step ? "step" : undefined} className={`flex items-start gap-4 rounded-[10px] border px-4 py-4 transition-colors duration-300 ${k === step ? "border-cream/35 bg-cream/10" : "border-transparent"}`}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md border font-display text-lg tabular-nums transition-colors duration-300 ${k < step ? "border-cream/30 bg-cream text-burgundy" : k === step ? "border-cream text-cream" : "border-cream/25 text-cream/60"}`}>{k < step ? <Check size={18} aria-hidden="true" /> : k + 1}</span>
              <span><span className={`block text-lg font-medium transition-colors duration-300 ${k === step ? "text-cream" : "text-cream/70"}`}>{s.title}</span><span className="mt-1 block text-base text-cream/70">{s.body}</span></span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mx-auto w-full max-w-[340px] text-ink">
        {/* example switcher */}
        <div className="mb-4 grid grid-cols-3 gap-1 rounded-md bg-cream/10 p-1" role="tablist" aria-label="Example posts">
          {POSTS.map((post, k) => (
            <button key={post.handle} role="tab" aria-selected={k === i} onClick={() => { setTouched(true); setI(k); }}
              className={`min-h-11 rounded-[5px] px-2 text-base transition-colors ${k === i ? "bg-cream text-burgundy" : "text-cream/80 hover:text-cream"}`}>
              {post.tab}
            </button>
          ))}
        </div>

        {/* phone */}
        <div className="relative overflow-hidden rounded-[30px] border-[7px] border-[#1d1719] bg-[#1d1719] shadow-[0_24px_60px_-24px_rgb(0_0_0/0.6)]">
          <div aria-hidden="true" className="absolute left-1/2 top-1.5 z-30 h-[18px] w-24 -translate-x-1/2 rounded-full bg-[#1d1719]" />
          <AnimatePresence mode="wait">
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
              className="relative aspect-[9/16] w-full overflow-hidden rounded-[23px]" style={{ background: p.bg }}>
              {/* the "video" */}
              <motion.div className="absolute inset-x-6 top-12 bottom-44" initial={{ scale: 1.08 }} animate={{ scale: reduced ? 1.08 : 1 }} transition={{ duration: 9, ease: "linear" }}>
                <Illustration art={p.art} />
              </motion.div>
              {phase === "playing" && <Captions words={words} at={word} />}

              {/* top bar + progress */}
              <div className="absolute inset-x-3 top-7">
                <div className="h-[3px] overflow-hidden rounded-full bg-black/15">
                  <motion.div className="h-full bg-white" initial={{ width: "0%" }} animate={{ width: phase === "playing" ? `${((word + 1) / words.length) * 100}%` : "100%" }} transition={{ duration: 0.28, ease: "linear" }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[15px] font-semibold text-black/70">
                  <span>Reels</span><span className="rounded bg-white/70 px-1.5 py-0.5 text-[13px] font-medium">Example post</span>
                </div>
              </div>

              {/* right rail */}
              <div className="absolute bottom-40 right-3 flex flex-col items-center gap-4 text-black/75">
                <span className="flex flex-col items-center text-[13px] font-semibold">
                  <motion.span animate={liked && !reduced ? { scale: [1, 1.35, 1] } : undefined} transition={{ duration: 0.35 }}><Heart size={25} strokeWidth={1.8} className={liked ? "fill-[#d94a5c] text-[#d94a5c]" : ""} aria-hidden="true" /></motion.span>{p.likes}
                </span>
                <span className="flex flex-col items-center text-[13px] font-semibold"><MessageCircle size={25} strokeWidth={1.8} aria-hidden="true" />{p.comments}</span>
                <Send size={25} strokeWidth={1.8} aria-hidden="true" />
                <Bookmark size={25} strokeWidth={1.8} aria-hidden="true" />
              </div>

              {/* bottom: creator + caption */}
              <div className="absolute inset-x-0 bottom-0 bg-[#1d1719]/85 px-4 pb-4 pt-3 text-white">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[13px] font-semibold text-ink">{p.initials}</span>
                  <span className="text-[15px] font-semibold">{p.handle}</span>
                  <span className="rounded-md border border-white/40 px-2 py-0.5 text-[13px]">Follow</span>
                </div>
                <p className="mt-2 text-[15px] leading-snug">
                  <span className={`rounded-[3px] px-0.5 transition-colors duration-500 ${phase !== "playing" ? "bg-blush-pale text-burgundy" : ""}`}>{p.hit}</span>
                  {p.rest} <span className="text-white/70">{p.tags}</span>
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-[13px] text-white/70"><Music2 size={13} aria-hidden="true" /> original audio · {p.handle}</p>
              </div>

              {/* Vee's scan */}
              <AnimatePresence>
                {phase === "scanning" && !reduced && (
                  <>
                    <motion.div key="beam" aria-hidden="true" className="absolute inset-x-0 z-10 h-28 border-t-2 border-rose bg-rose/15"
                      initial={{ top: "-15%" }} animate={{ top: "100%" }} exit={{ opacity: 0 }} transition={{ duration: 1.15, ease: [0.4, 0, 0.2, 1] }} />
                    <motion.div key="toast" initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                      className="absolute left-1/2 top-16 z-20 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-cream px-3 py-1.5 text-[15px] font-semibold text-burgundy shadow-[0_8px_24px_-12px_rgb(41_35_38/0.4)]">
                      <span className="grid h-5 w-5 place-items-center rounded-[5px] bg-burgundy font-display text-[13px] text-cream">V</span>Vee is scanning…
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* the sheet: claim found → live check → real verdict */}
              <AnimatePresence>
                {phase !== "playing" && phase !== "scanning" && (
                  <motion.div layout initial={reduced ? false : { y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "tween", duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-x-2 bottom-2 z-20 rounded-[16px] bg-cream p-4 text-ink shadow-[0_-8px_30px_-12px_rgb(0_0_0/0.45)]" aria-live="polite">
                    <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink/15" />
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-[15px] font-semibold"><span className="grid h-6 w-6 place-items-center rounded-md bg-burgundy font-display text-[15px] text-cream">V</span>{phase === "result" ? "Live verdict" : phase === "running" ? "Checking live" : "Health claim found"}</span>
                      {phase === "result" && result && <VerdictBadge verdict={result.assessment.verdict} size="sm" />}
                    </div>
                    <p className="mt-2 font-display text-[19px] leading-snug">“{p.claim.replace(/\.$/, "")}”</p>

                    {(phase === "found" || phase === "error") && <>
                      {phase === "error" && <p role="alert" className="mt-2 text-[15px] text-danger">{error}</p>}
                      <button onClick={() => void checkLive()} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-burgundy px-4 text-[15px] font-semibold text-cream transition-colors hover:bg-rose focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy">
                        {phase === "error" ? <><RotateCcw size={16} aria-hidden="true" />Try again</> : <>Check it live<ArrowRight size={16} aria-hidden="true" /></>}
                      </button>
                      <p className="mt-2 text-center text-[13px] text-muted">Real PubMed search · nothing pre-written</p>
                    </>}

                    {phase === "running" && (
                      <ol className="mt-3 space-y-1.5" aria-label="Live check progress">
                        {STAGES.map((s, k) => (
                          <li key={s.id} className={`flex items-center gap-2 text-[15px] ${k === stageIdx ? "font-semibold text-burgundy" : k < stageIdx ? "text-ink" : "text-muted"}`}>
                            {k < stageIdx ? <Check size={16} className="shrink-0 text-success" aria-hidden="true" /> : k === stageIdx ? <Loader2 size={16} className="shrink-0 animate-spin" aria-hidden="true" /> : <span className="mx-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-ink/20" aria-hidden="true" />}
                            {s.label}
                          </li>
                        ))}
                        <li className="truncate pt-1 text-[13px] text-muted">{stageMsg}</li>
                      </ol>
                    )}

                    {phase === "result" && result && <>
                      <p className="mt-2 text-[15px] font-medium leading-snug">{result.assessment.bottom_line}</p>
                      {total > 0 && <>
                        <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-ink/10" role="img" aria-label={`${counts[0]} agree, ${counts[1]} no effect or opposite, ${counts[2]} unclear`}>
                          {counts.map((n, k) => n > 0 && <motion.span key={k} initial={{ width: 0 }} animate={{ width: `${(n / total) * 100}%` }} transition={{ duration: 0.6, delay: 0.1 + k * 0.1 }} className="h-full" style={{ background: ["var(--color-support)", "var(--color-contradict)", "var(--color-insufficient)"][k] }} />)}
                        </div>
                        <p className="mt-1.5 text-[13px] text-muted tabular-nums">{total} studies · {counts[0]} agree · {counts[1]} no effect · {counts[2]} unclear</p>
                      </>}
                      <div className="mt-3 flex items-center gap-2">
                        <Link href={`/check?q=${encodeURIComponent(p.claim)}&run=1`} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-burgundy px-3 text-[15px] font-semibold text-cream transition-colors hover:bg-rose">Full report<ArrowRight size={16} aria-hidden="true" /></Link>
                        <button onClick={() => { setTouched(true); setI((x) => (x + 1) % POSTS.length); }} className="flex min-h-11 items-center rounded-md border border-ink/15 px-3 text-[15px] font-medium transition-colors hover:border-rose">Next</button>
                      </div>
                    </>}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
