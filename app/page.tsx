"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { VerdictBadge } from "@/components/ui";
import { VERDICTS, type Verdict } from "@/lib/types";
import { SERVICES } from "@/lib/pricing";
import type { Mood } from "@/components/HeroScene";
import { listThreads } from "@/lib/store";
import { listBookings } from "@/lib/booking";
import { savingsTotals, SAVINGS_EVENT, usd } from "@/lib/savings";
import ReelDemo from "@/components/ReelDemo";
import HeroStage from "@/components/HeroStage";

/** The promise, with the verb that changes what people do with a claim. */
const VERBS = ["buy", "believe", "share", "try"];

const VERDICT_MEANINGS: [Verdict, string][] = [
  ["supported", "Good-quality human evidence backs the claim as stated."],
  ["partially_supported", "Some evidence agrees, with limits or caveats."],
  ["insufficient_evidence", "Too few relevant studies, or retrieval was incomplete."],
  ["misleading", "Some truth, but the claim overstates the findings."],
  ["contradicted", "Better-quality evidence points the other way."],
];

export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [mood, setMood] = useState<Mood>("idle");
  const go = (t: string) => { setMood("checking"); router.push(`/check?q=${encodeURIComponent(t)}&run=1`); };
  const reduced = useReducedMotion();
  const [verb, setVerb] = useState(0);
  // The highlight animates to each verb's real width (measured), so "it." glides instead of jumping.
  const measure = useRef<(HTMLSpanElement | null)[]>([]);
  const [widths, setWidths] = useState<number[]>([]);
  useEffect(() => {
    const calc = () => setWidths(measure.current.map(el => el?.getBoundingClientRect().width ?? 0));
    calc();
    void document.fonts?.ready.then(calc);
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  useEffect(() => {
    router.prefetch("/check");
    if (reduced) return;
    const id = window.setInterval(() => setVerb(v => (v + 1) % VERBS.length), 2600);
    return () => window.clearInterval(id);
  }, [reduced, router]);

  const [preview, setPreview] = useState<{ ready: boolean; verdict?: Verdict; shelf?: string; care?: string; money?: string }>({ ready: false });
  useEffect(() => {
    const refresh = () => {
      const next: typeof preview = { ready: true };
      try {
        const report = listThreads()[0]?.versions.at(-1);
        const verdict = report?.claims[0]?.assessment?.verdict;
        if (verdict && verdict in VERDICTS) next.verdict = verdict;
      } catch { /* Unreadable local data falls back to a labelled example. */ }
      try {
        const products: unknown = JSON.parse(localStorage.getItem("veto:routine") ?? "[]");
        if (Array.isArray(products) && products.length) {
          const costs = products.map(p => p?.monthlyUsd).filter((n): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0);
          next.shelf = `${products.length} products · ${costs.length ? usd(costs.reduce((sum, n) => sum + n, 0)) + "/mo" + (costs.length < products.length ? " known cost" : " shelf cost") : "cost not added"}`;
        }
      } catch { /* Storage may be blocked or unreadable. */ }
      try {
        const booking = listBookings().filter(b => b.status === "requested" && Date.parse(b.slot_iso) > Date.now()).sort((a, b) => a.slot_iso.localeCompare(b.slot_iso))[0];
        if (booking) next.care = `${new Date(booking.slot_iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · requested, unconfirmed`;
      } catch { /* No readable upcoming request. */ }
      try { const totals = savingsTotals(); if (totals.count && Number.isFinite(totals.yearly)) next.money = `${usd(totals.yearly)}/year kept`; } catch { /* No readable savings. */ }
      setPreview(next);
    };
    refresh();
    const events = ["storage", "veto:store", SAVINGS_EVENT, "focus"];
    events.forEach(event => window.addEventListener(event, refresh));
    return () => events.forEach(event => window.removeEventListener(event, refresh));
  }, []);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 pb-14 pt-8 sm:px-6 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:gap-10 md:py-16">
          <div className="min-w-0">
            <h1 className="display relative text-[clamp(3.1rem,7vw,5.75rem)]">
              <span className="sr-only">Check it before you buy it.</span>
              <span aria-hidden="true">Check it before you{" "}
                <span className="pointer-events-none invisible absolute left-0 top-0 h-0 w-0 overflow-hidden whitespace-nowrap">{VERBS.map((v, i) => <span key={v} ref={el => { measure.current[i] = el; }} className="inline-block px-1 italic">{v}</span>)}</span>
                <motion.span animate={widths[verb] ? { width: widths[verb] } : undefined} transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }} className="mark relative inline-flex overflow-hidden whitespace-nowrap align-baseline">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span key={VERBS[verb]} initial={{ y: "90%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }} exit={{ y: "-90%", opacity: 0 }} transition={{ duration: 0.38, ease: [0.2, 0.8, 0.2, 1] }} className="inline-block italic">
                      {VERBS[verb]}
                    </motion.span>
                  </AnimatePresence>
                </motion.span>{" "}it.
              </span>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-fg/80">
              Viral claims, products and lab results, checked against published research in seconds.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); if (q.trim().length >= 8) go(q); }} className="mt-8 flex max-w-xl flex-col gap-2 rounded-[10px] border border-line bg-surface p-2 focus-within:ring-2 focus-within:ring-rose sm:flex-row">
              <label htmlFor="hero-q" className="sr-only">Health claim</label>
              <input id="hero-q" value={q} onChange={(e) => { setQ(e.target.value); setMood(e.target.value ? "typing" : "idle"); }} onBlur={() => !q && setMood("idle")} placeholder="Paste a claim or a Reel link…" className="min-w-0 flex-1 rounded-[10px] bg-transparent px-4 py-3 text-base outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-burgundy" />
              <button disabled={q.trim().length < 8} className="btn-primary">Check this claim <ArrowRight size={16} /></button>
            </form>
            <dl className="mt-8 grid max-w-xl grid-cols-3 divide-x divide-line border-y border-line">
              {[["37M+", "PubMed papers searched"], ["~10 s", "to a verdict"], ["$0", "no sign-up, ever"]].map(([n, l]) => (
                <div key={l} className="px-3 py-3 first:pl-0">
                  <dt className="sr-only">{l}</dt>
                  <dd className="font-display text-2xl tabular-nums text-burgundy sm:text-3xl">{n}</dd>
                  <dd className="mt-1 text-base leading-snug text-muted">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative min-w-0">
            <HeroStage mood={mood} onCheck={(t) => go(`${t}.`)} />
            <p className="mt-2 text-center text-base text-muted">Tap a post or Vee. It runs a real check.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="display text-4xl sm:text-5xl">The loop</h2>
        <ol className="mt-12 grid gap-0 md:grid-cols-4">
          {[
            { name: "Check", line: "Read the research behind a claim.", href: "/check", live: preview.verdict ? <VerdictBadge verdict={preview.verdict} /> : null, example: <VerdictBadge verdict="insufficient_evidence" /> },
            { name: "Shelf", line: "See your products and their overlaps.", href: "/shelf", live: preview.shelf, example: "4 products · $80/mo shelf cost" },
            { name: "Care", line: "Bring your questions to a clinician.", href: "/care", live: preview.care, example: "Lab consult · tomorrow, 10 am" },
            { name: "Ledger", line: "Keep your checks and money saved.", href: "/ledger", live: preview.money, example: "$240/year kept" },
          ].map((step, i) => <li key={step.name} className="relative flex min-w-0 flex-col border-l border-blush pb-10 pl-8 last:pb-0 md:border-l-0 md:border-t md:pb-0 md:pl-0 md:pr-6 md:pt-10">
            <span className="absolute -left-2 top-2 h-4 w-4 rounded-full border border-rose bg-cream md:-top-2 md:left-0" aria-hidden="true" />
            <div className="mb-4 flex items-center gap-3 text-rose" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {i === 0 ? <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></> : i === 1 ? <><path d="m12 3 10 5-10 5L2 8Z" /><path d="m2 12 10 5 10-5M2 16l10 5 10-5" /></> : i === 2 ? <><path d="M6 3H3v5a5 5 0 0 0 10 0V3h-3M8 13v3a5 5 0 0 0 10 0v-3" /><circle cx="18" cy="10" r="3" /></> : <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /><path d="M10 2v8l3-2 3 2V2" /></>}
              </svg>
              <span className="eyebrow tabular-nums">0{i + 1}</span>
            </div>
            <h3 className="display text-3xl">{step.name}</h3>
            <p className="mt-3 text-base text-muted md:min-h-14">{step.line}</p>
            <div className="mt-6 min-h-28 break-words rounded-md border border-line bg-surface p-4 text-base [&_.chip]:text-base [&>span]:max-w-full" aria-live="polite">{!preview.ready ? "Loading your device preview…" : <>{!step.live && <span className="eyebrow mb-2 block">Example</span>}{step.live || step.example}</>}</div>
            <Link href={step.href} className="mt-4 inline-flex min-h-11 items-center gap-2 self-start text-base text-burgundy">Open {step.name} <ArrowRight size={16} /></Link>
          </li>)}
        </ol>
      </section>
      <section className="bg-burgundy text-cream">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"><ReelDemo /></div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="display text-4xl sm:text-5xl">Care when you want it</h2>
        <p className="mt-5 text-base text-muted">Services from licensed partner clinicians.</p>
        <div className="mt-10 grid border-y border-line md:grid-cols-3 md:divide-x md:divide-line">
          {([
            { service: SERVICES.lab_review, href: "/labs?service=review", bullets: ["Written results explanation", "Reference-range context", "Questions for your doctor"] },
            { service: SERVICES.lab_consult, href: "/labs", bullets: ["Discuss your lab results", "Ask your questions", "Review next steps"] },
            { service: SERVICES.home_skin, href: "/visit", bullets: ["Skin-analysis equipment", "Written skin report", "Clinician-selected routine"] },
          ]).map(({ service, href, bullets }) => <div key={service.id} className="flex min-w-0 flex-col border-b border-line py-8 last:border-b-0 md:border-b-0 md:px-8 md:first:pl-0 md:last:pr-0">
            <h3 className="display text-3xl md:min-h-20">{service.name}</h3>
            <p className="display mt-6 text-6xl tabular-nums text-burgundy sm:text-7xl">{usd(service.price)}</p>
            <p className="mt-2 text-base text-muted md:min-h-14">{service.mode}{service.minutes > 0 ? ` · ${service.minutes} minutes` : ""}</p>
            <ul className="my-6 flex-1 space-y-3 text-base">{bullets.map(b => <li key={b} className="flex items-start gap-3"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0 text-rose"><path d="m20 6-11 11-5-5" /></svg><span>{b}</span></li>)}</ul>
            <Link href={href} className="inline-flex min-h-11 items-center gap-2 text-base text-burgundy">Book <span className="sr-only">{service.name}</span><ArrowRight size={16} /></Link>
          </div>)}
        </div>
        <p className="mt-6 max-w-4xl text-base leading-relaxed text-muted">Pilot: requests stored on this device; no payment taken or clinician dispatched. Payment via Stripe at launch. Contact details only when you book.</p>
        <Link href="/care" className="mt-5 inline-flex min-h-11 items-center gap-2 text-base text-burgundy">Compare care and memberships <ArrowRight size={16} /></Link>
      </section>
      <section id="verdicts" className="mx-auto max-w-6xl border-t border-line px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="display text-4xl sm:text-5xl">How verdicts work</h2>
        <ol aria-label="The five-verdict evidence scale, from supported to contradicted" className="mt-12 grid md:grid-cols-5">
          {VERDICT_MEANINGS.map(([verdict, meaning]) => <li key={verdict} className="relative min-w-0 border-l border-line pb-8 pl-6 last:pb-0 md:border-l-0 md:border-t md:pb-0 md:pl-0 md:pr-4 md:pt-8">
            <span aria-hidden="true" className="absolute -left-1 top-2 h-2 w-2 rounded-full bg-rose md:-top-1 md:left-0" />
            <div className="[&>span]:whitespace-normal [&>span]:text-base"><VerdictBadge verdict={verdict} /></div>
            <p className="mt-4 text-base leading-relaxed text-muted">{meaning}</p>
          </li>)}
        </ol>
        <ul className="mt-12 grid gap-6 border-y border-line py-8 text-base md:grid-cols-3 md:gap-8">
          {[
            { path: "m9 12 2 2 4-4M12 3l8 4v5c0 5-8 9-8 9s-8-4-8-9V7Z", text: "Human study quality matters more than study count." },
            { path: "M8 3 4 7l4 4M4 7h16M16 13l4 4-4 4M20 17H4", text: "Supporting and conflicting research both inform the verdict." },
            { path: "M9 8v8M15 8v8", text: "Thin evidence or incomplete retrieval means we abstain." },
          ].map(fact => <li key={fact.text} className="flex items-start gap-3"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0 text-rose"><path d={fact.path} /></svg><span>{fact.text}</span></li>)}
        </ul>
        <p className="mt-6 text-base text-muted">Sources: published research retrieved through <a href="https://pubmed.ncbi.nlm.nih.gov/" className="inline-flex min-h-11 items-center text-burgundy underline">PubMed</a>.</p>
      </section>
    </>
  );
}
