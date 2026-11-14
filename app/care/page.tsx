import Link from "next/link";
import { MARKET_FACTS, PLANS, PRICE_EXPLAINER, SERVICES, paygValue, yearlySavings, type Service } from "@/lib/pricing";

const colors = ["bg-burgundy", "bg-rose", "bg-blush", "bg-blush-pale", "bg-ink", "bg-muted"];
const skin = PLANS.find((plan) => plan.id === "skin")!;
const offerings = [
  { service: SERVICES.lab_review, title: "Written lab review", href: "/labs?service=review", bullets: ["Upload your lab report", "Written clinician explanation", "Questions to discuss with your doctor"] },
  { service: SERVICES.lab_consult, title: "Lab video consult", href: "/labs", bullets: ["Discuss your lab results", "Ask a licensed clinician", "Receive notes after your call"] },
  { service: SERVICES.home_skin, title: "Home skin check", href: "/visit", bullets: ["Skin analysis at your address", "Professional imaging equipment", "Clinician-selected routine after assessment"] },
];
const features = [
  { label: "Home skin checks", match: "home skin" },
  { label: "Skin video follow-ups", match: "follow-up" },
  { label: "Photo check-ins", match: "photo check-ins" },
  { label: "Lab video consults", match: "consults" },
  { label: "Written lab reviews", match: "written lab" },
];
const destinations = { lab: "/labs?plan=lab", skin: "/visit?plan=skin", whole: "/visit?plan=whole" };
const factSummaries = [
  "Average dermatologist wait across 15 large US cities (2022).",
  "US adults using supplements, per the cited 2026 survey.",
  "Estimated self-pay dermatologist visit price; varies widely.",
  "US adults aged 25–44, rounded population estimate.",
];
const faq = [
  ["No account needed?", "No sign-up. Your ledger stays on this device."],
  ["Why a 12-month plan?", "Skin Plus and Whole Health spread annual care across monthly payments; Lab Plus can be cancelled anytime."],
  ["Who are the clinicians?", "Planned partners are licensed physicians or nurse practitioners for labs, and board-certified dermatologists or nurse practitioners for skin; availability is confirmed at launch."],
  ["Is this medical advice?", "VetoHealth provides educational information; licensed partner clinicians provide clinical care and select routines after assessment."],
];

function CostBreakdown({ service }: { service: Service }) {
  return <details className="mt-5 border-t border-line">
    <summary className="min-h-11 cursor-pointer py-3">Where your money goes</summary>
    <p className="mb-3 text-base text-muted">Estimated costs and margin; unaudited assumptions.</p>
    <div className="flex h-4 overflow-hidden rounded-md" role="img" aria-label={`${service.name}: estimated cost proportions, listed below`}>
      {service.breakdown.map((line, index) => <span key={line.label} className={colors[index % colors.length]} style={{ width: `${line.usd / service.price * 100}%` }} />)}
    </div>
    <ul className="mt-4 space-y-3">
      {service.breakdown.map((line, index) => <li key={line.label} className="flex items-baseline gap-2 text-base"><span aria-hidden="true" className={`h-2 w-2 shrink-0 ${colors[index % colors.length]}`} /><span className="flex-1 text-muted">{line.label}</span><span className="tabular-nums">${line.usd}</span></li>)}
    </ul>
  </details>;
}

export default function Care() {
  return <div className="mx-auto max-w-6xl px-4 pb-24 pt-16 text-ink sm:px-6">
    <header>
      <h1 className="display text-5xl sm:text-6xl">Care</h1>
      <p className="mt-5 text-xl">Licensed partner clinicians, when you want one.</p>
      <p className="mt-3 text-base text-muted">Contact details only when you book.</p>
    </header>

    <section aria-labelledby="services-heading" className="pt-16">
      <h2 id="services-heading" className="display text-4xl">Choose your service</h2>
      <p className="mt-4 max-w-[75ch] text-base text-muted">Pilot — request stored on this device; payment via Stripe on launch.</p>
      <p className="mt-2 text-base text-muted">No payment is taken or clinician dispatched in this prototype.</p>
      <div className="mt-8 grid divide-y divide-line border-y border-line md:grid-cols-3 md:divide-x md:divide-y-0">
        {offerings.map(({ service, title, href, bullets }) => <article key={service.id} className="flex min-w-0 flex-col py-8 md:px-6 md:first:pl-0 md:last:pr-0">
          <h3 className="text-xl font-semibold md:min-h-14">{title}</h3>
          <p className="mt-4 text-5xl tabular-nums">${service.price}<span className="ml-2 text-base text-muted">once</span></p>
          <p className="mt-4 text-base text-muted">{service.mode}{service.minutes > 0 ? ` · ${service.minutes} minutes` : ""}</p>
          <ul className="mt-6 flex-1 list-disc space-y-3 pl-5 text-base">{bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul>
          <Link href={href} className={`${service.id === "home_skin" ? "btn-primary" : "btn-ghost"} mt-8 min-h-11 text-center`}>{service.id === "home_skin" ? "Book a home skin check" : "Book"}<span className="sr-only">{service.id === "home_skin" ? "" : ` ${title.toLowerCase()}`}</span></Link>
          <CostBreakdown service={service} />
        </article>)}
      </div>
    </section>

    <section aria-labelledby="memberships-heading" className="pt-16 sm:pt-24">
      <h2 id="memberships-heading" className="display text-4xl">Memberships</h2>
      <p className="mt-4 text-base text-muted">Allowances, costs and savings below cover 12 months.</p>
      <div className="mt-8 overflow-x-auto rounded-md border border-line" role="region" aria-label="Membership comparison; scroll horizontally on smaller screens" tabIndex={0}>
        <table className="w-full min-w-[880px] table-fixed border-collapse text-left text-base tabular-nums">
          <caption className="sr-only">Compare Free, Lab Plus, Skin Plus and Whole Health over one year</caption>
          <thead><tr><th scope="col" className="p-4 align-top">Annual care</th>{PLANS.map(plan => <th key={plan.id} scope="col" className={`p-4 align-top ${plan.hot ? "bg-blush-pale" : ""}`}><h3 className="text-xl font-semibold">{plan.name}</h3>{plan.hot && <p className="mt-2 font-medium">Recommended</p>}<p className="mt-4 text-2xl">${plan.monthly}<span className="text-base font-normal"> / month</span></p><p className="mt-3 font-normal text-muted">{plan.commitment}</p></th>)}</tr></thead>
          <tbody>
            <tr className="border-t border-line"><th scope="row" className="p-4 font-medium">Best for</th>{PLANS.map(plan => <td key={plan.id} className="p-4 align-top text-muted">{plan.best_for}</td>)}</tr>
            {features.map(feature => <tr key={feature.label} className="border-t border-line"><th scope="row" className="p-4 font-medium">{feature.label}</th>{PLANS.map(plan => <td key={plan.id} className="p-4">{plan.included.find(item => item.label.includes(feature.match))?.qty ?? <span aria-label="Not included">—</span>}</td>)}</tr>)}
            <tr className="border-t border-line"><th scope="row" className="p-4 align-top font-medium">Also included</th>{PLANS.map(plan => <td key={plan.id} className="p-4 align-top"><details><summary className="min-h-11 cursor-pointer py-2">Plan details</summary><ul className="space-y-3 text-muted">{plan.perks.map(perk => <li key={perk}>{perk === "Skincare & supplement routine checker" ? "Skincare & supplement Shelf checks" : perk}</li>)}</ul></details></td>)}</tr>
            {[
              { label: "Bought one by one", value: paygValue },
              { label: "You pay", value: (plan: typeof skin) => plan.annual },
              { label: "You save", value: yearlySavings },
            ].map(row => <tr key={row.label} className="border-t border-line"><th scope="row" className="p-4 font-medium">{row.label}</th>{PLANS.map(plan => <td key={plan.id} className="p-4">${row.value(plan)} / year</td>)}</tr>)}
            <tr className="border-t border-line"><th scope="row" className="p-4 font-medium">Booking</th>{PLANS.map(plan => <td key={plan.id} className="p-4 align-top">{plan.id === "free" ? "No membership needed" : <Link className="btn-ghost min-h-11 text-center" href={destinations[plan.id]}>Choose {plan.name}</Link>}</td>)}</tr>
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-base">${SERVICES.home_skin.price} once · ${skin.monthly}/month × 12 = ${skin.annual}/year · ${paygValue(skin)} separately.</p>
      <div className="mt-4 flex h-4 overflow-hidden rounded-md" role="img" aria-label="Skin Plus annual included service value; detailed amounts below">
        {skin.included.map((item, index) => <span key={item.label} className={colors[index]} style={{ width: `${item.qty * item.unit_usd / paygValue(skin) * 100}%` }} />)}
      </div>
      <details className="mt-3"><summary className="min-h-11 cursor-pointer py-3">Why $129 versus $29?</summary><p className="max-w-[75ch] text-base text-muted">{PRICE_EXPLAINER}</p><ul className="mt-4 space-y-2">{skin.included.map(item => <li key={item.label}>{item.qty} × {item.label}: ${item.qty * item.unit_usd}</li>)}</ul></details>
    </section>

    <section aria-labelledby="facts-heading" className="pt-16 sm:pt-24">
      <h2 id="facts-heading" className="display text-4xl">Care in context</h2>
      <div className="mt-8 grid gap-8 border-y border-line py-8 sm:grid-cols-2 lg:grid-cols-4">{MARKET_FACTS.map((fact, index) => <div key={fact.stat}><p className="text-3xl tabular-nums">{fact.stat}</p><p className="mt-3 text-base text-muted">{factSummaries[index]}</p><a href={fact.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-11 items-center text-base underline" aria-label={`Source: ${fact.source}`}>Source</a></div>)}</div>
    </section>

    <section aria-labelledby="faq-heading" className="pt-16 sm:pt-24">
      <h2 id="faq-heading" className="display text-4xl">Common questions</h2>
      <div className="mt-8 divide-y divide-line border-y border-line">{faq.map(([question, answer]) => <details key={question} className="py-3"><summary className="min-h-11 cursor-pointer py-3 text-lg font-semibold">{question}</summary><p className="max-w-[75ch] pb-4 text-base text-muted">{answer}</p></details>)}</div>
    </section>
  </div>;
}
