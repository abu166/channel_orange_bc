"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, AlertCircle, House, ScanFace, Stethoscope } from "lucide-react";
import SlotPicker from "@/components/SlotPicker";
import { Reveal, SectionTitle } from "@/components/ui";
import { cancelBooking, downloadICS, isZip, listBookings, saveBooking, serviceArea, type Booking } from "@/lib/booking";
import { PLANS, SERVICES } from "@/lib/pricing";
import { CONCERNS, SAMPLE_SKIN_REPORT, validateAddress, visitCharge } from "@/lib/visit";

const STEPS = ["Concerns", "Address", "Date & time", "Contact", "Review"];
const PILOT = "Pilot: saved on-device; no charge or clinician dispatch.";
const skinPlan = PLANS.find((plan) => plan.id === "skin")!;
const formatSlot = (slot: string) => new Date(slot).toLocaleString([], { dateStyle: "full", timeStyle: "short" });

export default function VisitPage() {
  const [step, setStep] = useState(0);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [address, setAddress] = useState({ line1: "", access_notes: "", city: "", state: "", zip: "" });
  const [slot, setSlot] = useState<string | null>(null);
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [plan, setPlan] = useState("payg");
  const [membershipId, setMembershipId] = useState("skin");
  const charge = visitCharge(plan);
  const membership = PLANS.find(p => p.id === membershipId)!;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [visits, setVisits] = useState<Booking[]>([]);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const area = serviceArea(address.zip);
  const refresh = () => setVisits(listBookings().filter((booking) => booking.kind === "home_skin"));
  useEffect(() => { refresh(); const requested = new URLSearchParams(window.location.search).get("plan"); if (requested === "skin" || requested === "whole") { setPlan(requested); setMembershipId(requested); } }, []);
  const shownStep = useRef(`${step}-${confirmed}`);
  useEffect(() => {
    // Only scroll on real step changes. never on first load (keeps the hero visible).
    if (shownStep.current === `${step}-${confirmed}`) return;
    shownStep.current = `${step}-${confirmed}`;
    card.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    heading.current?.focus({ preventScroll: true });
  }, [step, confirmed]);

  function validate(index: number) {
    const next: Record<string, string> = {};
    if (index === 1) {
      Object.assign(next, validateAddress(address));
      if (isZip(address.zip) && !area) next.zip = "Home visits are not available in this ZIP yet.";
    }
    if (index === 2 && (!slot || new Date(slot).getTime() <= Date.now())) next.slot = "Choose an upcoming date and time.";
    if (index === 3) {
      if (!contact.name.trim()) next.name = "Enter your name.";
      if (!/^\+?[\d\s().-]+$/.test(contact.phone) || contact.phone.replace(/\D/g, "").length < 10 || contact.phone.replace(/\D/g, "").length > 15) next.phone = "Enter a valid phone number, including area code.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) next.email = "Enter a valid email address.";
    }
    return next;
  }
  function goNext() {
    const next = validate(step);
    setErrors(next);
    if (!Object.keys(next).length) setStep(step + 1);
  }
  function edit(index: number) { setErrors({}); setMessage(""); setStep(index); }
  function confirmVisit() {
    if (busy) return;
    for (const index of [1, 2, 3]) {
      const next = validate(index);
      if (Object.keys(next).length) { setErrors(next); setStep(index); return; }
    }
    setBusy(true); setMessage("");
    try {
      const booking = saveBooking({ kind: "home_skin", slot_iso: slot!, duration_min: SERVICES.home_skin.minutes, price_usd: charge.price, plan_id: charge.planId, contact: { name: contact.name.trim(), email: contact.email.trim(), phone: contact.phone.trim() }, address: { ...address, line1: address.line1.trim(), city: address.city.trim(), state: address.state.trim().toUpperCase(), zip: address.zip.trim() }, details: { concerns: concerns.join(", "), plan, note } });
      if (!listBookings().some((item) => item.id === booking.id)) throw new Error("Your browser could not store this request. Enable local storage and try again.");
      refresh(); setConfirmed(booking);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save the request. Please try again."); }
    finally { setBusy(false); }
  }
  function joinWaitlist() {
    try { localStorage.setItem("veto:waitlist", address.zip.trim()); setMessage("ZIP saved on this device. This pilot waitlist does not send notifications yet."); }
    catch { setMessage("Could not save your ZIP. Enable local storage and try again."); }
  }
  function field(id: string, label: string, value: string, update: (value: string) => void, options: { type?: string; autoComplete?: string; maxLength?: number; inputMode?: "numeric" | "tel" } = {}) {
    return <div key={id} className="min-w-0"><label htmlFor={`visit-${id}`} className="mb-2 block text-base">{label}</label><input id={`visit-${id}`} className="field min-h-11 w-full" value={value} onChange={(event) => { update(event.target.value); setErrors((old) => ({ ...old, [id]: "" })); }} aria-invalid={!!errors[id]} aria-describedby={errors[id] ? `error-${id}` : undefined} {...options} />{errors[id] && <p id={`error-${id}`} role="alert" className="mt-2 text-base text-contradict">{errors[id]}</p>}</div>;
  }

  return <main className="relative mx-auto max-w-6xl space-y-16 px-4 pb-16 pt-16 sm:px-6 [&_.eyebrow]:text-base [&_.chip]:text-base [&_button]:min-h-11 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-4 [&_button]:focus-visible:outline-burgundy">
    <nav aria-label="Breadcrumb" className="text-base text-muted"><Link href="/care" className="underline">Care</Link> / Home skin check</nav>
    <Reveal className="relative">
      
      <h1 className="display text-5xl sm:text-7xl">Home skin check</h1>
      <p className="max-w-[65ch] mt-5 text-lg">${SERVICES.home_skin.price} per visit · included in the <Link href="/care" className="text-fg underline">{skinPlan.name}</Link></p>
      <a href="#book" className="mt-6 min-h-11 text-rose underline" onClick={(event) => { event.preventDefault(); card.current?.scrollIntoView({ behavior: "smooth", block: "start" }); heading.current?.focus({ preventScroll: true }); }}>Request visit</a>
    </Reveal>
    <section><h2 className="display text-3xl">What you get</h2><ul className="mt-5 divide-y divide-line border-y border-line">{[{ Icon: House, text: "Licensed partner clinician at your home" }, { Icon: ScanFace, text: `${SERVICES.home_skin.minutes}-minute skin analysis with professional equipment` }, { Icon: Stethoscope, text: "Clinician-selected routine after assessment" }].map(({ Icon, text }) => <li key={text} className="flex items-center gap-3 py-4"><Icon size={20} aria-hidden="true" />{text}</li>)}</ul></section>

    <div id="book" ref={card} className="scroll-mt-24">
    <h2 className="display mb-3 text-4xl sm:text-5xl">Book a home skin check</h2>
    <p className="max-w-[65ch] mb-6 text-muted">${SERVICES.home_skin.price} · {SERVICES.home_skin.minutes} min · pilot in Austin, NYC, LA, Miami</p>
    <Reveal className="border-y border-line py-6 sm:py-8 [&_button]:min-h-11 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center">
      <ol aria-label="Booking progress" className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STEPS.map((label, index) => <li key={label} aria-current={!confirmed && index === step ? "step" : undefined} className={`min-w-0 border-t-2 pt-3 text-base ${confirmed || index <= step ? "border-burgundy text-burgundy" : "border-line text-muted"}`}><span className="mr-2 tabular-nums">{index + 1}.</span>{label}</li>)}
      </ol>
      <AnimatePresence mode="wait">
        <motion.div onAnimationComplete={() => heading.current?.focus({ preventScroll: true })} key={confirmed ? "confirmed" : step} initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0 }}>
          <h2 ref={heading} tabIndex={-1} className="display mb-6 text-3xl focus:outline-none">{confirmed ? "Your pilot request is saved." : STEPS[step]}</h2>
          {confirmed ? <div className="space-y-5"><Check size={20} className="text-fg" aria-hidden="true" /><p>{formatSlot(confirmed.slot_iso)} · {confirmed.address?.line1}</p><div className="border-y border-line bg-subtle p-5"><p className="max-w-[65ch] text-base">At launch</p><p className="max-w-[65ch] mt-2 text-2xl">{visitCharge(confirmed.plan_id ?? "payg").label}</p><p className="max-w-[65ch] mt-2 text-base text-muted">Appointment unconfirmed.</p></div><p className="max-w-[65ch] text-muted">Request saved on this device; appointment unconfirmed.</p><button className="btn-primary" onClick={() => downloadICS(confirmed)}>Add to calendar</button><h3 className="display text-2xl">What happens next · at launch</h3><ol className="space-y-3 text-base text-muted"><li>Care team confirms appointment.</li><li>Clinician arrives with equipment.</li><li>Report and clinician-selected routine within 48 hours.</li></ol><button className="btn-ghost" onClick={() => { setConfirmed(null); setStep(0); setSlot(null); }}>Request another visit</button></div> : <>
          {step === 0 && <div><p className="max-w-[65ch] mb-4 text-muted">Select concerns, or continue without selecting.</p><div className="flex flex-wrap gap-2">{CONCERNS.map((concern) => <button key={concern} aria-pressed={concerns.includes(concern)} onClick={() => setConcerns((old) => old.includes(concern) ? old.filter((item) => item !== concern) : [...old, concern])} className={`chip !whitespace-normal text-left ${concerns.includes(concern) ? "!border-rose !text-burgundy !bg-blush-pale" : ""}`}>{concern}</button>)}</div><label htmlFor="visit-note" className="mb-2 mt-6 block text-base">Anything else? (optional)</label><textarea id="visit-note" className="field" rows={3} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} /><p className="max-w-[65ch] mt-3 text-base text-muted">Changing, bleeding, or concerning mole? See a clinician promptly; don’t wait for this service.</p></div>}
          {step === 1 && <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2">{field("line1", "Street address", address.line1, (line1) => setAddress({ ...address, line1 }), { autoComplete: "address-line1" })}{field("access_notes", "Apartment / access notes (optional)", address.access_notes, (access_notes) => setAddress({ ...address, access_notes }), { autoComplete: "address-line2" })}{field("city", "City", address.city, (city) => setAddress({ ...address, city }), { autoComplete: "address-level2" })}{field("state", "State (two-letter code)", address.state, (state) => setAddress({ ...address, state }), { autoComplete: "address-level1", maxLength: 2 })}{field("zip", "ZIP code", address.zip, (zip) => { setAddress({ ...address, zip }); setMessage(""); }, { autoComplete: "postal-code", inputMode: "numeric", maxLength: 5 })}</div><div aria-live="polite">{area ? <p className="max-w-[65ch] text-support">We cover {area}</p> : isZip(address.zip) ? <div className="border-y border-line py-4"><p className="max-w-[65ch] mb-3 flex items-center gap-2 text-base"><AlertCircle aria-hidden="true" size={20} className="shrink-0" />We haven’t reached your city yet.</p><button className="btn-ghost" onClick={joinWaitlist}>Join waitlist</button><p className="max-w-[65ch] mt-3 text-base text-muted">Discuss labs: <Link className="text-fg underline" href="/labs">${SERVICES.lab_consult.price} video lab consult</Link>; excludes skin examination.</p></div> : <p className="max-w-[65ch] text-base text-muted">Enter five digits to check our pilot service area.</p>}</div></div>}
          {step === 2 && <div><p className="max-w-[65ch] mb-4 text-base text-muted">Illustrative times · {Intl.DateTimeFormat().resolvedOptions().timeZone} · confirmation required.</p><SlotPicker kind="home_skin" value={slot} onChange={(value) => { setSlot(value); setErrors({}); }} />{errors.slot && <p role="alert" className="mt-3 text-contradict">{errors.slot}</p>}</div>}
          {step === 3 && <div className="space-y-5"><p className="text-base text-muted">Contact details only when you book.</p><div className="grid gap-4 sm:grid-cols-2">{field("name", "Full name", contact.name, (name) => setContact({ ...contact, name }), { autoComplete: "name" })}{field("phone", "Phone", contact.phone, (phone) => setContact({ ...contact, phone }), { type: "tel", autoComplete: "tel" })}{field("email", "Email", contact.email, (email) => setContact({ ...contact, email }), { type: "email", autoComplete: "email" })}</div><fieldset><legend className="mb-3 text-lg">Choose how to pay at launch</legend><div className="grid divide-y divide-line border-y border-line">{[
              { id: "payg", title: `Pay once. $${SERVICES.home_skin.price} this visit`, body: "Clinician report and selected routine." },
              { id: membership.id, title: `${membership.name}. $${membership.monthly}/month`, body: `${membership.commitment} · $${membership.annual}/year.` },
            ].map(option => <label key={option.id} htmlFor={`visit-plan-${option.id}`} className={`block min-h-11 cursor-pointer border-x border-line p-5 focus-within:ring-2 focus-within:ring-rose focus-within:ring-offset-2 ${plan === option.id ? "border-rose bg-blush-pale text-burgundy" : "border-line bg-surface"}`}><input id={`visit-plan-${option.id}`} type="radio" name="visit-plan" checked={plan === option.id} onChange={() => setPlan(option.id)} className="mr-2 accent-burgundy" /><span className="text-xl">{option.title}</span><span className="mt-3 block text-base text-muted">{option.body}</span></label>)}</div>{plan === "whole" && <button type="button" className="mt-3 text-base text-fg underline" onClick={() => { setPlan("skin"); setMembershipId("skin"); }}>Choose Skin Plus</button>}</fieldset><p className="max-w-[65ch] text-base text-muted"><Link href="/care" className="text-fg underline">Compare plans</Link>.</p></div>}
          {step === 4 && <div className="space-y-4"><div className="border-y border-line bg-subtle p-5"><p className="max-w-[65ch] text-base">Your charge at launch</p><p className="max-w-[65ch] mt-2 text-2xl">{charge.label}</p></div>{[{ title: "Concerns", value: `${concerns.join(", ") || "None selected"}${note ? `. ${note}` : ""}` }, { title: "Address", value: `${address.line1}, ${address.city}, ${address.state.toUpperCase()} ${address.zip}${address.access_notes ? ` · ${address.access_notes}` : ""}` }, { title: "Date & time", value: slot ? formatSlot(slot) : "Not selected" }, { title: "Contact & plan", value: `${contact.name} · ${contact.phone} · ${contact.email} · ${charge.label}` }].map((item, index) => <div key={item.title} className="flex items-start justify-between gap-4 border-b border-line pb-4"><div className="min-w-0"><h3 className="display mb-2 text-2xl">{item.title}</h3><p className="max-w-[65ch] break-words text-base">{item.value}</p></div><button className="shrink-0 text-base text-fg underline" aria-label={`Edit ${item.title}`} onClick={() => edit(index)}>Edit</button></div>)}<p className="max-w-[65ch] text-base text-muted">Details stay on this device; avoid shared browsers.</p></div>}
          <div className="mt-7 flex flex-wrap justify-between gap-3">{step > 0 && <button className="btn-ghost" onClick={() => edit(step - 1)}>Back</button>}{step < 4 ? <button className="btn-primary ml-auto" disabled={step === 1 && isZip(address.zip) && !area} onClick={goNext}>Continue</button> : <button className="btn-primary ml-auto" disabled={busy} onClick={confirmVisit}>{busy ? "Saving request…" : "Save request"}</button>}</div>
          </>}
          {message && <p role="status" className="mt-4 text-base text-fg">{message}</p>}
        </motion.div>
      </AnimatePresence>
      <p className="mt-5 text-base text-muted">{PILOT}</p>
    </Reveal>
    </div>

    <section>
      <SectionTitle title={<>Sample skin report</>} sub="Synthetic example; your clinician interprets results and selects your routine." />
      <Reveal className="border-y border-line py-6 sm:py-8"><p className="max-w-[65ch] eyebrow mb-3 text-fg">{SAMPLE_SKIN_REPORT.label}</p><p className="max-w-[65ch] mb-6 text-base text-muted">Synthetic scores: higher means more of each characteristic; no diagnostic thresholds or treatment advice.</p><div className="grid gap-6 sm:grid-cols-2">{SAMPLE_SKIN_REPORT.metrics.map((metric) => <div key={metric.name}><div className="mb-2 flex justify-between"><span>{metric.name}</span><span className="tabular-nums">{metric.score}/100</span></div><div role="meter" aria-label={`${metric.name} synthetic score`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={metric.score} className="h-3 overflow-hidden bg-blush-pale"><motion.div initial={false} animate={{ width: `${metric.score}%` }} transition={{ duration: 0 }} className="h-full bg-rose" /></div><details className="mt-2 text-base text-muted"><summary className="cursor-pointer py-2">Details</summary><p>{metric.note}</p></details></div>)}</div><div className="my-7 border-y border-line py-5"><h3 className="display mb-2 text-2xl">Dermatoscope mole map · synthetic</h3><p>{SAMPLE_SKIN_REPORT.moleMap}</p><p className="max-w-[65ch] mt-2 text-base text-muted">Example only; excludes cancer screening or reassurance about moles.</p></div><div className="grid gap-4 md:grid-cols-2">{["AM", "PM"].map((time) => <div key={time} className="border-t border-line py-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 className="display text-3xl">{time} routine</h3><span className="chip">Doctor-selected · example</span></div><ul className="space-y-4">{SAMPLE_SKIN_REPORT.routine.filter((product) => product.time.includes(time)).map((product) => <li key={product.product} className="border-t border-line py-4"><p className="max-w-[65ch] text-lg">{product.product}</p><details className="text-base text-muted"><summary className="cursor-pointer py-2">Details</summary><p>{product.why}</p></details></li>)}</ul></div>)}</div><p className="max-w-[65ch] mt-5 text-base text-muted">Your licensed clinician selects products and treatments after assessment.</p></Reveal>
    </section>

    <Reveal className="border-t border-line py-8"><h2 className="display mb-5 text-3xl">Your visits</h2>{visits.length === 0 ? <p className="max-w-[65ch] text-muted">No saved visit requests.</p> : <ul className="space-y-4">{visits.map((visit) => <li key={visit.id} className="flex flex-col justify-between gap-3 border-b border-line pb-4 sm:flex-row"><div><p>{formatSlot(visit.slot_iso)}</p><p className="max-w-[65ch] text-base text-muted">{visit.address?.line1} · {visit.status === "cancelled" ? "Cancelled on this device" : "Pilot request · awaiting confirmation"}</p></div>{visit.status === "requested" && <button className="btn-ghost self-start" onClick={() => { if (window.confirm("Cancel this pilot request on this device?")) { cancelBooking(visit.id); refresh(); if (listBookings().find((item) => item.id === visit.id)?.status !== "cancelled") setMessage("Could not save cancellation. Please try again with local storage enabled."); else if (confirmed?.id === visit.id) { setConfirmed(null); setStep(0); } } }}>Cancel request</button>}</li>)}</ul>}</Reveal>
  </main>;
}
