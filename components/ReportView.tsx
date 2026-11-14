"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, ChevronDown, FlaskConical, Flag, RotateCw, ShieldAlert, Search } from "lucide-react";
import { VERDICTS, type ClaimReport, type EvidenceSource, type Report, type Stance } from "@/lib/types";
import { addChallenge, type Thread } from "@/lib/store";
import { VerdictBadge } from "./ui";

const STANCE: Record<Stance, { label: string; color: string }> = {
  supports: { label: "Supports", color: "var(--color-support)" },
  contradicts: { label: "Finds no effect / opposite", color: "var(--color-contradict)" },
  neutral: { label: "Unclear / off-target", color: "var(--color-insufficient)" },
};

/** Original text with each extracted claim highlighted by verdict colour (exact source offsets). */
function HighlightedInput({ report }: { report: Report }) {
  const text = report.input.text;
  const spans = report.claims.map((c) => ({ ...c.claim.source_offsets, color: VERDICTS[c.assessment.verdict].color })).sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let i = 0;
  spans.forEach((s, k) => {
    if (s.start < i) return;
    parts.push(text.slice(i, s.start));
    parts.push(<mark key={k} className="rounded px-0.5 text-bone" style={{ background: `color-mix(in srgb, ${s.color} 22%, transparent)`, boxShadow: `inset 0 -2px 0 ${s.color}` }}>{text.slice(s.start, s.end)}</mark>);
    i = s.end;
  });
  parts.push(text.slice(i));
  return <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-bone/70">{parts}</p>;
}

function Balance({ evidence }: { evidence: EvidenceSource[] }) {
  const w = (s: Stance) => evidence.filter((e) => e.stance === s).reduce((a, e) => a + e.design_weight * (e.non_human ? 0.3 : 1), 0);
  const vals = { supports: w("supports"), neutral: w("neutral"), contradicts: w("contradicts") };
  const total = vals.supports + vals.neutral + vals.contradicts || 1;
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-white/5">
        {(Object.keys(vals) as Stance[]).map((s, i) => (
          <motion.div key={s} initial={{ width: 0 }} animate={{ width: `${(vals[s] / total) * 100}%` }} transition={{ duration: 0.9, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }} style={{ background: STANCE[s].color }} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-mute">
        {(Object.keys(vals) as Stance[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: STANCE[s].color }} />{STANCE[s].label} · {vals[s].toFixed(1)}</span>
        ))}
        <span className="text-mute/60">weighted by study design</span>
      </div>
    </div>
  );
}

function SourceCard({ e }: { e: EvidenceSource }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.li layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-line bg-ink-3/60 p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2 font-mono text-[11px]">
        <span className="rounded-md px-2 py-0.5" style={{ color: STANCE[e.stance].color, background: `color-mix(in srgb, ${STANCE[e.stance].color} 12%, transparent)` }}>{STANCE[e.stance].label}</span>
        <span className="rounded-md bg-white/5 px-2 py-0.5 text-bone/80">{e.study_design}</span>
        <span className="text-mute">{e.year} · {e.journal}</span>
        {e.retrieved_via === "contradiction" && <span className="flex items-center gap-1 text-signal"><Search size={11} /> counter-search</span>}
      </div>
      <a href={e.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-start gap-1 text-[15px] font-medium leading-snug hover:text-signal">
        {e.title}<ArrowUpRight size={15} className="mt-0.5 shrink-0 opacity-50 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
      </a>
      <p className="mt-1 font-mono text-[11px] text-mute">PMID {e.pmid}{e.doi ? ` · doi:${e.doi}` : ""} · {e.rationale}</p>
      {e.conclusion ? (
        <button onClick={() => setOpen(!open)} className="mt-3 block w-full text-left text-sm text-bone/70">
          <span className={open ? "" : "line-clamp-2"}><b className="text-bone/90">Authors conclude:</b> {e.conclusion}</span>
          <span className="mt-1 inline-flex items-center gap-1 text-xs text-mute">{open ? "Less" : "More"} <ChevronDown size={12} className={open ? "rotate-180" : ""} /></span>
        </button>
      ) : <p className="mt-3 text-sm italic text-mute">No abstract available on PubMed — direction not assessed.</p>}
    </motion.li>
  );
}

function ChallengeForm({ threadId, claimId }: { threadId: string; claimId: string }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [why, setWhy] = useState("");
  const [sent, setSent] = useState(false);
  if (sent) return <p className="flex items-center gap-2 text-sm text-support"><Flag size={14} /> Challenge submitted · status: awaiting evidence review. It's saved with this report.</p>;
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="btn-ghost !py-2 text-xs"><Flag size={14} /> Challenge this verdict</button>
      <AnimatePresence>
        {open && (
          <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
            onSubmit={(ev) => { ev.preventDefault(); if (!confirm("Submit this challenge for review?")) return; addChallenge(threadId, { claim_id: claimId, source_url: url, explanation: why }); setSent(true); }}>
            <div className="mt-3 grid gap-3">
              <label className="sr-only" htmlFor={`u-${claimId}`}>Source URL</label>
              <input id={`u-${claimId}`} required type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Link to a study or official source (https://…)" className="field" />
              <label className="sr-only" htmlFor={`w-${claimId}`}>Explanation</label>
              <textarea id={`w-${claimId}`} required value={why} onChange={(e) => setWhy(e.target.value)} placeholder="What did we miss?" rows={2} className="field" />
              <button className="btn-primary w-fit !py-2 text-xs">Submit challenge</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ClaimCard({ r, index, threadId }: { r: ClaimReport; index: number; threadId?: string }) {
  const { claim, assessment: a, evidence } = r;
  const [tab, setTab] = useState<Stance>(a.supporting_source_ids.length ? "supports" : a.contradictory_source_ids.length ? "contradicts" : "neutral");
  const list = evidence.filter((e) => e.stance === tab);
  const v = VERDICTS[a.verdict];
  return (
    <motion.article initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="card relative overflow-hidden p-5 sm:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl" style={{ background: `color-mix(in srgb, ${v.color} 14%, transparent)` }} />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow mb-3">Claim {String(index + 1).padStart(2, "0")} · {claim.domain.replace("_", " ")} · {claim.claim_type}</p>
          <h3 className="display text-3xl sm:text-4xl">{claim.normalized_text}</h3>
          {claim.is_paraphrase && <p className="mt-2 text-xs text-mute">Split from: “{claim.verbatim_text}”</p>}
        </div>
        <VerdictBadge verdict={a.verdict} size="lg" stamp />
      </div>

      <p className="relative mt-6 max-w-3xl text-[15px] leading-relaxed text-bone/85">{a.summary}</p>
      {!a.retrieval_complete && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-misleading/30 bg-misleading/10 p-3 text-sm text-misleading"><AlertTriangle size={16} className="mt-0.5 shrink-0" /> Incomplete report: the evidence provider failed. This is not a “no evidence” finding.</p>
      )}

      <div className="relative mt-6 grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <Balance evidence={evidence} />
        <div className="flex flex-wrap content-start gap-1.5">
          {(Object.entries(claim.qualifiers) as [string, string | null][]).filter(([, val]) => val).map(([k, val]) => (
            <span key={k} className="chip !border-signal/40"><b className="font-mono text-[10px] uppercase text-signal">{k}</b> {val}</span>
          ))}
          {claim.missing_qualifiers.map((k) => <span key={k} className="chip border-dashed text-mute">no {k} stated</span>)}
          <span className="chip font-mono text-[10px]" title="Internal, uncalibrated score — not the probability the claim is true">strength {Math.round(a.confidence_score * 100)}/100 · uncalibrated</span>
        </div>
      </div>

      <div className="relative mt-8">
        <div role="tablist" className="mb-4 flex flex-wrap gap-2">
          {(["supports", "contradicts", "neutral"] as Stance[]).map((s) => {
            const n = evidence.filter((e) => e.stance === s).length;
            return (
              <button key={s} role="tab" aria-selected={tab === s} onClick={() => setTab(s)}
                className={`relative rounded-full px-4 py-2 text-xs transition ${tab === s ? "text-ink" : "text-bone/70 hover:text-bone"}`}>
                {tab === s && <motion.span layoutId={`tab-${claim.claim_id}`} className="absolute inset-0 rounded-full" style={{ background: STANCE[s].color }} />}
                <span className="relative">{STANCE[s].label} ({n})</span>
              </button>
            );
          })}
        </div>
        <ul className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {list.length ? list.map((e) => <SourceCard key={e.pmid} e={e} />) : (
              <motion.li key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-mute">No matched studies in this column.</motion.li>
            )}
          </AnimatePresence>
        </ul>
      </div>

      <div className="relative mt-8 grid gap-6 md:grid-cols-2">
        <div>
          <p className="eyebrow mb-3 flex items-center gap-2"><FlaskConical size={13} /> Limitations</p>
          <ul className="space-y-2 text-sm text-bone/70">{a.limitations.map((l) => <li key={l} className="flex gap-2"><span className="text-mute">—</span>{l}</li>)}</ul>
        </div>
        <div>
          <p className="eyebrow mb-3 flex items-center gap-2"><ShieldAlert size={13} /> Safety notes <span className="normal-case tracking-normal text-mute/60">(separate from the verdict)</span></p>
          {a.safety_notes.length ? <ul className="space-y-2 text-sm text-partial/90">{a.safety_notes.map((l) => <li key={l}>{l}</li>)}</ul> : <p className="text-sm text-mute">No specific safety flags for this claim. Still educational, not medical advice.</p>}
        </div>
      </div>

      <div className="relative mt-8 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-start sm:justify-between">
        <details className="text-xs text-mute">
          <summary className="cursor-pointer hover:text-bone">How we searched (reproducible)</summary>
          <ul className="mt-2 space-y-1 break-all font-mono">{a.queries.map((q) => <li key={q}><a className="hover:text-signal" target="_blank" rel="noopener noreferrer" href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(q)}`}>{q} ↗</a></li>)}</ul>
          <p className="mt-2">rubric {a.rubric_version} · model {a.model_version} · v{a.assessment_version} · AI-generated, not clinician-reviewed</p>
        </details>
        {threadId && <ChallengeForm threadId={threadId} claimId={claim.claim_id} />}
      </div>
    </motion.article>
  );
}

export default function ReportView({ thread, onRecheck, rechecking }: { thread: Thread; onRecheck?: () => void; rechecking?: boolean }) {
  const [vi, setVi] = useState(thread.versions.length - 1);
  const report = thread.versions[Math.min(vi, thread.versions.length - 1)];
  const prev = vi > 0 ? thread.versions[vi - 1] : null;
  const changed = prev && report.claims.some((c, i) => prev.claims[i] && prev.claims[i].assessment.verdict !== c.assessment.verdict);
  return (
    <div className="space-y-6">
      <div className="card p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow">Source · {report.input.content_type.replace(/_/g, " ")}{report.input.source_url ? ` · ${new URL(report.input.source_url).hostname}` : ""} · {new Date(report.created_at).toLocaleString()}</p>
          <div className="flex flex-wrap items-center gap-2">
            {thread.versions.length > 1 && thread.versions.map((v, i) => (
              <button key={v.id} onClick={() => setVi(i)} className={`chip font-mono ${i === vi ? "!border-signal !text-signal" : ""}`}>v{v.version}</button>
            ))}
            {onRecheck && <button onClick={onRecheck} disabled={rechecking} className="btn-ghost !py-1.5 text-xs"><RotateCw size={13} className={rechecking ? "animate-spin" : ""} /> Re-check evidence</button>}
          </div>
        </div>
        <HighlightedInput report={report} />
        {changed && <p className="mt-4 rounded-xl border border-signal/30 bg-signal/10 p-3 text-sm text-signal">Evidence changed since v{prev!.version} — at least one verdict moved. Older versions stay accessible above.</p>}
        {report.warnings.map((w) => <p key={w} className="mt-3 flex items-start gap-2 text-sm text-partial"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{w}</p>)}
      </div>
      {report.claims.map((c, i) => <ClaimCard key={c.claim.claim_id} r={c} index={i} threadId={thread.id} />)}
    </div>
  );
}
