"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays, Download, RotateCw, Trash2 } from "lucide-react";
import { VerdictBadge } from "@/components/ui";
import { SERVICES } from "@/lib/pricing";
import { usd, type SavingEntry } from "@/lib/savings";
import type { Booking } from "@/lib/booking";
import type { Thread } from "@/lib/store";
import type { ClaimReport } from "@/lib/types";
import { VERDICTS } from "@/lib/types";
import { diffVersions } from "@/lib/living";

export function LivingFeed({ threads, open }: { threads: Thread[]; open: (id: string) => void }) {
  const updated = threads.filter(t => t.versions.length > 1);
  return !updated.length ? <p className="mt-4 text-base text-muted">Re-check saved claims to see evidence updates.</p> : <ul className="mt-4 divide-y divide-line">{updated.map(t => {
    const prev = t.versions.at(-2)!;
    const next = t.versions.at(-1)!;
    const diffs = diffVersions(prev, next);
    const added = new Set(diffs.flatMap(d => d.newPmids)).size;
    const moved = diffs.filter(d => d.changed);
    return <li key={t.id} className="py-4">
      <button className="min-h-11 max-w-full break-words text-left text-base text-burgundy underline underline-offset-4" onClick={() => open(t.id)}>{t.title}</button>
      <p className="text-base text-muted">{added} newly found studies since {new Date(prev.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
      {moved.slice(0, 1).map((d, i) => <p key={i} className="text-base">Verdict moved {d.verdictBefore ? VERDICTS[d.verdictBefore].label : "Absent"} → {d.verdictAfter ? VERDICTS[d.verdictAfter].label : "Absent"}</p>)}
      <details className="text-base"><summary className="min-h-11 cursor-pointer">{moved.length ? `${moved.length} verdict changes` : "Verdicts unchanged"}</summary>
        {diffs.map((d, i) => <p key={i} className="py-2">Claim {i + 1}: {d.verdictBefore ? VERDICTS[d.verdictBefore].label : "Absent"} → {d.verdictAfter ? VERDICTS[d.verdictAfter].label : "Absent"}</p>)}
        <p>{new Set(diffs.flatMap(d => d.removedPmids)).size} studies absent from this search.</p>
        <p>Search differences can reflect retrieval changes.</p>
      </details>
    </li>;
  })}</ul>;
}

export function CreatorsTable({ threads }: { threads: Thread[] }) {
  const creators = new Map<string, { handle: string; total: number; supported: number; unsupported: number; last: string }>();
  for (const thread of threads) {
    const report = thread.versions.at(-1);
    const raw = report?.input.creator?.trim();
    if (!raw || !report) continue;
    const handle = `@${raw.replace(/^@+/, "")}`;
    const key = handle.toLowerCase();
    const row = creators.get(key) ?? { handle, total: 0, supported: 0, unsupported: 0, last: report.created_at };
    row.total += report.claims.length;
    row.supported += report.claims.filter(c => ["supported", "partially_supported"].includes(c.assessment.verdict)).length;
    row.unsupported += report.claims.filter(c => ["insufficient_evidence", "misleading", "contradicted"].includes(c.assessment.verdict)).length;
    if (report.created_at > row.last) row.last = report.created_at;
    creators.set(key, row);
  }
  return <section aria-label="Creators you checked">
    <h2 className="display text-3xl">Creators you checked</h2>
    <p className="my-4 text-base text-muted">From your checks only. Not a rating of the person.</p>
    {!creators.size ? <p className="text-base">Add a creator handle when you check a Reel or TikTok.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-base tabular-nums"><caption className="sr-only">Creator claims from your checks</caption><thead><tr className="border-b border-line">{["Handle", "Claims checked", "Supported/partly", "Not supported", "Last checked"].map(h => <th key={h} scope="col" className="p-3 font-medium">{h}</th>)}</tr></thead><tbody>{[...creators.values()].sort((a, b) => b.last.localeCompare(a.last)).map(row => <tr key={row.handle.toLowerCase()} className="border-b border-line"><th scope="row" className="max-w-48 break-words p-3 font-medium">{row.handle}</th><td className="p-3">{row.total}</td><td className="p-3">{row.supported}</td><td className="p-3">{row.unsupported}</td><td className="whitespace-nowrap p-3">{new Date(row.last).toLocaleDateString()}</td></tr>)}</tbody></table></div>}
    <details className="mt-4 text-base"><summary className="min-h-11 cursor-pointer">Count details</summary><p>Not supported includes insufficient, misleading, and contradicted evidence verdicts.</p><p>Counts use each thread’s latest version, including incomplete searches.</p></details>
  </section>;
}

export function dateGroup(iso: string, now: Date) {
  const day = new Date(iso); day.setHours(0, 0, 0, 0);
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const week = new Date(today); week.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  if (day.getTime() === today.getTime()) return "Today";
  if (day.getTime() === yesterday.getTime()) return "Yesterday";
  return day >= week && day <= today ? "This week" : "Earlier";
}
export function evidenceChanged(thread: Thread, claim: ClaimReport) {
  const normalize = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
  return thread.versions.slice(0, -1).some(v => v.claims.some(c =>
    normalize(c.claim.normalized_text) === normalize(claim.claim.normalized_text) && c.assessment.verdict !== claim.assessment.verdict));
}
export function ClaimCard({ thread, claims, busy, open, recheck, remove }: {
  thread: Thread; claims: ClaimReport[]; busy: boolean; open: () => void; recheck: () => void; remove: () => void;
}) {
  return <motion.article className="py-6 sm:py-8">
    <p className="mb-4 text-base text-muted">{new Date(thread.updated_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} · {thread.versions.length} {thread.versions.length === 1 ? "version" : "versions"}{thread.challenges.length > 0 && ` · ${thread.challenges.length} challenges`}</p>
    <div className="space-y-6">{claims.map(c => <div key={c.claim.claim_id} className="space-y-3">
      <div className="flex flex-wrap items-center gap-2"><VerdictBadge verdict={c.assessment.verdict} size="sm" />{evidenceChanged(thread, c) && <span className="text-base text-muted">Evidence changed</span>}</div>
      <h3 className="display text-2xl break-words sm:text-3xl">{c.claim.normalized_text}</h3>
      <details className="text-base text-muted"><summary className="min-h-11 cursor-pointer">Details</summary><p className="max-w-[65ch]">{c.assessment.bottom_line}</p></details>
      <p className="text-base text-muted">{c.evidence.length} studies{!c.assessment.retrieval_complete && " · Search incomplete"}</p>
    </div>)}</div>
    {!claims.length && <h3 className="text-lg">{thread.title}</h3>}
    <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
      <button onClick={open} className="btn-ghost min-h-11 text-base">Open report</button>
      <button onClick={recheck} disabled={busy} className="btn-ghost min-h-11 text-base disabled:opacity-50"><RotateCw size={16} className={busy ? "animate-spin" : ""} />{busy ? "Checking…" : "Re-check"}</button>
      <button onClick={remove} className="btn-ghost min-h-11 text-base"><Trash2 size={16} />Delete</button>
    </div>
  </motion.article>;
}
export function AppointmentCard({ booking: b, cancel, calendar }: { booking: Booking; cancel: () => void; calendar: (b: Booking) => void }) {
  const service = SERVICES[b.kind];
  return <motion.article className="py-6 sm:py-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="display text-2xl">{service.name}</h3><span className="text-base text-muted">{b.status === "cancelled" ? "Cancelled" : "Requested · unconfirmed"}</span></div>
    <p className="mt-4 flex items-start gap-2 text-base"><CalendarDays size={18} className="mt-1 shrink-0" />{new Date(b.slot_iso).toLocaleString([], { dateStyle: "full", timeStyle: "short" })}</p>
    <p className="mt-2 text-base text-muted">{b.address ? `${b.address.line1}, ${b.address.city}, ${b.address.state} ${b.address.zip}` : b.kind === "lab_review" ? service.mode : "Video call"}</p>
    <p className="mt-3 text-base"><span className="display tabular-nums text-3xl">${service.price}</span> at launch</p>
    {b.status === "requested" && <div className="mt-5 flex flex-wrap gap-2"><button onClick={() => calendar(b)} className="btn-ghost min-h-11 text-base"><Download size={16} />Add to calendar</button><button onClick={cancel} className="btn-ghost min-h-11 text-base">Cancel request</button></div>}
  </motion.article>;
}
export function EmptyHistory({ appointments = false }: { appointments?: boolean }) {
  return <div className="card p-8 text-center sm:p-12"><h2 className="display text-4xl">{appointments ? "Your next step in care." : "Your evidence, in one place."}</h2><p className="mx-auto mt-3 max-w-[65ch] text-base text-muted">{appointments ? "Your lab reviews and skin visit requests." : "Check a claim to start your ledger."}</p><div className="mt-6 flex flex-wrap justify-center gap-3">{appointments ? <><Link href="/labs" className="btn-ghost min-h-11">Explore lab reviews</Link><Link href="/visit" className="btn-ghost min-h-11">Explore skin visits</Link></> : <Link href="/check" className="btn-ghost min-h-11">Check a claim</Link>}</div></div>;
}

export function SavingsList({ entries, remove }: { entries: SavingEntry[]; remove: (id: string) => void }) {
  return <section aria-label="Money kept">
    <h2 className="display mb-4 text-3xl">Money kept</h2>
    {!entries.length ? <p className="text-base text-muted">$0 so far. Check a claim before you buy.</p> :
      <ul className="divide-y divide-line border-y border-line">{entries.map(entry =>
        <li key={entry.id} className="flex flex-wrap items-center gap-4 py-5 text-base">
          <span className="min-w-0 flex-1 break-words">{entry.label}</span>
          <span className="text-muted">{entry.source === "claim" ? "Claim" : "Shelf"}</span>
          <span className="tabular-nums">{usd(entry.monthly_usd)}/month</span>
          <button className="btn-ghost min-h-11" aria-label={`Remove saving: ${entry.label}`} onClick={() => remove(entry.id)}>Remove saving</button>
        </li>)}</ul>}
  </section>;
}
