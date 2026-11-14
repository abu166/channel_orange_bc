"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Reveal, SectionTitle, VerdictBadge } from "@/components/ui";
import { VERDICTS, type Verdict } from "@/lib/types";
import { PLANS, SERVICES } from "@/lib/pricing";
import type { Mood } from "@/components/HeroScene";

/** Real claims circulating on social media; tapping Vee checks one live. */
const VIRAL = ["Seed oils are toxic", "Rosemary oil regrows hair", "Sugar causes acne", "Apple cider vinegar lowers blood sugar", "Cold plunges boost immunity", "Mouth taping improves sleep", "Ashwagandha reduces stress", "Red light therapy reduces wrinkles", "Creatine improves memory", "Coffee causes anxiety"];

// The 3D mascot loads on the client only, with a calm placeholder while three.js downloads.
const HeroScene = dynamic(() => import("@/components/HeroScene"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-[10px] bg-blush-pale/40" />,
});

/** Example captions (synthetic creators). Verdicts and bottom lines are copied from our live test run on Nov 14 (docs/EVAL.md). */
const DEMOS: { handle: string; caption: string; hit: string; claim: string; verdict: Verdict; line: string; studies: number }[] = [
  { handle: "@glow.with.jess", caption: "Celery juice cured my eczema in 7 days trust the process", hit: "Celery juice cured my eczema in 7 days", claim: "Celery juice cures eczema.", verdict: "misleading", line: "Overhyped: the research doesn't back “cures”.", studies: 9 },
  { handle: "@drskinfacts", caption: "Collagen peptides improve skin elasticity. Here's what the trials show", hit: "Collagen peptides improve skin elasticity", claim: "Collagen supplements improve skin elasticity.", verdict: "partially_supported", line: "Partly true: some human studies agree, but the effect is smaller than claimed.", studies: 10 },
  { handle: "@biohack.bro", caption: "Vitamin C prevents colds. Megadose daily and never get sick", hit: "Vitamin C prevents colds", claim: "Vitamin C prevents the common cold.", verdict: "contradicted", line: "Probably not true: the strongest studies found no real effect.", studies: 9 },
];


function DemoCard({ onRun }: { onRun: (t: string) => void }) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState(0); // 0 reel, 1 claim highlighted, 2 verdict sheet
  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 1100);
    const t2 = setTimeout(() => setPhase(2), 2300);
    const t3 = setTimeout(() => setI((x) => (x + 1) % DEMOS.length), 7000);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [i]);
  const d = DEMOS[i];
  const rest = d.caption.slice(d.hit.length);
  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      <div className="card relative p-3">
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {/* the "video" */}
            <div className="relative h-56 overflow-hidden rounded-[10px] bg-blush-pale">
              <div className="absolute left-4 right-4 top-4 flex items-center justify-between text-base font-semibold text-fg/70">
                <span className="text-base">Reels</span>
                <span className="text-base">Example post</span>
              </div>
              <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center text-burgundy">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
              </span>
            </div>
            {/* creator + caption */}
            <div className="px-2 pt-4">
              <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-subtle text-base text-fg">{d.handle.slice(1, 3).toUpperCase()}</span><span className="text-base font-semibold">{d.handle}</span></div>
              <p className="mt-2 text-base leading-snug text-fg/85">
                <span className="font-semibold">{d.hit}</span>{rest}
              </p>
            </div>
            {/* VetoHealth result sheet */}
            <div className="mt-3 min-h-[124px]">
              <AnimatePresence>
                {phase >= 2 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
                    className="rounded-md border border-line bg-cream px-3 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-base font-semibold"><span className="grid h-6 w-6 place-items-center bg-burgundy font-semibold text-base text-cream">V</span>VetoHealth checked this</span>
                      <VerdictBadge verdict={d.verdict} size="sm" />
                    </div>
                    <p className="mt-2 text-base font-medium leading-snug">{d.line}</p>
                    <p className="mt-1.5 text-base text-muted">{d.studies} PubMed studies · saved test result</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <button onClick={() => onRun(d.claim)} className="btn-on-dark mx-auto mt-6 flex text-base">Check claim <ArrowRight size={15} /></button>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [mood, setMood] = useState<Mood>("idle");
  const go = (t: string) => { setMood("checking"); router.push(`/analyze?q=${encodeURIComponent(t)}&run=1`); };
  const poke = () => go(`${VIRAL[Math.floor(Math.random() * VIRAL.length)]}.`);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 pb-12 pt-10 sm:px-6 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:py-20">
          <div className="min-w-0">
            <h1 className="display text-[clamp(3rem,6.5vw,5.5rem)]">
              Health claims.<br />
              <span className="mark">Checked.</span>
            </h1>
            <Reveal delay={0.15}>
              <p className="mt-7 max-w-lg text-lg leading-relaxed text-fg/80">
                Check your feed against published research.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); if (q.trim().length >= 8) go(q); }} className="mt-8 flex max-w-xl flex-col gap-2 rounded-[10px] border border-line bg-surface p-2  focus-within:ring-2 focus-within:ring-rose sm:flex-row">
                <label htmlFor="hero-q" className="sr-only">Health claim</label>
                <input id="hero-q" value={q} onChange={(e) => { setQ(e.target.value); setMood(e.target.value ? "typing" : "idle"); }} onBlur={() => !q && setMood("idle")} placeholder="Paste a claim you saw… e.g. “ice baths boost immunity”" className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-burgundy rounded-[10px]" />
                <button disabled={q.trim().length < 8} className="btn-primary">Check this claim <ArrowRight size={16} /></button>
              </form>
              <p className="mt-3 text-base text-muted">Check before you buy. Track the money you keep.</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-base">
                <span className="text-fg/80">Or try:</span>
                {["Vitamin C prevents the common cold.", "Collagen improves skin elasticity.", "Celery juice cures eczema."].map((t) => (
                  <button key={t} onClick={() => go(t)} className="chip-lg max-w-full whitespace-normal text-left hover:!border-rose hover:!text-burgundy">{t.replace(".", "")} →</button>
                ))}
              </div>
              <Link href="/routine" className="mt-6 inline-flex min-h-11 items-center gap-1 text-base text-fg/80 hover:text-fg">Check your routine <ArrowRight size={14} /></Link>
            </Reveal>
          </div>
          <div className="relative min-w-0">
            <div className="h-[260px] sm:h-[360px] md:h-[460px]"><HeroScene mood={mood} onPoke={poke} /></div>
            <button onClick={poke} className="mx-auto mt-1 flex min-h-11 items-center gap-2 rounded-md px-3 text-base text-fg/80 hover:text-burgundy">
              Tap Vee for a viral claim <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-burgundy text-cream">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="display text-4xl text-cream sm:text-6xl">Watch a Reel get checked.</h2>
            <ol className="mt-8 divide-y divide-cream/15 border-y border-cream/15 text-lg">
              {["Paste the caption or link.", "We search PubMed, both sides.", "Get a verdict with sources."].map((step, i) => (
                <li key={step} className="flex items-baseline gap-4 py-4"><span className="font-[family-name:var(--font-display)] text-2xl text-blush">{i + 1}</span><span className="text-cream/90">{step}</span></li>
              ))}
            </ol>
          </div>
          <DemoCard onRun={go} />
        </div>
      </section>

      <div className="border-y border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-6 text-base text-muted sm:px-6">
          {["Live PubMed search", "Studies that disagree, shown too", "No sign-up"].map((fact) => <span key={fact}>{fact}</span>)}
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <SectionTitle title="Start here" sub="Choose a check." />
        <ul className="divide-y divide-line border-y border-line">
          {[
            { href: "/analyze", title: "Check a claim", description: "Read the research behind your feed." },
            { href: "/labs", title: "Understand my blood test", description: "Compare results with your lab’s reference ranges." },
            { href: "/routine", title: "Check my skincare & supplements", description: "Find duplicates to discuss with a clinician." },
            { href: "/visit", title: "Book a home skin check", description: "Request a licensed partner clinician." },
          ].map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="group rounded-md transition-colors duration-150 hover:bg-subtle focus-visible:bg-subtle grid min-h-11 grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 py-6 sm:grid-cols-[1fr_1fr_auto]">
                <h3 className="display text-left text-2xl group-hover:text-burgundy sm:col-start-1 sm:row-start-1 sm:text-3xl">{item.title}</h3>
                <p className="col-start-1 row-start-2 max-w-[65ch] text-base text-muted sm:col-start-2 sm:row-start-1">{item.description}</p>
                <ArrowRight aria-hidden="true" size={20} className="col-start-2 row-start-1 justify-self-end text-burgundy transition-transform group-hover:translate-x-1 sm:col-start-3" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl border-t border-line px-4 py-16 sm:py-24 sm:px-6">
        <SectionTitle eyebrow="How it works" title="How it works" sub="" />
        <ol className="divide-y divide-line border-t border-line">
          {[
            { n: "01", t: "Paste or snap", d: "Bring a claim, screenshot, or Reel transcript." },
            { n: "02", t: "Split into claims", d: "Separate claims and flag missing details." },
            { n: "03", t: "Search both sides", d: "Find supporting and conflicting research." },
            { n: "04", t: "Weigh, don't count", d: "Read the verdict and its sources." },
          ].map((s, k) => (
            <li key={s.n} className="grid grid-cols-[2rem_1fr] gap-4 py-6 sm:grid-cols-[3rem_1fr_1.5fr]">
              <span className="text-lg text-muted">{k + 1}.</span>
              <h3 className="display text-2xl">{s.t}</h3>
              <p className="col-start-2 max-w-[65ch] text-base text-fg/80 sm:col-start-auto">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl border-t border-line px-4 py-16 sm:py-24 sm:px-6">
        <SectionTitle title="The verdict scale" sub="Thin evidence gets an uncertain verdict." />
        <table className="w-full border-collapse text-left text-base">
          <thead><tr className="border-y border-line"><th scope="col" className="w-2/5 py-4 pr-4 font-medium sm:w-64">Verdict</th><th scope="col" className="py-4 font-medium">What it means</th></tr></thead>
          <tbody>
            {(Object.keys(VERDICTS) as Verdict[]).map((v) => (
              <tr key={v} className="border-b border-line">
                <th scope="row" className="py-5 pr-4 align-top font-normal"><VerdictBadge verdict={v} size="sm" /></th>
                <td className="py-5 align-top text-ink/80">{VERDICTS[v].blurb}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mx-auto max-w-6xl border-t border-line px-4 py-16 sm:py-24 sm:px-6">
        <SectionTitle eyebrow="Beyond one claim" title={<>Explore partner care</>} sub="Services from licensed partner clinicians." />
        <div className="grid gap-x-10 md:grid-cols-[1.2fr_1fr]">
          {Object.values(SERVICES).map((service, k) => (
            <Reveal key={service.id} delay={k * 0.06} className={`flex flex-col border-t border-line py-7 ${k === 0 ? "md:row-span-2 md:pr-10" : ""}`}>
              
              <h3 className={k === 0 ? "display mt-4 text-4xl" : "mt-4 text-xl font-semibold"}>{service.name} · ${service.price}</h3>
              <p className="mt-2 text-base text-muted">{service.mode}</p>
              <details className="mt-3 flex-1 text-base text-fg/80"><summary className="min-h-11 cursor-pointer">Details</summary><p>{service.short}</p></details>
              <Link href={service.id.startsWith("lab") ? "/labs" : "/visit"} className="mt-5 inline-flex min-h-11 items-center gap-2 text-base text-burgundy">Request service <ArrowRight size={16} /></Link>
            </Reveal>
          ))}
        </div>

      </section>

      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-24 border-t border-line px-4 py-16 sm:py-24 sm:px-6">
        <SectionTitle title="Choose your care" sub="Claim and routine checks are free." />
        <div className="grid border-y border-line md:grid-cols-3">
          {PLANS.filter((p) => p.id !== "free").map((p) => (
            <div key={p.id} className={`flex flex-col border-b border-line px-5 py-8 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 ${p.id === "skin" ? "bg-burgundy text-cream" : ""}`}>
              <h3 className="display text-3xl">{p.name}</h3>
              <p className="mt-5"><span className="display text-4xl">${p.monthly}</span><span className="text-base"> / month</span></p>
              <p className="mt-3 text-base">{p.commitment}</p>
              <details className="mt-4 flex-1 text-base"><summary className="min-h-11 cursor-pointer">Details</summary><p>{p.tagline}</p></details>
              <Link href="/plans" className={`mt-6 inline-flex min-h-11 items-center gap-2 text-base font-medium ${p.id === "skin" ? "text-cream" : "text-burgundy"}`}>Explore {p.name} <ArrowRight size={16} /></Link>
            </div>
          ))}
        </div>
        <p className="mt-5 text-base text-muted">Pilot: local requests; no payment or clinician dispatched.</p>
      </section>

      <section className="mx-auto max-w-6xl border-t border-line px-4 py-16 sm:py-24 sm:px-6">
        <Reveal className="relative overflow-hidden rounded-[10px] bg-burgundy p-8 text-center text-cream sm:p-16">
          
          <h2 className="display relative mx-auto max-w-3xl text-5xl sm:text-7xl">Check a claim</h2>
          <p className="relative mx-auto mt-5 max-w-lg text-base text-cream">Read the studies and their limits.</p>
          <Link href="/analyze" className="btn relative mt-9 bg-surface text-base text-burgundy hover:bg-subtle">Check a claim <ArrowRight size={17} /></Link>
        </Reveal>
      </section>
    </>
  );
}
