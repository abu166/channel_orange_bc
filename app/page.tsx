"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { VerdictBadge } from "@/components/ui";
import { VERDICTS, type Verdict } from "@/lib/types";
import { SERVICES } from "@/lib/pricing";
import type { Mood } from "@/components/HeroScene";
import { listThreads } from "@/lib/store";
import { listBookings } from "@/lib/booking";
import { savingsTotals, SAVINGS_EVENT, usd } from "@/lib/savings";
import ReelDemo from "@/components/ReelDemo";

/** Real claims circulating on social media; tapping Vee checks one live. */
const VIRAL = ["Seed oils are toxic", "Rosemary oil regrows hair", "Sugar causes acne", "Apple cider vinegar lowers blood sugar", "Cold plunges boost immunity", "Mouth taping improves sleep", "Ashwagandha reduces stress", "Red light therapy reduces wrinkles", "Creatine improves memory", "Coffee causes anxiety"];

// The 3D mascot loads on the client only, with a calm placeholder while three.js downloads.
const HeroScene = dynamic(() => import("@/components/HeroScene"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-[10px] bg-blush-pale/40" />,
});

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
  const poke = () => go(`${VIRAL[Math.floor(Math.random() * VIRAL.length)]}.`);

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
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 pb-12 pt-10 sm:px-6 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:py-20">
          <div className="min-w-0">
            <h1 className="display text-[clamp(3rem,6.5vw,5.5rem)]">
              Check it <span className="mark">before you buy it</span>.
            </h1>
            <div>
              <p className="mt-7 max-w-lg text-lg leading-relaxed text-fg/80">
                Claims, products and lab results, checked against published research.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); if (q.trim().length >= 8) go(q); }} className="mt-8 flex max-w-xl flex-col gap-2 rounded-[10px] border border-line bg-surface p-2  focus-within:ring-2 focus-within:ring-rose sm:flex-row">
                <label htmlFor="hero-q" className="sr-only">Health claim</label>
                <input id="hero-q" value={q} onChange={(e) => { setQ(e.target.value); setMood(e.target.value ? "typing" : "idle"); }} onBlur={() => !q && setMood("idle")} placeholder="Paste a claim you saw… e.g. “ice baths boost immunity”" className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-burgundy rounded-[10px]" />
                <button disabled={q.trim().length < 8} className="btn-primary">Check this claim <ArrowRight size={16} /></button>
              </form>
              <p className="mt-3 text-base text-muted">No sign-up. Your ledger stays on this device.</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-base">
                <span className="text-fg/80">Or try:</span>
                {["Vitamin C prevents the common cold.", "Collagen improves skin elasticity.", "Celery juice cures eczema."].map((t) => (
                  <button key={t} onClick={() => go(t)} className="chip-lg max-w-full whitespace-normal text-left hover:!border-rose hover:!text-burgundy">{t.replace(".", "")} →</button>
                ))}
              </div>
            </div>
          </div>
          <div className="relative min-w-0">
            <div className="h-[260px] sm:h-[360px] md:h-[460px]"><HeroScene mood={mood} onPoke={poke} /></div>
            <button onClick={poke} className="mx-auto mt-1 flex min-h-11 items-center gap-2 rounded-md px-3 text-base text-fg/80 hover:text-burgundy">
              Tap Vee for a viral claim <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>


      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="display text-4xl sm:text-5xl">The loop</h2>
        <ol className="mt-10 grid md:grid-cols-4">
          {[
            { name: "Check", line: "Read the research behind a claim.", href: "/check", live: preview.verdict ? <VerdictBadge verdict={preview.verdict} /> : null, example: <VerdictBadge verdict="insufficient_evidence" /> },
            { name: "Shelf", line: "See your products and their overlaps.", href: "/shelf", live: preview.shelf, example: "4 products · $80/mo shelf cost" },
            { name: "Care", line: "Bring your questions to a clinician.", href: "/care", live: preview.care, example: "Lab consult · tomorrow, 10 am" },
            { name: "Ledger", line: "Keep your checks and money saved.", href: "/ledger", live: preview.money, example: "$240/year kept" },
          ].map((step, i) => <li key={step.name} className="relative flex flex-col border-l border-line pb-8 pl-8 md:border-l-0 md:border-t md:pb-0 md:pl-0 md:pr-6 md:pt-8">
            <span className="absolute -left-4 top-0 grid h-8 w-8 place-items-center rounded-md border border-line bg-cream text-base tabular-nums md:-top-4 md:left-0">{i + 1}</span>
            <h3 className="display text-3xl">{step.name}</h3>
            <p className="mt-3 text-base text-muted">{step.line}</p>
            <div className="mt-5 flex-1 text-base" aria-live="polite">{!preview.ready ? "Loading your device preview…" : <>{!step.live && <span className="mb-2 block text-base text-muted">Example</span>}{step.live || step.example}</>}</div>
            <Link href={step.href} className="mt-4 inline-flex min-h-11 items-center gap-2 text-base text-burgundy">Open {step.name} <ArrowRight size={16} /></Link>
          </li>)}
        </ol>
      </section>
      <section className="bg-burgundy text-cream">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-2">
          <div><h2 className="display text-5xl text-cream">See it work</h2><p className="mt-6 text-lg">Follow an example from a Reel to an evidence verdict.</p><p className="mt-4 text-base text-cream/80">Illustrative demo; run the example for current research.</p></div>
          <ReelDemo onRun={go} />
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="display text-4xl sm:text-5xl">Care when you want it</h2>
        <p className="mt-5 text-base text-muted">Services from licensed partner clinicians.</p>
        <div className="mt-8 grid border-t border-line md:grid-cols-3">
          {([
            { service: SERVICES.lab_review, href: "/labs?service=review", bullets: ["Written results explanation", "Reference-range context", "Questions for your doctor"] },
            { service: SERVICES.lab_consult, href: "/labs", bullets: ["Discuss your lab results", "Ask your questions", "Review next steps"] },
            { service: SERVICES.home_skin, href: "/visit", bullets: ["Skin-analysis equipment", "Written skin report", "Clinician-selected routine"] },
          ]).map(({ service, href, bullets }) => <div key={service.id} className="flex flex-col border-b border-line py-8 md:px-6 md:first:pl-0 md:last:pr-0">
            <h3 className="display text-3xl md:min-h-20">{service.name}</h3>
            <p className="mt-5 text-5xl tabular-nums">{usd(service.price)}</p>
            <p className="mt-4 text-base text-muted md:min-h-14">{service.mode}{service.minutes > 0 ? ` · ${service.minutes} minutes` : ""}</p>
            <ul className="my-6 flex-1 space-y-3 text-base">{bullets.map(b => <li key={b}>{b}</li>)}</ul>
            <Link href={href} className="inline-flex min-h-11 items-center gap-2 text-base text-burgundy">Book <span className="sr-only">{service.name}</span><ArrowRight size={16} /></Link>
          </div>)}
        </div>
        <p className="mt-5 text-base text-muted">Pilot — request stored on this device; payment via Stripe on launch.</p>
        <p className="mt-2 text-base text-muted">No payment is taken or clinician dispatched in this prototype.</p>
        <p className="mt-2 text-base text-muted">Contact details only when you book.</p>
        <Link href="/care" className="mt-5 inline-flex min-h-11 items-center gap-2 text-base text-burgundy">Compare care and memberships <ArrowRight size={16} /></Link>
      </section>
      <section id="verdicts" className="mx-auto max-w-6xl border-t border-line px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="display text-4xl sm:text-5xl">How verdicts work</h2>
        <table className="mt-8 w-full text-left text-base"><caption className="sr-only">The five-verdict evidence scale</caption><thead><tr className="border-y border-line"><th scope="col" className="py-3 pr-3">Verdict</th><th scope="col" className="py-3">Meaning</th></tr></thead><tbody>
          {VERDICT_MEANINGS.map(([verdict, meaning]) => <tr key={verdict} className="border-b border-line"><th scope="row" className="py-4 pr-3 font-normal"><VerdictBadge verdict={verdict} size="sm" /></th><td className="py-4 text-muted">{meaning}</td></tr>)}
        </tbody></table>
        <ul className="mt-8 space-y-3 text-base"><li>Human study quality matters more than study count.</li><li>Supporting and conflicting research both inform the verdict.</li><li>Thin evidence or incomplete retrieval means we abstain.</li></ul>
        <p className="mt-6 text-base text-muted">Sources: published research retrieved through <a href="https://pubmed.ncbi.nlm.nih.gov/" className="inline-flex min-h-11 items-center text-burgundy underline">PubMed</a>.</p>
      </section>
    </>
  );
}
