"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Reveal } from "@/components/ui";
import SlotPicker from "@/components/SlotPicker";
import { assessLabValue, extractLabValues, SAMPLE_REPORT, type LabValue } from "@/lib/labs";
import { downloadICS, listBookings, saveBooking, type Booking } from "@/lib/booking";
import { PLANS, SERVICES, yearlySavings } from "@/lib/pricing";
const PILOT = "Pilot: saved on-device; no charge or clinician dispatch.";
const labPlan = PLANS.find(p => p.id === "lab")!;
const about: Record<string, string> = {
  Glucose: "Blood sugar when sampled.", HbA1c: "Average blood sugar over roughly three months.",
  "Total cholesterol": "Total cholesterol in blood.", LDL: "Cholesterol carried by low-density lipoproteins.", HDL: "Cholesterol carried by high-density lipoproteins.", Triglycerides: "Fat circulating in blood.",
  TSH: "Hormone signalling the thyroid.", "Free T4": "Available thyroid hormone in blood.", "Vitamin D 25-OH": "Marker of vitamin D status.", "Vitamin B12": "Vitamin B12 circulating in blood.", Ferritin: "Protein reflecting stored iron.", Iron: "Iron circulating in blood.",
  Hemoglobin: "Oxygen-carrying protein in red blood cells.", Hematocrit: "Proportion of blood containing red blood cells.", WBC: "White blood cell count.", Platelets: "Blood cells involved in clotting.",
  ALT: "Enzyme used in liver assessment.", AST: "Enzyme in liver, muscles, and other tissues.", Creatinine: "Waste product used to assess kidney filtering.", eGFR: "Estimated kidney filtering.", BUN: "Waste nitrogen filtered by kidneys.",
  Sodium: "Electrolyte involved in fluid balance.", Potassium: "Electrolyte supporting nerves and muscles.", Calcium: "Mineral supporting bones, nerves, and muscles.", CRP: "Inflammation marker; does not identify the cause.",
};
const steps = ["Upload", "Check values", "Choose review", "Request saved"];
export default function LabsPage() {
  const [choice, setChoice] = useState("written");
  useEffect(() => { if (new URLSearchParams(window.location.search).get("plan") === "lab") setChoice("lab"); }, []);
  const [step, setStep] = useState(0);
  const [rows, setRows] = useState<LabValue[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [slot, setSlot] = useState<string | null>(null);
  const [questions, setQuestions] = useState("");
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [booking, setBooking] = useState<Booking | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef(`${step}`);
  useEffect(() => {
    // Only scroll on real step changes. never on first load (keeps the hero visible).
    if (shownStep.current === `${step}`) return;
    shownStep.current = `${step}`;
    card.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    heading.current?.focus({ preventScroll: true });
  }, [step]);
  const lastFile = useRef<File | null>(null);
  const service = choice === "written" ? SERVICES.lab_review : SERVICES.lab_consult;
  
  const outside = rows.filter(r => r.flag === "low" || r.flag === "high").length;
  const pending = rows.filter(r => !checked[r.id]).length;
  function load(text: string) {
    const extracted = extractLabValues(text);
    setRows(extracted); setChecked({});
    if (!extracted.length) { setError("No supported markers found. Try a clearer photo, another report, or the sample report."); return; }
    setError(""); setStep(1);
  }
  async function upload(file: File) {
    if (busy) return;
    lastFile.current = file; setError("");
    if (file.size > 8 * 1024 * 1024) { setError("Choose a file of 8 MB or smaller."); return; }
    setBusy("Reading your report…");
    try {
      if (file.type === "application/pdf") {
        const body = new FormData(); body.append("file", file);
        const response = await fetch("/api/v1/labs/extract", { method: "POST", body });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not read PDF.");
        load(result.text);
      } else if (file.type.startsWith("image/")) {
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("eng", 1, { logger: (m: { status: string; progress: number }) => { if (m.status === "recognizing text") setBusy(`Reading photo on-device… ${Math.round(m.progress * 100)}%`); } });
        try { const { data } = await worker.recognize(file); load(data.text); }
        finally { await worker.terminate(); }
      } else throw new Error("Choose a PDF or photo.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not read report. Try again with a clearer file."); }
    finally { setBusy(""); }
  }
  function edit(id: string, field: "value" | "unit" | "ref_text" | "biomarker", text: string) {
    setRows(old => old.map(r => {
      if (r.id !== id) return r;
      const next = { ...r, [field]: text };
      return { ...next, ...assessLabValue(next.value, next.unit, next.ref_text) };
    }));
    setChecked(old => ({ ...old, [id]: false }));
  }
  function confirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if ((choice !== "written" && (!slot || new Date(slot).getTime() <= Date.now())) || pending) { setError("Check your values and choose an upcoming time for video."); return; }
    if (!contact.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) || !/^\+?[\d\s().-]+$/.test(contact.phone) || contact.phone.replace(/\D/g, "").length < 10 || contact.phone.replace(/\D/g, "").length > 15) { setError("Enter your name, valid email, and a phone number with 10–15 digits."); return; }
    const saved = saveBooking({ kind: service.id, slot_iso: choice === "written" ? new Date().toISOString() : slot!, duration_min: service.minutes, price_usd: choice === "lab" ? labPlan.monthly : service.price, plan_id: choice === "lab" ? "lab" : null, contact, address: null, details: { markers: JSON.stringify(rows), questions } });
    if (!listBookings().some(item => item.id === saved.id)) { setError("Could not save your request. Enable local storage and try again."); return; }
    setBooking(saved); setError(""); setStep(3);
  }
  return <section className="relative mx-auto max-w-6xl px-4 pt-16 sm:px-6 [&_.eyebrow]:text-base [&_.chip]:text-base [&_button]:min-h-11 [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-burgundy [&_input:not([type=checkbox]):not([type=file])]:min-h-11">
    <Reveal className="relative mb-10"><h1 className="page-heading">Your numbers.<br />A real conversation.</h1><p className="max-w-[65ch] mt-5 max-w-xl text-lg text-muted">Review your lab report with a licensed partner clinician.</p><a href="#lab-report" className="btn-primary mt-6">Review my report</a></Reveal>
    <ol aria-label="Lab consult progress" className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">{steps.map((label, i) => <li key={label} aria-current={i === step ? "step" : undefined} className={`border-t-2 pt-3 text-base ${i <= step ? "border-burgundy text-burgundy" : "border-line text-muted"}`}><span className="mr-2 tabular-nums">{i + 1}.</span>{label}</li>)}</ol>
    <div id="lab-report" ref={card} className="scroll-mt-24">
    <AnimatePresence mode="wait"><motion.div onAnimationComplete={() => heading.current?.focus({ preventScroll: true })} key={step} initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0 }} className="relative border-t border-line py-6 sm:py-8">
      {step === 0 && <div className="space-y-5">
        <h2 ref={heading} tabIndex={-1} className="display text-3xl focus-visible:outline-none">Start with your report.</h2>
        <div className="border-y border-line py-4"><label htmlFor="lab-upload" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) void upload(f); }} className="flex cursor-pointer flex-col items-center gap-3 rounded-md border border-dashed border-rose/50 bg-surface px-4 py-12 text-center transition-colors hover:bg-subtle focus-within:ring-2 focus-within:ring-rose">
          <input id="lab-upload" aria-label="Upload lab report PDF or photo" type="file" accept="application/pdf,image/*" disabled={!!busy} className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
          {busy ? <Loader2 size={20} className="animate-spin text-fg" /> : null}<span role="status">{busy || "Upload PDF or photo"}</span><span className="text-base text-muted">8 MB maximum · clear, single-column reports</span>
        </label>
        <button className="btn-ghost mx-auto mt-3 flex min-h-11" disabled={!!busy} onClick={() => load(SAMPLE_REPORT)}>Try sample</button></div>
        
        <p className="max-w-[65ch] text-base text-muted">Synthetic sample · photos read on-device · PDFs processed without storage.</p>
      </div>}
      {step === 1 && <div className="space-y-5">
        <h2 ref={heading} tabIndex={-1} className="display text-3xl">Check every detail.</h2><p className="max-w-[65ch] text-base text-muted">Compare every field with your report, correct errors, then confirm each marker.</p>
        <div className="flex flex-wrap gap-x-8 gap-y-2 border-y border-line">{[{ count: rows.filter(r => r.flag === "in_range").length, label: "In the lab’s range", color: "text-support" }, { count: outside, label: "Outside the lab’s range", color: "text-danger" }, { count: rows.filter(r => r.flag === "unknown").length, label: "Check this value", color: "text-fg" }].map(item => <div key={item.label} className="flex items-baseline gap-4 py-3"><p className={`font-sans text-xl tabular-nums ${item.color}`}>{item.count}</p><p className="max-w-[65ch] mt-2 text-base">{item.label}</p></div>)}</div>
        <p className="max-w-[65ch] text-base text-muted">{pending} unconfirmed · printed ranges do not establish health.</p>
        {!!outside && <p className="max-w-[65ch] rounded-md border border-partial/25 p-4 text-base">Values may need prompt attention. Unwell? Contact your doctor today; emergencies: call 911.</p>}
        <button className="btn-ghost min-h-11" onClick={() => setChecked(old => ({ ...old, ...Object.fromEntries(rows.filter(r => !r.issues.length).map(r => [r.id, true])) }))}>Confirm checked values</button>
        <p className="max-w-[65ch] text-base text-muted">Review flagged rows individually; extraction may omit markers.</p>
        <table className="block w-full table-fixed border-collapse text-left text-base tabular-nums md:table">
          <caption className="mb-4 text-left text-muted">Your results · editable</caption>
          <thead className="sr-only md:not-sr-only md:table-header-group"><tr>{["Marker", "Your value", "Unit", "Lab range", "Status"].map(label => <th key={label} scope="col" className="border-b border-line px-2 py-3 font-medium">{label}</th>)}</tr></thead>
          <tbody className="block divide-y divide-line md:table-row-group">{rows.map(r => <tr key={r.id} className={`grid min-w-0 grid-cols-2 gap-3 py-5 md:table-row ${r.issues.length || r.confidence < 0.8 ? "bg-warning/5" : ""}`}>
            <th scope="row" className="col-span-2 min-w-0 px-2 py-3 align-top font-normal md:w-[30%]">
              <label htmlFor={`lab-${r.id}-biomarker`} className="sr-only">Marker</label><input id={`lab-${r.id}-biomarker`} className="field font-medium" value={r.biomarker} onChange={e => edit(r.id, "biomarker", e.target.value)} />
              <p className="mt-2 text-base text-muted">{about[r.biomarker] ?? "Check marker name; ask your clinician."}</p>
              <details className="mt-2 text-base text-muted"><summary className="min-h-11 cursor-pointer py-2">Original report line</summary><p className="break-words [overflow-wrap:anywhere]">{r.raw_line}</p></details>
            </th>
            {([["value", "Your value"], ["unit", "Unit"], ["ref_text", "Lab range"]] as const).map(([field, label]) => <td key={field} className="min-w-0 px-2 py-3 align-top md:w-[15%]"><label htmlFor={`lab-${r.id}-${field}`} className="mb-2 block text-muted md:sr-only">{label}</label><input id={`lab-${r.id}-${field}`} className="field min-w-0 !px-2 tabular-nums" value={r[field] ?? ""} onChange={e => edit(r.id, field, e.target.value)} />
              {field === "ref_text" && r.ref_low !== null && r.ref_high !== null && r.ref_high > r.ref_low && /^[-+]?\d+(\.\d+)?$/.test(r.value) && <div className="mt-4" role="img" aria-label={`${r.biomarker}: ${r.value}; printed range ${r.ref_text}. Green band: printed range; ink marker: your value.`}><div className="relative h-2 border border-line bg-cream"><span className="absolute left-[20%] right-[20%] h-full bg-success/30" /><span className="absolute -top-1 h-4 w-0.5 bg-ink" style={{ left: `${Math.max(0, Math.min(99, 20 + (Number(r.value) - r.ref_low) / (r.ref_high - r.ref_low) * 60))}%` }} /></div><p className="mt-2 text-sm text-muted">Band: printed range<br />Line: your value</p></div>}
            </td>)}
            <td className="col-span-2 min-w-0 px-2 py-3 align-top md:w-1/4"><p className={`text-sm font-medium ${r.flag === "in_range" ? "text-success" : r.flag === "unknown" ? "text-warning" : "text-danger"}`}>{r.flag === "in_range" ? "In range" : r.flag === "unknown" ? "Check value" : "Outside lab range"}</p>
              {(r.flag === "low" || r.flag === "high") && <p className="mt-2 text-base text-muted">Discuss in your consult.</p>}
              {!!r.issues.length && <p className="mt-3 text-base text-warning">Needs review: {r.issues.join(" · ")}</p>}
              <label htmlFor={`lab-check-${r.id}`} className="mt-3 flex min-h-11 items-start gap-2 py-2 text-base"><input id={`lab-check-${r.id}`} className="mt-1 h-5 w-5 shrink-0 accent-burgundy" type="checkbox" aria-label="Looks right. I checked these fields" checked={!!checked[r.id]} onChange={e => setChecked(old => ({ ...old, [r.id]: e.target.checked }))} />Looks right</label>
            </td>
          </tr>)}</tbody>
        </table>
        <div className="flex flex-wrap gap-3"><button className="btn-ghost" onClick={() => setStep(0)}>Back to upload</button><button className="btn-primary" disabled={pending > 0 || !rows.length} onClick={() => setStep(2)}>Choose your review</button></div>
      </div>}
      {step === 2 && <form onSubmit={confirm} className="space-y-6">
        <div><h2 ref={heading} tabIndex={-1} className="display text-3xl">Choose your review.</h2><p className="max-w-[65ch] mt-3 text-base text-muted">A licensed partner physician or nurse practitioner answers your questions.</p></div>
        <fieldset><legend className="mb-3 text-base">Your review option</legend><div className="grid gap-0 divide-y divide-line border-y border-line">{[
          { id: "written", title: `Written review. $${SERVICES.lab_review.price}`, body: "Answer within 24 h. No appointment needed." },
          { id: "video", title: `Video consult. $${SERVICES.lab_consult.price}`, body: `${SERVICES.lab_consult.minutes} minutes to discuss your results.` },
          { id: "lab", title: `${labPlan.name}. $${labPlan.monthly}/month`, body: `${labPlan.commitment} · save $${yearlySavings(labPlan)}/year with full use.` },
        ].map(option => <label key={option.id} className={`block min-h-11 cursor-pointer border-x border-line p-5 focus-within:ring-2 focus-within:ring-rose focus-within:ring-offset-2 ${choice === option.id ? "border-rose bg-blush-pale text-burgundy" : "border-line bg-surface"}`}><input type="radio" name="lab-option" checked={choice === option.id} onChange={() => { setChoice(option.id); setError(""); }} className="mr-2 accent-burgundy" /><span className="text-xl">{option.title}</span><span className="mt-3 block text-base text-muted">{option.body}</span></label>)}</div></fieldset>
        <label htmlFor="lab-questions" className="block text-base">Questions for your clinician<textarea id="lab-questions" className="field mt-2" rows={3} maxLength={4000} value={questions} onChange={e => setQuestions(e.target.value)} /></label>
        {choice !== "written" && <div><h3 className="display mb-3 text-2xl">Request a time · your local timezone</h3><SlotPicker kind="lab_consult" value={slot} onChange={setSlot} /><p className="max-w-[65ch] mt-2 text-base text-muted">Illustrative times; clinician availability unconfirmed.</p></div>}
        <div className="grid gap-4 sm:grid-cols-3">{([ ["name", "Name", "text"], ["email", "Email", "email"], ["phone", "Phone", "tel"] ] as const).map(([field, label, type]) => <label key={field} htmlFor={`lab-contact-${field}`} className="text-base">{label}<input id={`lab-contact-${field}`} placeholder={field === "name" ? "Jane Doe" : field === "email" ? "you@email.com" : "(512) 555-0100"} required type={type} autoComplete={field === "phone" ? "tel" : field} className="field mt-2" value={contact[field]} onChange={e => setContact(old => ({ ...old, [field]: e.target.value }))} /></label>)}</div>
        <p className="max-w-[65ch] text-base text-muted">Contact details, confirmed values, and questions stay on this device.</p>
        <div className="flex flex-wrap gap-3"><button type="button" className="btn-ghost" onClick={() => { setError(""); setStep(1); }}>Back to values</button><button disabled={choice !== "written" && !slot} type="submit" className="btn-primary">Save request</button></div>
      </form>}
      {step === 3 && booking && <div className="space-y-5"><Check size={20} className="text-fg" aria-hidden="true" /><h2 ref={heading} tabIndex={-1} className="display text-4xl">Your review request.</h2><p>{booking.plan_id === "lab" ? labPlan.name : SERVICES[booking.kind].name} · ${booking.price_usd}{booking.plan_id ? "/month" : ""} at launch</p>{booking.plan_id === "lab" && <p className="max-w-[65ch] text-base text-muted">{labPlan.commitment}. First payment at launch.</p>}<p className="max-w-[65ch] tabular-nums text-base">{booking.kind === "lab_review" ? "Written answer within 24 h at launch." : new Date(booking.slot_iso).toLocaleString([], { dateStyle: "full", timeStyle: "short" })}</p><p className="max-w-[65ch] text-base text-muted">For {booking.contact.name} · {booking.contact.email}<br />{rows.length} confirmed markers · appointment unconfirmed.</p>{booking.kind !== "lab_review" && <button className="btn-primary" onClick={() => downloadICS(booking)}>Add to calendar</button>}<Link href="/plans" className="inline-block text-fg underline">Explore Whole Health</Link></div>}
      {error && <div role="alert" className="mt-5 rounded-md border border-contradict/40 p-4"><p className="max-w-[65ch] text-base text-contradict">{error}</p>{step === 0 && lastFile.current && <button className="btn-ghost mt-3" disabled={!!busy} onClick={() => lastFile.current && void upload(lastFile.current)}>Retry file</button>}</div>}
    </motion.div></AnimatePresence>
    <p className="mt-5 text-base text-muted">{PILOT}</p>
    </div>
  </section>;
}
