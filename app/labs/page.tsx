"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, ScanSearch } from "lucide-react";
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
  useEffect(() => { const params = new URLSearchParams(window.location.search); if (params.get("service") === "review") setChoice("written"); else if (params.get("plan") === "lab") setChoice("lab"); }, []);
  const [step, setStep] = useState(0);
  const [rows, setRows] = useState<LabValue[]>([]);
  const [useAi, setUseAi] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [slot, setSlot] = useState<string | null>(null);
  const [questions, setQuestions] = useState("");
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [booking, setBooking] = useState<Booking | null>(null);
  const [source, setSource] = useState("");
  const [aiBusy, setAiBusy] = useState<"" | "extract" | "explain">("");
  const [aiNote, setAiNote] = useState("");
  const [explained, setExplained] = useState<{ items: { biomarker: string; meaning: string }[]; questions: string[] } | null>(null);
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
  const isAi = (r: LabValue) => r.id.startsWith("ai-");
  const needsLook = (r: LabValue) => r.flag === "unknown" || r.issues.some(i => !i.startsWith("Found by AI"));
  const aiFound = rows.filter(isAi).length;
  function load(text: string) {
    const extracted = extractLabValues(text);
    setSource(text); setExplained(null); setAiNote(""); setEditing(null); setRows(extracted);
    if (!extracted.length && !useAi) { setError("No supported markers found. Try a clearer photo, another report, or the sample report."); return; }
    setError(""); setStep(1);
    if (useAi) void runAi(text, extracted);
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
  // AI (on by default, switchable before upload): 1) find values the rule reader missed, 2) explain each in plain English.
  // The server strips names, birth dates and IDs, and keeps an AI value only if it is printed in the report.
  async function runAi(text: string, base: LabValue[]) {
    const post = async (body: object) => {
      const response = await fetch("/api/v1/labs/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "AI help is unavailable right now.");
      return result;
    };
    let all = base;
    try {
      setAiBusy("extract");
      const found = await post({ mode: "extract", text });
      const have = new Set(base.flatMap(r => [r.biomarker.toLowerCase(), r.raw_line.trim().toLowerCase()]));
      const added = (found.values as LabValue[]).filter(v => !have.has(v.biomarker.toLowerCase()) && !have.has(v.raw_line.trim().toLowerCase()));
      all = [...base, ...added];
      setRows(old => [...old, ...added]);
      if (!all.length) { setStep(0); setError("No lab values found. Try a clearer photo, another report, or the test PDF."); return; }
      setAiBusy("explain");
      const ordered = [...all].sort((a, b) => Number(b.flag === "low" || b.flag === "high") - Number(a.flag === "low" || a.flag === "high"));
      setExplained(await post({ mode: "explain", markers: ordered.map(({ biomarker, value, unit, ref_text, flag }) => ({ biomarker, value, unit, ref_text, flag })) }));
    } catch (e) {
      if (!all.length) { setStep(0); setError("No supported markers found. Try a clearer photo, another report, or the test PDF."); }
      else setAiNote(`${e instanceof Error ? e.message : "AI help is unavailable right now."} Your values are still here.`);
    } finally { setAiBusy(""); }
  }
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, "");
  const meaning = (name: string) => explained?.items.find(i => norm(i.biomarker) === norm(name))?.meaning;
  function edit(id: string, field: "value" | "unit" | "ref_text" | "biomarker", text: string) {
    setRows(old => old.map(r => {
      if (r.id !== id) return r;
      const next = { ...r, [field]: text };
      return { ...next, ...assessLabValue(next.value, next.unit, next.ref_text) };
    }));
  }
  function confirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if ((choice !== "written" && (!slot || new Date(slot).getTime() <= Date.now())) ) { setError("Choose an upcoming time for your video consult."); return; }
    if (!contact.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) || !/^\+?[\d\s().-]+$/.test(contact.phone) || contact.phone.replace(/\D/g, "").length < 10 || contact.phone.replace(/\D/g, "").length > 15) { setError("Enter your name, valid email, and a phone number with 10–15 digits."); return; }
    const saved = saveBooking({ kind: service.id, slot_iso: choice === "written" ? new Date().toISOString() : slot!, duration_min: service.minutes, price_usd: choice === "lab" ? labPlan.monthly : service.price, plan_id: choice === "lab" ? "lab" : null, contact, address: null, details: { markers: JSON.stringify(rows), questions } });
    if (!listBookings().some(item => item.id === saved.id)) { setError("Could not save your request. Enable local storage and try again."); return; }
    setBooking(saved); setError(""); setStep(3);
  }
  return <section className="relative mx-auto max-w-6xl px-4 pt-16 sm:px-6 [&_.eyebrow]:text-base [&_.chip]:text-base [&_button]:min-h-11 [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-burgundy [&_input:not([type=checkbox]):not([type=file])]:min-h-11">
    <nav aria-label="Breadcrumb" className="mb-4 text-base text-muted"><Link href="/care" className="inline-flex min-h-11 items-center underline">Care</Link> / Lab results</nav><Reveal className="relative mb-10"><h1 className="page-heading">Lab results</h1><p className="max-w-[65ch] mt-5 max-w-xl text-lg text-muted">Review your lab report with a licensed partner clinician.</p></Reveal>
    <ol aria-label="Lab consult progress" className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">{steps.map((label, i) => <li key={label} aria-current={i === step ? "step" : undefined} className={`border-t-2 pt-3 text-base ${i <= step ? "border-burgundy text-burgundy" : "border-line text-muted"}`}><span className="mr-2 tabular-nums">{i + 1}.</span>{label}</li>)}</ol>
    <div id="lab-report" ref={card} className="scroll-mt-24">
    <AnimatePresence mode="wait"><motion.div onAnimationComplete={() => heading.current?.focus({ preventScroll: true })} key={step} initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0 }} className="relative border-t border-line py-6 sm:py-8">
      {step === 0 && <div className="space-y-5">
        <h2 ref={heading} tabIndex={-1} className="display text-3xl focus-visible:outline-none">Start with your report.</h2>
        <div className="border-y border-line py-4"><label htmlFor="lab-upload" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) void upload(f); }} className="flex cursor-pointer flex-col items-center gap-3 rounded-md border border-dashed border-rose/50 bg-surface px-4 py-12 text-center transition-colors hover:bg-subtle focus-within:ring-2 focus-within:ring-rose">
          <input id="lab-upload" aria-label="Upload lab report PDF or photo" type="file" accept="application/pdf,image/*" disabled={!!busy} className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
          {busy ? <Loader2 size={20} className="animate-spin text-fg" /> : null}<span role="status">{busy || "Upload PDF or photo"}</span><span className="text-base text-muted">8 MB maximum · clear, single-column reports</span>
        </label>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"><button className="btn-ghost flex min-h-11" disabled={!!busy} onClick={() => load(SAMPLE_REPORT)}>Try sample</button><a href="/samples/synthetic-lab-report.pdf" download className="inline-flex min-h-11 items-center text-base underline">Download a test PDF</a></div></div>
        
        <label htmlFor="lab-ai" className="flex max-w-[65ch] cursor-pointer items-start gap-3 text-base"><input id="lab-ai" type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-burgundy" checked={useAi} onChange={e => setUseAi(e.target.checked)} /><span><span className="font-medium">Explain my results with AI</span><span className="mt-1 block text-muted">Finds values the reader missed and explains each one in plain English. Names, birth dates and IDs are removed first. Nothing is stored.</span></span></label>
        <p className="max-w-[65ch] text-base text-muted">Photos are read on-device · PDFs are processed without storage.</p>
      </div>}
      {step === 1 && <div className="space-y-6">
        <div><h2 ref={heading} tabIndex={-1} className="display text-3xl">Your results.</h2><p className="mt-3 max-w-[65ch] text-base text-muted">Compare with your report. Tap Edit on anything that is wrong.</p></div>
        <div className="flex flex-wrap gap-x-10 gap-y-2 border-y border-line">{[{ count: outside, label: "Outside the lab’s range", color: "text-danger" }, { count: rows.filter(needsLook).length, label: "Need a look", color: "text-warning" }, { count: rows.filter(r => r.flag === "in_range" && !needsLook(r)).length, label: "In the lab’s range", color: "text-success" }].filter(item => item.count || item.color !== "text-warning").map(item => <div key={item.label} className="flex items-baseline gap-3 py-3"><p className={`text-2xl font-medium tabular-nums ${item.color}`}>{item.count}</p><p className="text-base">{item.label}</p></div>)}</div>
        {aiBusy ? <p role="status" className="flex items-center gap-2 text-base"><Loader2 size={18} className="animate-spin text-burgundy" aria-hidden="true" />{aiBusy === "extract" ? "AI is checking the report for values the reader missed…" : "AI is writing a plain-English line for each result…"}</p>
          : explained ? <p className="flex items-start gap-2 text-base text-muted"><ScanSearch size={18} className="mt-0.5 shrink-0 text-burgundy" aria-hidden="true" />{aiFound ? `AI found ${aiFound} ${aiFound === 1 ? "value" : "values"} the reader missed and explained every result.` : "AI explained every result in plain English."} It does not diagnose.</p>
          : aiNote ? <p role="status" className="text-base text-muted">{aiNote}</p> : null}
        {!!outside && <p className="max-w-[65ch] rounded-md border border-partial/25 p-4 text-base">Some values may need prompt attention. If you feel unwell, contact your doctor today or call 911 in an emergency.</p>}
        {([["Outside the lab’s range", rows.filter(r => r.flag === "low" || r.flag === "high")], ["Need a look", rows.filter(r => r.flag !== "low" && r.flag !== "high" && needsLook(r))], ["In the lab’s range", rows.filter(r => r.flag === "in_range" && !needsLook(r))]] as const).filter(([, list]) => list.length).map(([title, list]) => <section key={title} aria-label={title}>
          <h3 className="text-lg font-medium">{title} <span className="font-normal text-muted tabular-nums">{list.length}</span></h3>
          <ul className="mt-2 divide-y divide-line border-y border-line">{list.map(r => {
            const tone = r.flag === "in_range" ? "text-success" : r.flag === "unknown" ? "text-warning" : "text-danger";
            const status = r.flag === "high" ? "Above lab range" : r.flag === "low" ? "Below lab range" : r.flag === "in_range" ? "In range" : "Check value";
            const bar = r.ref_low !== null && r.ref_high !== null && r.ref_high > r.ref_low && /^[-+]?\d+(\.\d+)?$/.test(r.value);
            return <li key={r.id} className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
                <p className="text-lg font-medium">{r.biomarker}{isAi(r) && <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-line px-2 align-middle text-base font-normal text-muted"><ScanSearch size={14} aria-hidden="true" />Found by AI</span>}</p>
                <div className="flex items-center gap-4"><p className="tabular-nums"><span className={`text-lg font-medium ${tone}`}>{r.value}</span> <span className="text-base text-muted">{r.unit}</span></p><button className="text-base underline" aria-expanded={editing === r.id} onClick={() => setEditing(editing === r.id ? null : r.id)}>{editing === r.id ? "Done" : "Edit"}</button></div>
              </div>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-base">
                <p className="max-w-[62ch] text-muted">{meaning(r.biomarker) ?? about[r.biomarker] ?? "Ask your clinician what this test measures."}</p>
                <div className="flex items-center gap-3 tabular-nums">{bar && <span role="img" aria-label={`${r.value} against the printed range ${r.ref_text}`} className="relative h-2 w-24 rounded-full bg-subtle"><span className="absolute inset-y-0 left-[20%] right-[20%] rounded-full bg-success/30" /><span className="absolute -top-1 h-4 w-0.5 bg-ink" style={{ left: `${Math.max(0, Math.min(99, 20 + (Number(r.value) - r.ref_low!) / (r.ref_high! - r.ref_low!) * 60))}%` }} /></span>}<span className="text-muted">Lab range {r.ref_text ?? "not printed"}</span><span className={tone}>{status}</span></div>
              </div>
              {r.issues.filter(i => !i.startsWith("Found by AI")).length > 0 && <p className="mt-2 text-base text-warning">{r.issues.filter(i => !i.startsWith("Found by AI")).join(" · ")}</p>}
              {editing === r.id && <div className="mt-4 grid gap-3 rounded-md border border-line bg-surface p-4 sm:grid-cols-4">
                {([["biomarker", "Test"], ["value", "Value"], ["unit", "Unit"], ["ref_text", "Lab range"]] as const).map(([field, label]) => <label key={field} htmlFor={`lab-${r.id}-${field}`} className="text-base text-muted">{label}<input id={`lab-${r.id}-${field}`} className="field mt-1 tabular-nums text-fg" value={r[field] ?? ""} onChange={e => edit(r.id, field, e.target.value)} /></label>)}
                <p className="text-base text-muted sm:col-span-4 break-words [overflow-wrap:anywhere]">On your report: “{r.raw_line}”</p>
              </div>}
            </li>;
          })}</ul>
        </section>)}
        {!!explained?.questions.length && <div className="rounded-md border border-line bg-surface p-4"><h3 className="text-lg font-medium">Questions to ask your clinician</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-base">{explained.questions.map(q => <li key={q}>{q}</li>)}</ul><button className="btn-ghost mt-4" disabled={explained.questions.every(q => questions.includes(q))} onClick={() => setQuestions(old => [old.trim(), ...explained.questions.filter(q => !old.includes(q))].filter(Boolean).join("\n"))}>{explained.questions.every(q => questions.includes(q)) ? "Added to your review" : "Add to my review"}</button><p className="mt-3 text-base text-muted">AI suggestion. Your clinician decides what matters.</p></div>}
        <p className="max-w-[65ch] text-base text-muted">Ranges are the lab’s own and don’t establish health. A reader can miss lines, so glance over your report too.</p>
        <div className="flex flex-wrap gap-3"><button className="btn-ghost" onClick={() => setStep(0)}>Back to upload</button><button className="btn-primary" disabled={!rows.length} onClick={() => setStep(2)}>These match my report, continue</button></div>
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
        <p className="max-w-[65ch] text-base text-muted">Contact details only when you book.</p>
        <div className="flex flex-wrap gap-3"><button type="button" className="btn-ghost" onClick={() => { setError(""); setStep(1); }}>Back to values</button><button disabled={choice !== "written" && !slot} type="submit" className="btn-primary">Save request</button></div>
      </form>}
      {step === 3 && booking && <div className="space-y-5"><Check size={20} className="text-fg" aria-hidden="true" /><h2 ref={heading} tabIndex={-1} className="display text-4xl">Your review request.</h2><p>{booking.plan_id === "lab" ? labPlan.name : SERVICES[booking.kind].name} · ${booking.price_usd}{booking.plan_id ? "/month" : ""} at launch</p>{booking.plan_id === "lab" && <p className="max-w-[65ch] text-base text-muted">{labPlan.commitment}. First payment at launch.</p>}<p className="max-w-[65ch] tabular-nums text-base">{booking.kind === "lab_review" ? "Written answer within 24 h at launch." : new Date(booking.slot_iso).toLocaleString([], { dateStyle: "full", timeStyle: "short" })}</p><p className="max-w-[65ch] text-base text-muted">For {booking.contact.name} · {booking.contact.email}<br />{rows.length} markers · appointment unconfirmed.</p>{booking.kind !== "lab_review" && <button className="btn-primary" onClick={() => downloadICS(booking)}>Add to calendar</button>}<Link href="/care" className="inline-block text-fg underline">Explore Whole Health</Link></div>}
      {error && <div role="alert" className="mt-5 rounded-md border border-contradict/40 p-4"><p className="max-w-[65ch] text-base text-contradict">{error}</p>{step === 0 && lastFile.current && <button className="btn-ghost mt-3" disabled={!!busy} onClick={() => lastFile.current && void upload(lastFile.current)}>Retry file</button>}</div>}
    </motion.div></AnimatePresence>
    <p className="mt-5 text-base text-muted">{PILOT}</p>
    </div>
  </section>;
}
