"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, Check, ChevronDown, CircleHelp, Flag, Minus, RotateCw, Share2, ShieldAlert } from "lucide-react";
import { VERDICTS, type ClaimReport, type EvidenceSource, type Report, type Stance } from "@/lib/types";
import { VerdictBadge } from "@/components/ui";
import SavingsPrompt from "@/components/SavingsPrompt";
import { addChallenge, type Thread } from "@/lib/store";

const STANCE: Record<Stance, { label: string; short: string; color: string }> = {
  supports: { label: "Agrees with the claim", short: "Agree", color: "var(--color-support)" },
  contradicts: { label: "Found no effect / the opposite", short: "No effect / opposite", color: "var(--color-contradict)" },
  neutral: { label: "Unclear or off-target", short: "Unclear", color: "var(--color-insufficient)" },
};
const GLOSSARY: Record<string, string> = {
  "Meta-analysis": "Pools the results of many studies into one answer. Top of the evidence ladder.",
  "Systematic review": "Researchers collect every study on a question and grade them together.",
  "Clinical guideline": "Official recommendation from a medical body, based on reviews of evidence.",
  "Randomized trial": "People are randomly split into treatment vs. placebo. The gold standard for one study.",
  "Clinical trial": "A study that tests a treatment in people, without full randomization.",
  "Observational study": "Watches what happens to people over time. Shows links, not cause and effect.",
  "Narrative review": "An expert's summary of the literature. Useful context, not proof.",
  "Case report": "What happened to one or a few patients. Not proof.",
  "Animal / lab study": "Done in mice, rats or cells. Often doesn't translate to people.",
  "Other study": "A paper type we couldn't classify as stronger evidence.",
};
const RUNGS = [
  { label: "Meta-analyses & guidelines", test: (e: EvidenceSource) => e.design_weight >= 4.5 },
  { label: "Randomized trials", test: (e: EvidenceSource) => e.design_weight >= 3 && e.design_weight < 4.5 },
  { label: "Observational studies", test: (e: EvidenceSource) => e.design_weight >= 2 && e.design_weight < 3 },
  { label: "Weak: reviews, case & animal studies", test: (e: EvidenceSource) => e.design_weight < 2 },
];

function Term({ t }: { t: string }) {
  return (
    <span tabIndex={0} className="group/term relative cursor-help border-b border-dotted border-muted/60">
      {t}
      <span role="tooltip" className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 w-60 rounded-[10px] border border-line bg-subtle p-3 text-base normal-case leading-relaxed tracking-normal text-fg/90 opacity-0  transition group-hover/term:opacity-100 group-focus/term:opacity-100">{GLOSSARY[t] ?? t}</span>
    </span>
  );
}

/** Original text with each extracted claim highlighted by verdict colour (exact source offsets). */
function HighlightedInput({ report }: { report: Report }) {
  const text = report.input.text;
  const spans = report.claims.filter((c) => c.claim.source_offsets.end > 0).map((c) => ({ ...c.claim.source_offsets, color: VERDICTS[c.assessment.verdict].color })).sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let i = 0;
  spans.forEach((s, k) => {
    if (s.start < i) return;
    parts.push(text.slice(i, s.start));
    parts.push(<mark key={k} className="rounded px-0.5 text-fg" style={{ background: `color-mix(in srgb, ${s.color} 10%, white)`, boxShadow: `inset 0 -2px 0 ${s.color}` }}>{text.slice(s.start, s.end)}</mark>);
    i = s.end;
  });
  parts.push(text.slice(i));
  return <p className="max-w-[65ch] max-h-40 overflow-auto whitespace-pre-wrap text-base leading-relaxed text-muted">{parts}</p>;
}

function StrengthMeter({ label }: { label: string }) {
  const lvl = { "Very weak": 1, Weak: 2, Moderate: 3, Strong: 4 }[label] ?? 1;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2" title="How much solid, consistent research we found. Not the chance the claim is true.">
      <p className="text-base text-muted">Evidence strength (uncalibrated)</p>
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="flex gap-1">{[1, 2, 3, 4].map((n) => <span key={n} className="h-2 w-6 rounded-sm" style={{ background: n <= lvl ? "var(--color-signal)" : "var(--color-line)" }} />)}</span>
        <span className="text-base font-semibold">{label}</span>
      </div>
    </div>
  );
}

/** Evidence ladder: every study is a dot, placed by design strength and coloured by direction. */
function Ladder({ evidence, onPick }: { evidence: EvidenceSource[]; onPick: (pmid: string) => void }) {

  return (
    <div className="border-y border-line py-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="display text-2xl">Evidence ladder</h4>
        <p className="text-base text-muted">Select a dot to read a study.</p>
      </div>
      <div className="divide-y divide-line">
        {RUNGS.map((r, ri) => {
          const items = evidence.filter(r.test);
          return (
            <div key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0 py-2 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_auto]">
              <p className={`text-base ${ri === 3 ? "text-muted" : "text-fg/80"}`}>{r.label}</p>
              <div className="order-3 col-span-2 flex min-w-0 flex-wrap items-center sm:order-none sm:col-span-1">
                {items.length === 0 && <span className="text-base text-muted">none found</span>}
                {items.map((e) => {

                  const c = STANCE[e.stance].color;
                  return (
                    <motion.button key={e.pmid} onClick={() => onPick(e.pmid)}
                      title={`${STANCE[e.stance].short} · ${e.study_design} ${e.year}: ${e.title}`} aria-label={`${STANCE[e.stance].short}: ${e.title}`}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-md focus-visible:outline-2 focus-visible:outline-burgundy transition-colors duration-150 ease-out hover:bg-blush-pale/40" ><span className="h-4 w-4 rounded-full border-2" style={{ borderColor: c, background: e.counts_as_proof ? c : "transparent" }} /></motion.button>
                  );
                })}
              </div>
              <span className="tabular-nums text-base text-muted" aria-label={`${items.length} studies`}>{items.length}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-base text-muted">
        {(Object.keys(STANCE) as Stance[]).map((s) => <span key={s} className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: STANCE[s].color }} />{STANCE[s].short}</span>)}
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full border-2 border-muted" />hollow = doesn&apos;t count as proof</span>
      </div>
    </div>
  );
}

function StudyRow({ e, number, open, onToggle }: { e: EvidenceSource; number: number; open: boolean; onToggle: () => void }) {
  const c = STANCE[e.stance].color;
  const line = e.ai_reason ?? e.conclusion?.split(/(?<=\.)\s/)[0] ?? "No abstract on PubMed, so the direction isn't assessed.";
  return (
    <motion.li id={`study-${e.pmid}`}
      className={`scroll-mt-28 border-b transition-colors duration-150 ease-out ${open ? "border-rose/40 bg-cream/60" : "border-line"}`}>
      <button onClick={onToggle} aria-expanded={open} className="flex min-h-11 w-full items-start gap-3 px-0 py-4 text-left transition-colors duration-150 ease-out hover:bg-cream/60 focus-visible:outline-2 focus-visible:outline-burgundy">
        <span className="shrink-0 tabular-nums text-muted">[{number}]</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-semibold leading-relaxed text-ink">{e.title}</span>
          <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-2 text-base text-muted"><span>{e.journal} · {e.year}</span><span className="rounded-md border border-line px-2 py-0.5"><Term t={e.study_design} /></span></span>
          <span className="mt-4 flex flex-wrap items-center gap-2 text-base" style={{ color: c }}>{e.stance === "supports" ? <Check size={18} aria-hidden="true" /> : e.stance === "contradicts" ? <Minus size={18} aria-hidden="true" /> : <CircleHelp size={18} aria-hidden="true" />}<b>{STANCE[e.stance].short}</b>{!e.counts_as_proof ? " · does not count as proof" : ""}{e.retrieved_via === "contradiction" ? " · no-effect search" : ""}</span>
          <span className="mt-2 block max-w-[70ch] text-base leading-relaxed text-ink/85">{line}</span>

        </span>
        <ChevronDown size={16} className={`mt-1 shrink-0 text-muted transition-transform duration-150 ease-out ${open ? "rotate-180" : ""}`} />
      </button>
      <a href={e.url} target="_blank" rel="noopener noreferrer" className="mb-2 ml-8 inline-flex min-h-11 items-center gap-1 text-base text-rose underline decoration-rose/30 transition-colors duration-150 ease-out hover:text-burgundy">Read on PubMed <ArrowUpRight size={16} /></a>
      <AnimatePresence>
        {open && (
          <motion.div className="overflow-hidden">
            <div className="space-y-3 border-t border-line px-4 pb-4 pt-3 pl-10 text-base">
              <p className="font-mono break-all text-base text-muted">PMID {e.pmid}</p>
              {e.conclusion && <p className="text-muted"><b className="text-fg/90">The authors conclude:</b> {e.conclusion}</p>}
              <p className="text-base text-muted">{e.doi && <span className="font-mono break-all">DOI {e.doi} · </span>}{e.rationale}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

function ChallengeForm({ threadId, claimId }: { threadId: string; claimId: string }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [why, setWhy] = useState("");
  const [sent, setSent] = useState(false);
  if (sent) return <p className="flex items-center gap-2 text-base text-support"><Flag size={14} /> Challenge saved · awaiting review</p>;
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="btn-ghost !py-2 text-base"><Flag size={14} /> Challenge verdict</button>
      <AnimatePresence>
        {open && (
          <motion.form className="overflow-hidden"
            onSubmit={(ev) => { ev.preventDefault(); if (!confirm("Submit this challenge for review?")) return; addChallenge(threadId, { claim_id: claimId, source_url: url, explanation: why }); setSent(true); }}>
            <div className="mt-3 grid gap-3">
              <label className="sr-only" htmlFor={`u-${claimId}`}>Source URL</label>
              <input id={`u-${claimId}`} required type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Link to a study or official source (https://…)" className="field" />
              <label className="sr-only" htmlFor={`w-${claimId}`}>Explanation</label>
              <textarea id={`w-${claimId}`} required value={why} onChange={(e) => setWhy(e.target.value)} placeholder="What did we miss?" rows={2} className="field" />
              <button className="btn-ghost w-fit min-h-11 text-base">Submit challenge</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ClaimCard({ r, index, threadId }: { r: ClaimReport; index: number; threadId?: string }) {
  const { claim, assessment: a, evidence } = r;
  const [filter, setFilter] = useState<Stance | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [fine, setFine] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  async function shareVerdict() {
    const url = `${location.origin}/check?q=${encodeURIComponent(claim.normalized_text)}&run=1`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "VetoHealth verdict", text: `${VERDICTS[a.verdict].label}: ${claim.normalized_text}`, url });
        setShareStatus("");
      } else {
        await navigator.clipboard.writeText(url);
        setShareStatus("Link copied");
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setShareStatus("Sharing failed. Try again.");
    }
  }
  const count = (s: Stance) => evidence.filter((e) => e.stance === s).length;
  const list = evidence.filter((e) => filter === "all" || e.stance === filter);
  const pick = (pmid: string) => { setFilter("all"); setOpenId(pmid); setTimeout(() => document.getElementById(`study-${pmid}`)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" }), 60); };

  return (
    <motion.article id={`claim-${index}`}
      className="relative min-w-0 scroll-mt-24 rounded-[10px] border border-line bg-surface">

      {/* 1 · the claim */}
      <div className="relative px-5 pt-6 sm:px-8 sm:pt-8">
        <h3 className="display max-w-[45ch] break-words text-3xl leading-[1.15] sm:text-[2.6rem]">“{claim.normalized_text}”</h3>
      </div>

      {/* 2 · the answer */}
      <div className="relative mt-6 border-y border-line bg-cream/60 px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <VerdictBadge verdict={a.verdict} size="lg" />
          <button onClick={() => void shareVerdict()} className="btn-ghost !px-3 text-base"><Share2 size={18} aria-hidden="true" />Share verdict</button>
        </div>
        <p className="display mt-6 max-w-[45ch] break-words text-2xl leading-[1.25] sm:text-3xl">{a.bottom_line}</p>
        <div className="mt-6 border-t border-line pt-4"><StrengthMeter label={a.strength_label} /></div>
        {shareStatus && <p role="status" className="mt-2 text-base text-muted">{shareStatus}</p>}
        {!a.retrieval_complete && <p className="mt-4 flex items-start gap-2 text-base text-misleading"><AlertTriangle size={16} className="mt-0.5 shrink-0" /> Search incomplete: PubMed failed; evidence remains unassessed.</p>}
      </div>

      <div className="relative space-y-6 px-5 pb-6 pt-6 sm:px-8 sm:pb-8">
        {evidence.length === 0 ? (
          <div className="space-y-2 text-base">
            <p>{a.retrieval_complete ? "No published human studies matched this claim." : "The search is incomplete; evidence could not be assessed."}</p>
            {a.retrieval_complete && <p className="text-muted">A confident claim with no research behind it is a red flag.</p>}
            {a.queries[0] && <a href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(a.queries[0])}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-base text-rose underline underline-offset-4">Search PubMed yourself</a>}
          </div>
        ) : (
          <>
        {/* 3 · the numbers */}
        <section aria-label="Study directions" className="space-y-4">
          <h4 className="display text-2xl">What the studies found</h4>
          <div role="img" aria-label={(Object.keys(STANCE) as Stance[]).map(s => `${STANCE[s].short}: ${count(s)} of ${evidence.length} studies`).join("; ")} className="flex h-4 overflow-hidden rounded-md bg-subtle">
            {(Object.keys(STANCE) as Stance[]).filter(s => count(s) > 0).map(s => <span key={s} style={{ width: `${count(s) / evidence.length * 100}%`, background: STANCE[s].color }} />)}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {(Object.keys(STANCE) as Stance[]).map(s => <button key={s} aria-pressed={filter === s} onClick={() => setFilter(filter === s ? "all" : s)} className={`inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-base transition-colors duration-150 ease-out hover:bg-blush-pale/40 ${filter === s ? "bg-blush-pale text-burgundy" : "text-muted"}`}><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: STANCE[s].color }} />{STANCE[s].short}<span className="font-semibold tabular-nums text-ink">{count(s)}</span></button>)}
          </div>
        </section>

        {evidence.length >= 3 && <Ladder evidence={evidence} onPick={pick} />}

        {/* 4 · the studies */}
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h4 className="display text-2xl">References <span className="tabular-nums">({evidence.length})</span></h4>
            <div className="inline-flex max-w-full flex-wrap gap-1 rounded-lg border border-line p-1" role="group" aria-label="Filter references">
              {(["all", "supports", "contradicts", "neutral"] as const).map((f) => (
                <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)} className={`min-h-11 rounded-md px-3 py-2 text-base transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-burgundy ${filter === f ? "bg-blush-pale text-burgundy" : "text-muted hover:text-fg"}`}>{f === "all" ? "All" : f === "contradicts" ? "No effect" : STANCE[f].short} <span className="ml-1 tabular-nums">{f === "all" ? evidence.length : count(f)}</span></button>
              ))}
            </div>
          </div>
          <ul className="divide-y divide-line">
            <AnimatePresence mode="popLayout">
              {list.length ? list.map((e) => <StudyRow key={e.pmid} e={e} number={evidence.indexOf(e) + 1} open={openId === e.pmid} onToggle={() => setOpenId(openId === e.pmid ? null : e.pmid)} />) : (
                <motion.li key="empty" className="rounded-[10px] border border-dashed border-line p-6 text-center text-base text-muted">
                  No studies in this group.
                </motion.li>
              )}
            </AnimatePresence>
          </ul>
        </div>

          </>
        )}

        <details className="border-t border-line py-4"><summary className="min-h-11 cursor-pointer text-base font-medium">Details</summary>
        {a.plain_explainer && (
          <details className="border-t border-line py-5">
            <summary className="min-h-11 cursor-pointer text-base font-medium">Study summary · AI</summary>
            <p className="max-w-[65ch] text-base leading-relaxed text-fg/85">{a.plain_explainer}</p>
          </details>
        )}
        {a.safety_notes.length > 0 && (
          <div className="flex gap-3 border-t border-line py-5 text-base text-muted">
            <ShieldAlert size={18} className="mt-0.5 shrink-0" />
            <div><h4 className="mb-2 font-medium text-ink">Safety notes</h4><ul className="space-y-1">{a.safety_notes.map((l) => <li key={l}>{l}</li>)}</ul></div>
          </div>
        )}

        {/* 5 · fine print */}
        <div className="border-y border-line">
          <button onClick={() => setFine(!fine)} aria-expanded={fine} className="flex min-h-11 w-full items-center justify-between gap-3 p-5 text-left text-base focus-visible:outline-2 focus-visible:outline-burgundy">
            <span>Search details</span>
            <ChevronDown size={16} className="text-muted" />
          </button>
          <AnimatePresence>
            {fine && (
              <motion.div className="overflow-hidden">
                <div className="space-y-5 border-t border-line p-4 text-base">
                  <ul className="space-y-2 text-fg/75">{a.limitations.map((l) => <li key={l} className="flex gap-2"><span className="text-muted">•</span>{l}</li>)}</ul>
                  <div>
                    <h5 className="mb-2 text-base font-semibold">How we searched PubMed</h5>
                    <ul className="space-y-1 break-all text-base text-muted">{a.queries.map((q) => <li key={q}><a className="hover:text-burgundy" target="_blank" rel="noopener noreferrer" href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(q)}`}>{q} ↗</a></li>)}</ul>
                  </div>
                  <p className="text-base text-muted">rubric {a.rubric_version} · {a.model_version} · evidence strength {Math.round(a.confidence_score * 100)}/100 (uncalibrated) · AI-generated, not clinician-reviewed</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {threadId && <ChallengeForm threadId={threadId} claimId={claim.claim_id} />}
        </details>
        <a href="/care" className="inline-flex min-h-11 items-center text-base text-rose underline underline-offset-4">Discuss with a clinician</a>
      </div>
    </motion.article>
  );
}

export default function ReportView({ thread, onRecheck, rechecking }: { thread: Thread; onRecheck?: () => void; rechecking?: boolean }) {
  const [vi, setVi] = useState(thread.versions.length - 1);
  const report = thread.versions[Math.min(vi, thread.versions.length - 1)];
  const prev = vi > 0 ? thread.versions[vi - 1] : null;
  const changed = prev && report.claims.some((c, i) => prev.claims[i] && prev.claims[i].assessment.verdict !== c.assessment.verdict);
  const savingsClaim = report.claims.find((c) => ["misleading", "contradicted", "insufficient_evidence", "partially_supported"].includes(c.assessment.verdict));
  const studies = report.claims.reduce((n, c) => n + c.evidence.length, 0);
  return (
    <div className="min-w-0 space-y-8 break-words">
      <div className="border-y border-line py-6 sm:py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow">You checked · {report.input.content_type.replace(/_/g, " ")}{report.input.source_url ? ` · ${new URL(report.input.source_url).hostname}` : ""}</p>
          <div className="flex flex-wrap items-center gap-2">
            {thread.versions.length > 1 && thread.versions.map((v, i) => (
              <button key={v.id} onClick={() => setVi(i)} className={`chip min-h-11 !text-base ${i === vi ? "!border-rose !bg-blush-pale !text-burgundy" : ""}`}>v{v.version}</button>
            ))}
            {onRecheck && <button onClick={onRecheck} disabled={rechecking} className="btn-ghost !py-1.5 text-base"><RotateCw size={13} className={rechecking ? "animate-spin" : ""} /> Re-check evidence</button>}
          </div>
        </div>
        <HighlightedInput report={report} />
        <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base text-fg/80"><b className="text-fg">{report.claims.length} claim{report.claims.length === 1 ? "" : "s"}</b> · <b className="text-fg">{studies} PubMed studies</b> · {new Date(report.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
          <div className="flex flex-wrap gap-1.5">
            {report.claims.map((c, i) => (
              <a key={c.claim.claim_id} href={`#claim-${i}`} className="chip min-h-11 !text-base !py-1" style={{ borderColor: VERDICTS[c.assessment.verdict].color }}>
                {i + 1}. {VERDICTS[c.assessment.verdict].label}
              </a>
            ))}
          </div>
        </div>
        {changed && <p className="mt-4 rounded-[10px] border border-rose/30 bg-blush-pale/10 p-3 text-base text-burgundy">Verdict changed since v{prev!.version}. Compare versions above.</p>}
        {report.warnings.map((w) => <p key={w} className="mt-3 flex items-start gap-2 text-base text-partial"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{w}</p>)}
      </div>
      {report.claims.map((c, i) => <ClaimCard key={c.claim.claim_id} r={c} index={i} threadId={thread.id} />)}
      {savingsClaim && (
        <section className="border-y border-line px-5 py-5 sm:px-8">
          <h4 className="mb-3 text-base font-medium">Money kept</h4>
          <SavingsPrompt key={`${report.id}-${savingsClaim.claim.claim_id}`} label={savingsClaim.claim.normalized_text} />
        </section>
      )}
    </div>
  );
}
