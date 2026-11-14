"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Search } from "lucide-react";
import ReportView from "@/components/ReportView";
import { AppointmentCard, ClaimCard, CreatorsTable, LivingFeed, EmptyHistory, dateGroup } from "@/components/HistoryParts";
import { cancelBooking, downloadICS, listBookings, type Booking } from "@/lib/booking";
import { deleteThread, getThread, listThreads, runAnalysis, saveReport, type Thread } from "@/lib/store";
import { listSavings, savingsTotals, removeSaving, usd, SAVINGS_EVENT, type SavingEntry } from "@/lib/savings";
import { SavingsList } from "@/components/HistoryParts";
import { isStale } from "@/lib/living";
import type { Verdict } from "@/lib/types";

const filters: { label: string; verdicts: Verdict[] }[] = [
  { label: "All", verdicts: [] }, { label: "True-ish", verdicts: ["supported", "partially_supported"] },
  { label: "Misleading", verdicts: ["misleading", "contradicted"] }, { label: "Not enough evidence", verdicts: ["insufficient_evidence"] },
];
const tabs = ["Claims", "Creators you checked", "Money kept", "Appointments", "All activity"] as const;
export default function History() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [savings, setSavings] = useState<SavingEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [tab, setTab] = useState<typeof tabs[number]>("Claims");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const checking = useRef(false);
  const autoStarted = useRef(false);
  const [progress, setProgress] = useState("");
  const [failed, setFailed] = useState<Thread[]>([]);
  async function recheckMany(queue: Thread[]) {
    if (checking.current || !queue.length) return;
    checking.current = true; setFailed([]);
    const errors: Thread[] = [];
    try {
      for (const [index, candidate] of queue.entries()) {
        const t = getThread(candidate.id);
        if (!t?.versions.length) continue;
        setBusy(t.id);
        const label = `Checking ${index + 1} of ${queue.length}`;
        setProgress(label);
        try {
          const report = await runAnalysis(t.versions[0].input, e => { if (e.type === "stage") setProgress(`${label} · ${e.stage}`); });
          if (report.status === "failed" || report.status === "insufficient_input" || !report.claims.length || report.claims.some(c => !c.assessment.retrieval_complete)) throw new Error("Incomplete search");
          if (getThread(t.id)) {
            saveReport(report, t.id);
            if (!getThread(t.id)?.versions.some(v => v.id === report.id)) throw new Error("Save failed");
          }
        } catch { errors.push(t); setFailed([...errors]); }
      }
      setProgress(`Checked ${queue.length - errors.length} of ${queue.length}`);
    } finally { checking.current = false; setBusy(null); }
  }
  useEffect(() => {
    const load = () => { setThreads(listThreads().filter(t => t.versions.length)); setBookings(listBookings()); setSavings(listSavings()); setNow(new Date()); setReady(true); };
    load();
    if (!autoStarted.current) { autoStarted.current = true; void recheckMany(listThreads().filter(isStaleThread => isStale(isStaleThread))); }
    window.addEventListener(SAVINGS_EVENT, load);
    window.addEventListener("veto:store", load); window.addEventListener("storage", load); window.addEventListener("focus", load);
    return () => { window.removeEventListener(SAVINGS_EVENT, load); window.removeEventListener("veto:store", load); window.removeEventListener("storage", load); window.removeEventListener("focus", load); };
  }, []);
  const latestClaims = threads.flatMap(t => t.versions.at(-1)!.claims);
  const upcoming = bookings.filter(b => b.status === "requested" && new Date(b.slot_iso) >= now).sort((a, b) => a.slot_iso.localeCompare(b.slot_iso));
  const past = bookings.filter(b => !upcoming.some(u => u.id === b.id)).sort((a, b) => b.slot_iso.localeCompare(a.slot_iso));
  const filtered = threads.map(thread => ({ thread, claims: thread.versions.at(-1)!.claims.filter(c =>
    (!filters[filter].verdicts.length || filters[filter].verdicts.includes(c.assessment.verdict)) &&
    `${c.claim.normalized_text} ${c.claim.verbatim_text} ${c.assessment.bottom_line}`.toLowerCase().includes(q.trim().toLowerCase())) }))
    .filter(row => row.claims.length || (!row.thread.versions.at(-1)!.claims.length && !filter && row.thread.title.toLowerCase().includes(q.trim().toLowerCase())));
  const current = threads.find(t => t.id === open);
  async function recheck(t: Thread) { await recheckMany([t]); }
  const claimCard = ({ thread, claims }: typeof filtered[number]) => <ClaimCard key={thread.id} thread={thread} claims={claims} busy={busy !== null} open={() => setOpen(thread.id)} recheck={() => void recheck(thread)} remove={() => { if (confirm("Delete this report and all its versions from this device?")) { deleteThread(thread.id); setNotice("Report deleted."); } }} />;
  const appointmentCard = (b: Booking) => <AppointmentCard key={b.id} booking={b} calendar={booking => { try { downloadICS(booking); setNotice("Calendar downloaded. Request unconfirmed."); } catch { setNotice("Calendar download failed. Try Add to calendar again."); } }} cancel={() => { if (confirm("Cancel this appointment request?")) { cancelBooking(b.id); const saved = listBookings(); setBookings(saved); setNotice(saved.find(x => x.id === b.id)?.status === "cancelled" ? "Request cancelled." : "Cancellation could not be saved. Please try again."); } }} />;
  return <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6">
    <div className="relative">
      {notice && <p role="status" className="mb-5 rounded-[10px] border border-line p-4 text-base text-fg">{notice}</p>}
      {current ? <><button onClick={() => setOpen(null)} className="btn-ghost mb-6 min-h-11 text-base"><ArrowLeft size={18} />Back to dashboard</button><ReportView key={`${current.id}-${current.versions.length}`} thread={current} onRecheck={() => void recheck(current)} rechecking={busy === current.id} /></> : <>
        <motion.header><h1 className="page-heading">Your dashboard</h1><p className="mt-4 text-lg text-fg/80">Saved on this device.</p><Link href="/analyze" className="btn-primary mt-6">Check a claim</Link></motion.header>
        {!ready ? <p role="status" className="mt-8 text-base">Loading your history…</p> : <>
          <dl aria-label="Dashboard summary" className="my-10 grid grid-cols-1 divide-y divide-line border-y border-line sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {[[`${usd(savingsTotals(savings).yearly)} / year`, "Money kept"], [latestClaims.length, "Claims checked"], [latestClaims.filter(c => ["misleading", "contradicted"].includes(c.assessment.verdict)).length, "Myths caught"], [upcoming.length, "Upcoming appointments"]].map(([value, label]) => <div key={label} className="py-6 sm:px-6 first:sm:pl-0"><dd className="display text-5xl tabular-nums">{value}</dd><dt className="mt-2 text-base text-muted">{label}</dt></div>)}
          </dl>

          {!!threads.length && <section aria-label="Living verdicts" className="mb-10 border-b border-line pb-6">
            <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="display text-3xl">Living verdicts</h2><button disabled={busy !== null || !threads.length} onClick={() => void recheckMany(threads)} className="btn-ghost min-h-11 disabled:opacity-50">Re-check all now</button></div>
            {progress && <p role="status" className="mt-3 text-base">{progress}</p>}
            {!!failed.length && <div role="alert" className="mt-3"><p className="text-base text-danger">{failed.length} re-checks incomplete or unsaved.</p><button disabled={busy !== null} className="btn-ghost min-h-11 disabled:opacity-50" onClick={() => void recheckMany(failed)}>Retry failed checks</button></div>}
            <LivingFeed threads={threads} open={id => setOpen(id)} />
          </section>}
          <nav aria-label="History views" className="mb-8 flex max-w-full flex-wrap border-b border-line">{tabs.map(t => <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)} className={`relative min-h-11 border-b-2 px-4 py-3 text-base focus-visible:outline-2 focus-visible:outline-burgundy ${tab === t ? "border-burgundy text-burgundy" : "border-transparent text-muted hover:text-ink"}`}><span className="relative">{t}</span></button>)}</nav>
          <AnimatePresence mode="wait"><motion.div key={tab}>
            {(tab === "Claims" || tab === "All activity") && <section aria-label="Claims">
              {!!threads.length && <div className="mb-6 space-y-4"><label htmlFor="history-search" className="block text-base">Search claim checks</label><div className="relative"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-fg/80" /><input id="history-search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search a claim or takeaway" className="field min-h-11 !pl-11 text-base" /></div><div className="flex flex-wrap gap-2" aria-label="Filter by verdict">{filters.map((f, i) => <button key={f.label} aria-pressed={filter === i} onClick={() => setFilter(i)} className={`min-h-11 rounded-md border px-4 py-2 text-base ${filter === i ? "border-rose bg-blush-pale text-burgundy" : "border-line text-fg/80"}`}>{f.label}</button>)}</div></div>}
              {tab === "Claims" && (threads.length === 0 ? <EmptyHistory /> : filtered.length === 0 ? <div className="card p-8"><h2 className="text-xl">No matching claims</h2><p className="mt-2 text-base text-fg/80">Try another word or clear your filters.</p><button className="btn-ghost mt-4 min-h-11" onClick={() => { setQ(""); setFilter(0); }}>Clear filters</button></div> : ["Today", "Yesterday", "This week", "Earlier"].map(group => { const rows = filtered.filter(r => dateGroup(r.thread.updated_at, now) === group); return rows.length > 0 && <section key={group} className="mb-8"><h2 className="display mb-4 text-3xl">{group}</h2><div className="divide-y divide-line"><AnimatePresence>{rows.map(claimCard)}</AnimatePresence></div></section>; }))}
            </section>}
            {tab === "Creators you checked" && <CreatorsTable threads={threads} />}
            {tab === "Money kept" && <SavingsList entries={savings} remove={removeSaving} />}
            {tab === "Appointments" && <section aria-label="Appointments"><p className="mb-6 text-base text-fg/80">Pilot: local requests; no payment or clinician dispatched.</p>{!bookings.length ? <EmptyHistory appointments /> : <>{[["Upcoming", upcoming], ["Past / Cancelled", past]].map(([label, items]) => <section key={label as string} className="mb-8"><h2 className="display mb-4 text-3xl">{label as string}</h2><div className="divide-y divide-line">{(items as Booking[]).length ? <AnimatePresence>{(items as Booking[]).map(appointmentCard)}</AnimatePresence> : <p className="text-base text-fg/80">No requests in this section.</p>}</div></section>)}<Link href="/labs" className="btn-ghost min-h-11">Explore more care</Link></>}</section>}
            {tab === "All activity" && <section aria-label="All activity"><h2 className="display mb-4 text-3xl">Your activity timeline</h2><div className="divide-y divide-line"><AnimatePresence>{[...filtered.map(row => ({ key: `t-${row.thread.id}`, date: row.thread.updated_at, node: claimCard(row) })), ...bookings.map(b => ({ key: `b-${b.id}`, date: b.created_at, node: appointmentCard(b) }))].sort((a, b) => b.date.localeCompare(a.date)).map((item, i, items) => <div key={item.key}>{(i === 0 || dateGroup(items[i - 1].date, now) !== dateGroup(item.date, now)) && <h3 className="display border-b border-line py-5 text-3xl">{dateGroup(item.date, now)}</h3>}{item.node}</div>)}</AnimatePresence></div>{!threads.length && !bookings.length ? <EmptyHistory /> : !filtered.length && !bookings.length && <p className="text-base text-fg/80">No activity matches your filters.</p>}</section>}
          </motion.div></AnimatePresence>
          {tab !== "Appointments" && bookings.length > 0 && <p className="mt-6 text-base text-muted">Pilot: local requests; no payment or clinician dispatched.</p>}
        </>}
      </>}
    </div>
  </div>;
}
