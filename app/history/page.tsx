"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Search, Trash2 } from "lucide-react";
import ReportView from "@/components/ReportView";
import { SectionTitle, VerdictBadge } from "@/components/ui";
import { deleteThread, listThreads, runAnalysis, saveReport, type Thread } from "@/lib/store";

export default function History() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const load = () => setThreads(listThreads());
    load();
    window.addEventListener("veto:store", load);
    return () => window.removeEventListener("veto:store", load);
  }, []);
  const filtered = threads.filter((t) => t.versions.some((v) => v.input.text.toLowerCase().includes(q.toLowerCase())));
  const current = threads.find((t) => t.id === open);

  async function recheck(t: Thread) {
    setBusy(true);
    try { saveReport(await runAnalysis(t.versions[0].input, () => {}), t.id); } catch { alert("Re-check failed — PubMed may be busy. Try again in a minute."); }
    setBusy(false);
  }

  return (
    <div className="relative mx-auto max-w-5xl px-4 pt-14 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 grid-bg" />
      {current ? (
        <div className="relative">
          <button onClick={() => setOpen(null)} className="btn-ghost mb-6 !py-2 text-xs"><ArrowLeft size={14} /> All reports</button>
          <ReportView key={current.versions.length} thread={current} onRecheck={() => recheck(current)} rechecking={busy} />
        </div>
      ) : (
        <div className="relative">
          <SectionTitle eyebrow="03 / History" title={<>Every verdict, <em className="text-signal">versioned.</em></>} sub="Saved on this device only. Re-check any report: we keep the old version next to the new one, so evidence changes never silently overwrite what you saw." />
          <div className="relative mb-6">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
            <label htmlFor="hq" className="sr-only">Search history</label>
            <input id="hq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your checked claims" className="field !pl-11" />
          </div>
          {filtered.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="display text-3xl">{threads.length ? "No matches." : "Nothing checked yet."}</p>
              <p className="mt-3 text-sm text-mute">{threads.length ? "Try another word." : "Your first veto is one paste away."}</p>
              {!threads.length && <Link href="/analyze" className="btn-primary mt-6">Check a claim</Link>}
            </div>
          ) : (
            <ul className="grid gap-3">
              <AnimatePresence>
                {filtered.map((t, i) => {
                  const last = t.versions.at(-1)!;
                  const changed = t.versions.length > 1 && last.claims.some((c, k) => t.versions.at(-2)!.claims[k]?.assessment.verdict !== c.assessment.verdict);
                  return (
                    <motion.li key={t.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }} exit={{ opacity: 0, x: -20 }}
                      className="card group flex flex-col gap-3 p-5 transition hover:border-bone/20 sm:flex-row sm:items-center sm:justify-between">
                      <button onClick={() => setOpen(t.id)} className="flex-1 text-left">
                        <p className="font-medium group-hover:text-signal">{t.title}</p>
                        <p className="mt-1 font-mono text-[11px] text-mute">{new Date(t.updated_at).toLocaleString()} · {last.claims.length} claim(s) · v{last.version}{t.challenges.length ? ` · ${t.challenges.length} challenge(s)` : ""}{changed && <span className="text-signal"> · evidence changed</span>}</p>
                      </button>
                      <div className="flex flex-wrap items-center gap-2">
                        {last.claims.map((c) => <VerdictBadge key={c.claim.claim_id} verdict={c.assessment.verdict} size="sm" />)}
                        <button aria-label="Delete report" onClick={() => confirm("Delete this report and all its versions from this device?") && deleteThread(t.id)} className="rounded-full p-2 text-mute hover:bg-contradict/10 hover:text-contradict"><Trash2 size={15} /></button>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
