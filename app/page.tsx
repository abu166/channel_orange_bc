"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, BellRing, Check, FlaskConical, History, Layers, ScanLine, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Reveal, SectionTitle, VerdictBadge } from "@/components/ui";
import { VERDICTS, type Verdict } from "@/lib/types";

const DEMOS: { handle: string; caption: string; hit: string; verdict: Verdict; chips: string[] }[] = [
  { handle: "@glow.with.jess", caption: "Celery juice cures eczema in 7 days 🌿 trust me #detox", hit: "Celery juice cures eczema in 7 days", verdict: "misleading", chips: ["Absolute wording: “cures”", "No trial supports it", "Counter-search ran"] },
  { handle: "@drskinfacts", caption: "Collagen peptides improve skin elasticity — the data is surprisingly decent.", hit: "Collagen peptides improve skin elasticity", verdict: "supported", chips: ["Meta-analyses found", "Small, short trials", "Dose not stated"] },
  { handle: "@biohack.bro", caption: "Vitamin C prevents the common cold. Megadose daily, never get sick.", hit: "Vitamin C prevents the common cold", verdict: "contradicted", chips: ["Systematic reviews: no prevention", "May shorten colds", "No doses given here"] },
];
const VIRAL = ["Seed oils are toxic", "Rosemary oil regrows hair", "Sugar causes acne", "Apple cider vinegar lowers blood sugar", "Cold plunges boost immunity", "Mouth taping improves sleep", "Ashwagandha reduces stress", "Red light therapy reduces wrinkles", "Creatine improves memory", "Coffee causes anxiety"];

function DemoCard() {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState(0); // 0 scan, 1 highlight, 2 stamp
  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 1400);
    const t2 = setTimeout(() => setPhase(2), 2200);
    const t3 = setTimeout(() => setI((x) => (x + 1) % DEMOS.length), 6200);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [i]);
  const d = DEMOS[i];
  const color = VERDICTS[d.verdict].color;
  const rest = d.caption.slice(d.hit.length);
  return (
    <div className="relative mx-auto w-full max-w-[380px] animate-float">
      <div className="absolute -inset-8 rounded-[48px] blur-3xl transition-colors duration-700" style={{ background: `color-mix(in srgb, ${color} 18%, transparent)` }} />
      <div className="relative aspect-[9/14] overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#2a1f3d] via-[#141418] to-[#0f2a22] shadow-2xl">
        <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_30%_20%,#ff7ab655,transparent_45%),radial-gradient(circle_at_80%_70%,#3affc455,transparent_40%)]" />
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between text-[11px] text-white/70">
          <span className="font-mono">Reels</span><span className="chip !border-white/10 !bg-black/30 !py-0.5 !text-[10px]">Illustration</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-x-0 bottom-0 p-5">
            <div className="mb-3 flex items-center gap-2"><span className="h-7 w-7 rounded-full bg-gradient-to-br from-pink-400 to-amber-300" /><span className="text-sm font-semibold">{d.handle}</span></div>
            <p className="text-[17px] leading-snug">
              <motion.span animate={{ backgroundColor: phase >= 1 ? `color-mix(in srgb, ${color} 28%, transparent)` : "rgba(0,0,0,0)" }} className="rounded box-decoration-clone px-0.5" style={{ boxShadow: phase >= 1 ? `inset 0 -2px 0 ${color}` : "none" }}>{d.hit}</motion.span>{rest}
            </p>
            <div className="mt-4 flex min-h-[64px] flex-wrap gap-1.5">
              {phase >= 2 && d.chips.map((c, k) => (
                <motion.span key={c} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + k * 0.12 }} className="chip !border-white/10 !bg-black/50 backdrop-blur">{c}</motion.span>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
        {phase === 0 && <div className="absolute inset-x-0 top-10 h-24 animate-scan bg-gradient-to-b from-transparent via-signal/25 to-transparent [--scan-h:320px]"><div className="absolute bottom-1/2 h-px w-full bg-signal shadow-[0_0_20px_var(--color-signal)]" /></div>}
        <div className="absolute right-5 top-[38%]">{phase >= 2 && <VerdictBadge key={i} verdict={d.verdict} size="lg" stamp />}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const mx = useMotionValue(50), my = useMotionValue(20);
  const sx = useSpring(mx, { stiffness: 80, damping: 20 }), sy = useSpring(my, { stiffness: 80, damping: 20 });
  const bg = useMotionTemplate`radial-gradient(700px circle at ${sx}% ${sy}%, rgb(215 255 58 / 0.09), transparent 60%)`;
  const words = ["Health", "advice", "goes", "viral."];

  return (
    <>
      <section className="relative overflow-hidden" onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); mx.set(((e.clientX - r.left) / r.width) * 100); my.set(((e.clientY - r.top) / r.height) * 100); }}>
        <motion.div className="pointer-events-none absolute inset-0" style={{ background: bg }} />
        <div className="pointer-events-none absolute inset-0 grid-bg" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-16 sm:px-6 md:grid-cols-[1.25fr_1fr] md:pt-24">
          <div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="chip mb-8"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" /> Live PubMed evidence · no sign-up</motion.p>
            <h1 className="display text-[clamp(3.2rem,8vw,6.6rem)]">
              {words.map((w, k) => (
                <motion.span key={w} initial={{ opacity: 0, y: 40, rotate: 4 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 0.1 + k * 0.08, duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="mr-[0.22em] inline-block">{w}</motion.span>
              ))}
              <br />
              <motion.em initial={{ opacity: 0, filter: "blur(12px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} transition={{ delay: 0.6, duration: 1 }} className="text-signal">Evidence doesn&apos;t.</motion.em>
            </h1>
            <Reveal delay={0.7}>
              <p className="mt-7 max-w-lg text-lg leading-relaxed text-bone/70">
                VetoHealth checks the health claims you see on Reels, TikTok and product labels against real research. It shows you
                the studies that agree, the studies that don&apos;t, and says so when the evidence is too thin to call.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/analyze" className="btn-primary text-base">Veto a claim <ArrowRight size={17} /></Link>
                <Link href="/routine" className="btn-ghost text-base">Check my routine</Link>
              </div>
            </Reveal>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.92, rotate: 3 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: 0.3, duration: 1, ease: [0.22, 1, 0.36, 1] }}><DemoCard /></motion.div>
        </div>
      </section>

      <div className="relative border-y border-line bg-ink-2/60 py-4 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max animate-marquee gap-3 hover:[animation-play-state:paused]">
          {[...VIRAL, ...VIRAL].map((c, k) => (
            <Link key={k} href={`/analyze?q=${encodeURIComponent(c + ".")}`} className="chip shrink-0 !px-4 !py-2 text-sm transition hover:!border-signal hover:!text-signal">“{c}” <ArrowRight size={13} /></Link>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 pt-32 sm:px-6">
        <SectionTitle eyebrow="How it works" title={<>Four steps from scroll<br />to <em className="text-signal">receipts.</em></>} sub="A real pipeline, streaming live while you watch. No canned answers, no made-up citations." />
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { n: "01", icon: ScanLine, t: "Paste or snap", d: "Text, a screenshot (OCR runs in your browser) or a Reel transcript with its link kept as provenance." },
            { n: "02", icon: Layers, t: "Split into claims", d: "Compound posts become atomic claims, with dose, population and duration pulled out or flagged as missing." },
            { n: "03", icon: Search, t: "Search both sides", d: "We query PubMed for support and run a separate search for null results, so the counter-evidence shows up too." },
            { n: "04", icon: FlaskConical, t: "Weigh, don't count", d: "Meta-analyses outrank mouse studies. Five verdicts, an explicit abstain, and limitations always on screen." },
          ].map((s, k) => (
            <Reveal key={s.n} delay={k * 0.08} className="card group relative overflow-hidden p-6 transition hover:-translate-y-1 hover:border-signal/30">
              <span className="absolute -right-3 -top-6 font-serif text-[110px] italic leading-none text-white/[.04] transition group-hover:text-signal/10">{s.n}</span>
              <s.icon size={22} strokeWidth={1.5} className="text-signal" />
              <h3 className="mt-6 text-lg font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">{s.d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-32 sm:px-6">
        <SectionTitle eyebrow="The verdict scale" title={<>Five verdicts.<br /><em className="text-signal">One honest abstain.</em></>} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(Object.keys(VERDICTS) as Verdict[]).map((v, k) => (
            <Reveal key={v} delay={k * 0.06} className="card p-5">
              <VerdictBadge verdict={v} size="sm" />
              <p className="mt-4 text-sm leading-relaxed text-bone/70">{VERDICTS[v].blurb}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-32 sm:px-6">
        <SectionTitle eyebrow="Beyond one claim" title={<>A habit, <em className="text-signal">not a tab.</em></>} sub="Why people come back tomorrow." />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Sparkles, t: "Routine checker", d: "Add your serums and supplements. We catch duplicate actives (two retinoids, vitamin A from three bottles) and risky pairings, with NIH sources.", href: "/routine", cta: "Check my shelf" },
            { icon: History, t: "Versioned history", d: "Every report is saved with its evidence snapshot. Re-check later: the new version sits next to the old one, never overwriting it.", href: "/history", cta: "Open history" },
            { icon: BellRing, t: "Evidence-changed alerts", d: "Plus members get pinged when new research moves a verdict on a claim they saved. Science updates, so should you.", href: "#pricing", cta: "See Plus" },
          ].map((f, k) => (
            <Reveal key={f.t} delay={k * 0.08} className="card flex flex-col p-7">
              <f.icon size={22} strokeWidth={1.5} className="text-signal" />
              <h3 className="mt-6 text-xl font-semibold">{f.t}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-mute">{f.d}</p>
              <Link href={f.href} className="mt-6 inline-flex items-center gap-1 text-sm text-signal hover:gap-2 transition-all">{f.cta} <ArrowRight size={14} /></Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-32 sm:px-6">
        <SectionTitle eyebrow="Pricing" title={<>Cheaper than one<br /><em className="text-signal">bad supplement.</em></>} />
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { name: "Free", price: "$0", per: "forever", items: ["3 claim checks a day", "Routine checker", "History on this device"], cta: "Start checking", hot: false },
            { name: "Plus", price: "$7.99", per: "/ month · $59 / year", items: ["Unlimited checks + screenshot & label scan", "Evidence-changed alerts on saved claims", "Synced history across devices", "Routine monitoring as you add products"], cta: "Try Plus free for 7 days", hot: true },
          ].map((p, k) => (
            <Reveal key={p.name} delay={k * 0.1} className={`card relative overflow-hidden p-8 ${p.hot ? "!border-signal/40" : ""}`}>
              {p.hot && <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-signal/15 blur-3xl" />}
              <p className="eyebrow">{p.name}</p>
              <p className="mt-4"><span className="display text-6xl">{p.price}</span> <span className="text-sm text-mute">{p.per}</span></p>
              <ul className="mt-6 space-y-3">{p.items.map((i) => <li key={i} className="flex items-start gap-2 text-sm text-bone/80"><Check size={16} className="mt-0.5 shrink-0 text-signal" />{i}</li>)}</ul>
              <Link href="/analyze" className={`${p.hot ? "btn-primary" : "btn-ghost"} mt-8 w-full`}>{p.cta}</Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-32 sm:px-6">
        <Reveal className="card relative overflow-hidden p-10 text-center sm:p-16">
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
          <ShieldCheck size={28} strokeWidth={1.5} className="relative mx-auto text-signal" />
          <h2 className="display relative mx-auto mt-6 max-w-3xl text-5xl sm:text-7xl">Before you believe it, <em className="text-signal">veto it.</em></h2>
          <p className="relative mx-auto mt-5 max-w-lg text-mute">No fake citations. No doses. No confident guesses when the science is thin.</p>
          <Link href="/analyze" className="btn-primary relative mt-9 text-base">Check your first claim <ArrowRight size={17} /></Link>
        </Reveal>
      </section>
    </>
  );
}
