"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { listThreads } from "@/lib/store";
import { listBookings, type Booking } from "@/lib/booking";
import { listReviews, saveReview, type ReviewDecision, type ReviewEntry } from "@/lib/expert";
import { VERDICTS, type ClaimReport, type Verdict } from "@/lib/types";

interface QueueItem { id: string; title: string; date: string; reason: string; type: string; challenged?: boolean; low?: boolean; claim?: ClaimReport; booking?: Booking; challenges?: string[] }
const filters = ["All", "Challenged claims", "Low-confidence verdicts", "Lab reviews", "Visits"] as const;
const date = (value: string) => new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
const serviceNames: Record<Booking["kind"], string> = { lab_review: "Written lab review", lab_consult: "Lab consultation", home_skin: "Home skin visit", skin_followup: "Skin follow-up" };

export default function ExpertPage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [selected, setSelected] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [reviewer, setReviewer] = useState("");
  const [decision, setDecision] = useState<ReviewDecision>("agree");
  const [verdict, setVerdict] = useState<Verdict>("insufficient_evidence");
  const [rationale, setRationale] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    function refresh() {
      try {
        const queue: QueueItem[] = listThreads().flatMap((thread) => thread.versions.flatMap((report) => report.claims.map((claim) => {
          const challenges = thread.challenges.filter((c) => c.claim_id === claim.claim.claim_id);
          const a = claim.assessment;
          return { id: `claim:${thread.id}:${report.id}:v${report.version}:${claim.claim.claim_id}`, title: claim.claim.normalized_text, date: report.created_at, type: `Claim · version ${report.version}`, challenged: challenges.length > 0, low: !a.retrieval_complete || a.strength_label === "Weak" || a.strength_label === "Very weak", reason: challenges.length ? "User challenge" : !a.retrieval_complete ? "Retrieval incomplete" : a.requires_human_review ? "Human review flagged" : a.strength_label === "Weak" || a.strength_label === "Very weak" ? "Low evidence strength" : "Routine review", claim, challenges: challenges.map((c) => c.explanation) };
        })));
        queue.push(...listBookings().filter((b) => b.status === "requested").map((booking) => ({ id: `booking:${booking.id}`, title: serviceNames[booking.kind], date: booking.created_at, type: booking.kind.startsWith("lab") ? "Lab request" : "Visit request", reason: "Consult request", booking })));
        queue.sort((a, b) => b.date.localeCompare(a.date));
        setItems(queue);
        setReviews(listReviews());
      } catch (e) { setError(e instanceof Error ? e.message : "Device data could not be loaded."); }
      setLoaded(true);
    }
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("veto:store", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("veto:store", refresh); };
  }, []);
  const visible = items.filter((item) => filter === "All" || filter === "Challenged claims" && item.challenged || filter === "Low-confidence verdicts" && item.low || filter === "Lab reviews" && item.booking?.kind.startsWith("lab") || filter === "Visits" && item.booking && !item.booking.kind.startsWith("lab"));
  const item = visible.find((i) => i.id === selected) ?? visible[0];
  const history = reviews.filter((r) => r.item_id === item?.id);
  const latest = history.at(-1);
  function choose(id: string) { setSelected(id); setDecision("agree"); setNote(""); setRationale(""); setMessage(""); }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!item) return;
    try {
      setReviews(saveReview({ item_id: item.id, reviewer, decision: item.booking ? "request_evidence" : decision, ...(decision === "change" && item.claim ? { verdict } : {}), rationale, note }));
      setError(""); setMessage("Decision saved on-device."); setNote(""); setRationale("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save the decision on this device."); }
  }
  return <main className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-16">
    <header className="max-w-3xl pb-10"><h1 className="display text-4xl sm:text-5xl">Expert review</h1><p className="mt-3 text-base text-muted">For clinicians</p><Link href="/" className="inline-flex min-h-11 items-center text-rose underline">Back to VetoHealth</Link></header>
    {error && <p role="alert" className="mb-6 rounded-md border border-danger p-4 text-danger">{error}</p>}
    {!loaded ? <p role="status">Loading device records…</p> : <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)]">
      <section aria-labelledby="queue-heading" className="min-w-0"><h2 id="queue-heading" className="display text-2xl">Review queue</h2><p className="mt-2 text-muted">{items.length} items on this device</p>
        <div aria-label="Queue filters" className="my-5 flex flex-wrap gap-2">{filters.map((f) => <button key={f} aria-pressed={filter === f} onClick={() => { setFilter(f); choose(""); }} className={`min-h-11 rounded-md border px-3 py-2 text-base ${filter === f ? "border-rose bg-blush-pale text-burgundy" : "border-line text-ink"}`}>{f}</button>)}</div>
        <ul className="divide-y divide-line border-y border-line">{visible.map((entry) => <li key={entry.id}><button onClick={() => choose(entry.id)} aria-pressed={item?.id === entry.id} className={`w-full break-words border-l-2 px-4 py-5 text-left ${item?.id === entry.id ? "border-rose bg-blush-pale/50" : "border-transparent hover:bg-subtle"}`}><span className="eyebrow">{entry.type}</span><span className="my-2 block font-medium">{entry.title}</span><span className="block text-base text-muted">{date(entry.date)}</span><span className="mt-2 block text-base text-burgundy">{entry.reason}</span></button></li>)}</ul>
        {!visible.length && <div className="py-8"><p>{items.length ? "No items match this filter." : "No queued items."}</p></div>}
      </section>
      {item && <section key={item.id} aria-labelledby="review-heading" className="min-w-0 lg:border-l lg:border-line lg:pl-10"><h2 id="review-heading" className="display break-words text-3xl">{item.title}</h2><p className="eyebrow mt-3">Submitted {date(item.date)}</p>
        {item.claim ? <div className="space-y-6 py-8"><div><h3 className="font-medium">AI verdict · {VERDICTS[item.claim.assessment.verdict].label}</h3><details className="mt-2"><summary className="cursor-pointer py-2">Details</summary><p>{item.claim.assessment.bottom_line}</p><p className="mt-3 text-muted">{item.claim.assessment.summary}</p></details><p className="mt-3 text-muted">Evidence strength (uncalibrated): {item.claim.assessment.strength_label}. Retrieval {item.claim.assessment.retrieval_complete ? "complete" : "incomplete"}.</p></div>
          {!!item.challenges?.length && <div><h3 className="font-medium">User challenges</h3>{item.challenges.map((text, i) => <p key={i} className="mt-2 break-words">{text}</p>)}</div>}
          <div><h3 className="font-medium">Evidence summary</h3><p className="mt-2 text-muted">{item.claim.evidence.length} references · {item.claim.assessment.supporting_source_ids.length} supporting · {item.claim.assessment.contradictory_source_ids.length} contradictory · {item.claim.assessment.neutral_source_ids.length} neutral</p><ol className="mt-4 divide-y divide-line">{[...item.claim.evidence].sort((a, b) => b.relevance - a.relevance).slice(0, 3).map((source) => <li key={source.pmid} className="py-3">{/^\d+$/.test(source.pmid) ? <a className="break-words text-burgundy underline" href={`https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`} target="_blank" rel="noreferrer">{source.title}</a> : <span>{source.title}</span>}<p className="mt-1 text-base text-muted">{source.journal} · {source.year} · {source.stance}</p></li>)}</ol>{!item.claim.evidence.length && <p className="mt-3 text-muted">Retrieval empty; evidence availability unknown.</p>}</div>
          {!!item.claim.assessment.safety_notes.length && <div><h3 className="font-medium">Safety notes</h3>{item.claim.assessment.safety_notes.map((text, i) => <p key={i} className="mt-2">{text}</p>)}</div>}
        </div> : item.booking && <div className="space-y-3 break-words py-8"><dl className="space-y-3">{Object.entries({ Name: item.booking.contact.name, Email: item.booking.contact.email, Phone: item.booking.contact.phone, "Requested time": date(item.booking.slot_iso), ...(item.booking.address ? { Address: Object.values(item.booking.address).filter(Boolean).join(", ") } : {}), ...item.booking.details }).map(([label, value]) => <div key={label}><dt className="text-muted">{label}</dt><dd className="whitespace-pre-wrap">{value || "Not provided"}</dd></div>)}</dl></div>}
        <div className="border-y border-line py-6"><h3 className="font-medium">Demo status timeline</h3><ol className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-muted"><li>Submitted</li><li aria-current={!latest || latest.decision === "request_evidence" ? "step" : undefined}>→ In review</li><li aria-current={latest && latest.decision !== "request_evidence" ? "step" : undefined}>→ {latest && latest.decision !== "request_evidence" ? "Reviewed (demo only)" : "Reviewed (pending)"}</li></ol></div>
        <form onSubmit={submit} className="space-y-5 py-8"><h3 className="display text-2xl">Demo review decision</h3><label className="block">Reviewer name<input className="field mt-2" value={reviewer} onChange={(e) => setReviewer(e.target.value)} required autoComplete="name" /></label>
          {item.claim ? <><fieldset><legend>Decision</legend><div className="mt-2 space-y-1">{([["agree", "Agree with verdict"], ["change", "Change verdict"], ["request_evidence", "Request more evidence"]] as const).map(([value, label]) => <label key={value} className="flex min-h-11 items-center gap-3"><input type="radio" name="decision" value={value} checked={decision === value} onChange={() => setDecision(value)} />{label}</label>)}</div></fieldset>{decision === "change" && <><label className="block">Proposed verdict<select className="field mt-2" value={verdict} onChange={(e) => setVerdict(e.target.value as Verdict)}>{Object.entries(VERDICTS).map(([value, v]) => <option key={value} value={value}>{v.label}</option>)}</select></label><label className="block">Rationale (required)<textarea className="field mt-2" value={rationale} onChange={(e) => setRationale(e.target.value)} required rows={3} /></label></>}</> : <p className="text-muted">Booking evidence request</p>}
          <label className="block">Clinical note<textarea className="field mt-2" value={note} onChange={(e) => setNote(e.target.value)} rows={4} /></label><button className="btn-primary" type="submit">Save {item.booking ? "request" : "decision"}</button><p role="status" className="text-muted">{message}</p>
        </form><section aria-label="Review audit trail"><h3 className="display text-2xl">Decision history</h3>{!history.length && <p className="py-4 text-muted">No decisions recorded.</p>}<ol className="mt-4 divide-y divide-line">{history.map((entry, i) => <li key={`${entry.timestamp}:${i}`} className="break-words py-4"><p className="font-medium">{entry.reviewer} · {entry.decision === "agree" ? "Agreed with verdict" : entry.decision === "change" ? `Proposed ${VERDICTS[entry.verdict!].label}` : "Requested more evidence"}</p><p className="eyebrow">{date(entry.timestamp)}</p>{entry.rationale && <p className="mt-2 whitespace-pre-wrap">{entry.rationale}</p>}{entry.note && <p className="mt-2 whitespace-pre-wrap">{entry.note}</p>}</li>)}</ol></section>
      </section>}
    </div>}
    <p className="mt-8 text-base text-muted">Demo: on-device only; no clinical certification, payment, or dispatch; verified clinician access required.</p>
  </main>;
}
