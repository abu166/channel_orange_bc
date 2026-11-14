"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Reveal, SectionTitle } from "@/components/ui";
import { MARKET_FACTS, PLANS, SERVICES, paygValue, yearlySavings, type Service } from "@/lib/pricing";

const destinations = { free: "/analyze", lab: "/labs?plan=lab", skin: "/visit?plan=skin", whole: "/visit?plan=whole" };
const skin = PLANS.find((p) => p.id === "skin")!;
const colors = ["bg-burgundy", "bg-rose", "bg-blush", "bg-blush-pale"];
const features = [
  { label: "Home skin checks", matches: (s: string) => s.includes("home skin") },
  { label: "Skin video follow-ups", matches: (s: string) => s.includes("follow-up") },
  { label: "Photo check-ins", matches: (s: string) => s.includes("photo check-ins") },
  { label: "Lab video consults", matches: (s: string) => s.includes("consults") },
  { label: "Written lab reviews", matches: (s: string) => s.includes("written lab") },
];
const compactPerk = (text: string) => ({
  "3 claim checks a day with real PubMed studies": "3 daily claim checks with PubMed studies",
  "Upload a lab report and see each value next to the lab's range": "Lab values beside printed ranges",
  "Pay as you go: $10 written review, $20 video consult, $129 home skin check": "$10 written · $20 video · $129 home visit",
}[text] ?? text);
const faq = [
  ["Who are the clinicians?", "Planned partner care is delivered by licensed clinicians: board-certified dermatologists or nurse practitioners for skin, and licensed physicians or nurse practitioners for labs. Availability will be confirmed before launch."],
  ["Why does Skin Plus run for 12 months?", `It includes two in-person home visits plus follow-ups across the year. Monthly billing spreads the $${skin.annual} annual price across 12 payments; it is an annual commitment.`],
  ["Can I cancel Lab Plus anytime?", "Yes. Lab Plus has no 12-month commitment. The included quantities shown here describe a full year of membership."],
  ["Is AI giving medical advice?", "No. AI tools organise information for education. Licensed partner clinicians provide clinical care and select routines after assessment."],
];
function CostBar({ service }: { service: Service }) {
  return <Reveal className="border-t border-line py-6 sm:py-8">
    <div className="flex flex-wrap items-baseline justify-between gap-3"><h3 className="text-xl font-semibold">{service.name}</h3><span className="text-3xl tabular-nums">${service.price}</span></div>
    <div className="my-6 flex h-10 overflow-hidden rounded-md" role="img" aria-label={`${service.name}: cost breakdown shown below`}>
      {service.breakdown.map((line, i) => <motion.div key={line.label} initial={false} animate={{ width: `${line.usd / service.price * 100}%` }} viewport={{ once: true }} transition={{ duration: 0 }} className={colors[i % colors.length]} />)}
    </div>
    <details><summary className="cursor-pointer py-3 text-base">Details</summary><ul className="space-y-3">{service.breakdown.map((line, i) => <li key={line.label} className="flex items-start gap-3 text-base text-muted"><span className={`mt-1 h-3 w-3 shrink-0 rounded-sm ${colors[i % colors.length]}`} /><span className="flex-1">{line.label}</span><b className="text-lg tabular-nums text-fg">${line.usd}</b></li>)}</ul></details>
  </Reveal>;
}
export default function Plans() {
  const [spend, setSpend] = useState(100);
  const [weak, setWeak] = useState(30);
  const wasted = Math.round(spend * 12 * weak / 100);
  return <div className="relative isolate mx-auto max-w-6xl px-4 pb-24 pt-16 text-fg sm:px-6">
    <Reveal><h1 className="display mt-5 text-5xl sm:text-7xl">Choose your clinician service.</h1><p className="max-w-[65ch] mt-6 max-w-2xl text-lg text-muted">Free checks, one-time services, or monthly clinician plans.</p><a href="#plans" className="btn-primary mt-7 min-h-11">Find your plan <ArrowRight size={20} /></a></Reveal>

    <section className="pt-24"><SectionTitle title="The problem, in numbers" /><div className="divide-y divide-line border-y border-line">{MARKET_FACTS.map((fact, index) => <Reveal key={fact.stat} className="grid items-baseline gap-3 py-6 sm:grid-cols-[8rem_1fr_12rem]"><p className="text-3xl font-semibold tabular-nums">{fact.stat}</p><p className="max-w-[65ch] text-base text-muted">{["Average dermatologist wait across 15 large US cities (2022).", "US adults using dietary supplements (2026 survey).", "Estimated self-pay dermatologist visit price; varies widely.", "US adults aged 25–44 (rounded estimate)."][index]}</p><a href={fact.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-[15px] underline"><span className="sr-only">{fact.source}</span>Source</a></Reveal>)}</div></section>

    <section id="plans" className="scroll-mt-24 pt-24"><SectionTitle title={<>Compare plans</>} sub="Allowances and savings cover 12 months." /><div className="hidden md:block"><table className="w-full table-fixed border-collapse text-left text-base"><caption className="sr-only">Plan prices, annual allowances, and commitments</caption><thead><tr><th scope="col" className="w-1/5 p-3 align-bottom">Annual care</th>{PLANS.map(p => <th scope="col" key={p.id} className={`border-t-4 p-3 align-top ${p.hot ? "border-burgundy" : "border-transparent"}`}><h3 className="text-xl font-semibold">{p.name}</h3>{p.hot && <p className="mt-2 text-[15px] font-medium">Recommended</p>}<p className="mt-3 tabular-nums">${p.monthly}<span className="font-normal text-muted"> / month</span></p><p className="mt-3 font-normal text-muted">{p.commitment}</p></th>)}</tr></thead><tbody><tr className="border-t border-line"><th scope="row" className="p-3 font-medium">Best for</th>{PLANS.map(p => <td key={p.id} className="p-3 align-top text-muted">{p.best_for}</td>)}</tr>{features.map(f => <tr key={f.label} className="border-t border-line"><th scope="row" className="p-3 font-medium">{f.label}</th>{PLANS.map(p => {const item=p.included.find(i=>f.matches(i.label));return <td key={p.id} className="p-3 tabular-nums">{item ? item.qty : <span aria-label="Not included">—</span>}</td>;})}</tr>)}<tr className="border-t border-line"><th scope="row" className="p-3 font-medium">Also included</th>{PLANS.map(p=><td key={p.id} className="p-3 align-top"><ul className="space-y-3">{p.perks.map(perk=><li key={perk}>{compactPerk(perk)}</li>)}</ul></td>)}</tr><tr className="border-t border-line"><th scope="row" className="p-3 font-medium">Annual cost and savings</th>{PLANS.map(p=><td key={p.id} className="p-3 align-top tabular-nums">${p.annual} / year{p.monthly>0 && <p className="mt-2 text-muted">${paygValue(p)} bought separately. Save ${yearlySavings(p)} / year.</p>}</td>)}</tr><tr className="border-t border-line"><th scope="row" className="sr-only">Choose a plan</th>{PLANS.map(p=><td key={p.id} className="px-2 py-5 align-top"><Link href={destinations[p.id]} className={`${p.hot ? "btn-primary" : "btn-ghost"} w-full px-3 text-center`}>{p.id==="free" ? "Check claim" : "Choose " + p.name}</Link></td>)}</tr></tbody></table></div><div className="divide-y divide-line border-y border-line md:hidden">{PLANS.map(p=><Reveal key={p.id} className={`py-6 ${p.hot ? "border-t-4 border-burgundy" : ""}`}><h3 className="display text-3xl">{p.name}</h3>{p.hot && <p className="mt-2 font-medium">Recommended</p>}<p className="mt-3 text-xl tabular-nums">${p.monthly} / month</p><p className="mt-2">{p.commitment}</p><p className="mt-3 text-muted">For: {p.best_for}</p><ul className="mt-4 space-y-3">{p.included.map(item=><li key={item.label}>{item.qty} × {item.label}</li>)}{p.perks.map(perk=><li key={perk}>{compactPerk(perk)}</li>)}</ul>{p.monthly>0 && <p className="mt-4 tabular-nums">${p.annual}/year · ${paygValue(p)} separately · save ${yearlySavings(p)}</p>}<Link href={destinations[p.id]} className="btn-primary mt-5">{p.id==="free" ? "Check claim" : "Choose " + p.name}</Link></Reveal>)}</div></section>

    <section className="pt-24"><SectionTitle title={`$${SERVICES.home_skin.price} once; $${skin.monthly}/month`} sub={`Skin Plus: 12-month commitment, $${skin.annual}/year; two visits, four follow-ups, twelve photo check-ins.`} /><Reveal><div className="flex h-10 overflow-hidden rounded-md" role="img" aria-label="Skin Plus included service value breakdown">{skin.included.map((item, i) => <motion.div key={item.label} initial={false} animate={{ width: `${item.qty * item.unit_usd / paygValue(skin) * 100}%` }} transition={{ duration: 0 }} className={colors[i % colors.length]} />)}</div><details className="mt-4 text-base"><summary className="cursor-pointer py-3">Details</summary><ul>{skin.included.map(item => <li key={item.label}>{item.qty} × {item.label}: ${item.qty * item.unit_usd}</li>)}</ul><p>${paygValue(skin)} separately · save ${yearlySavings(skin)}/year</p><Link href="/visit" className="btn-ghost mt-4">Request visit</Link></details></Reveal></section>

    <section className="pt-24"><SectionTitle title={`Where your $${SERVICES.home_skin.price} goes`} sub="Estimated costs and margin; unaudited assumptions." /><CostBar service={SERVICES.home_skin} /><div className="mt-4 divide-y divide-line"><CostBar service={SERVICES.lab_consult} /><CostBar service={SERVICES.lab_review} /></div></section>

    <section className="pt-24"><SectionTitle title="Prefer to pay once?" sub="Request only the service you need. No membership required." /><div className="divide-y divide-line border-y border-line">{Object.values(SERVICES).map(s=><Reveal key={s.id} className="grid items-start gap-4 py-6 sm:grid-cols-[1fr_auto]"><div><h3 className="text-xl font-semibold">{s.name}</h3><p className="mt-2 text-base text-muted">{s.mode}</p><Link href={s.id.startsWith("lab") ? "/labs" : "/visit"} className="btn-ghost mt-4">Request service<ArrowRight size={20}/></Link></div><p className="text-right text-2xl tabular-nums">${s.price}<span className="block text-base text-muted">once</span></p></Reveal>)}</div></section>



    <section className="pt-24"><Reveal className="card grid gap-8 p-6 sm:p-10 md:grid-cols-2"><div><h2 className="display text-4xl">What are guesses costing you?</h2><p className="max-w-[65ch] mt-4 text-base text-muted">Estimate the part of your spending you want to investigate.</p><div className="mt-8 space-y-6"><label className="block text-base">Monthly skincare & supplement spending: <b>${spend}</b><input type="range" min={10} max={400} step={5} value={spend} onChange={(e) => setSpend(+e.target.value)} className="mt-3 min-h-11 w-full accent-burgundy" /></label><label className="block text-base">Share you feel unsure about: <b>{weak}%</b><input type="range" min={0} max={100} step={5} value={weak} onChange={(e) => setWeak(+e.target.value)} className="mt-3 min-h-11 w-full accent-burgundy" /></label></div></div><div className="flex flex-col justify-center bg-subtle p-6"><p className="max-w-[65ch] text-base text-muted">Your estimated spending to investigate</p><motion.p key={wasted} initial={false} animate={{ opacity: 1 }} transition={{ duration: 0 }} className="display my-4 text-6xl text-fg">${wasted.toLocaleString()}/yr</motion.p><p className="max-w-[65ch] text-base text-muted">Your estimate; product effectiveness and savings are unproven.</p><Link href="/analyze" className="btn-primary mt-6 min-h-11">Check claim <ArrowRight size={20} /></Link></div></Reveal></section>

    <section className="pt-24"><SectionTitle title={<>Fine print, plain English.</>} /><div className="divide-y divide-line border-y border-line">{faq.map(([q, a]) => <details key={q} className="py-6"><summary className="cursor-pointer text-lg font-semibold">{q}</summary><p className="max-w-[65ch] mt-3 text-base text-muted">{a}</p></details>)}</div></section>
    <p className="mt-8 text-base text-muted">Pilot: saved on-device; no charge or clinician dispatch.</p>
  </div>;
}
