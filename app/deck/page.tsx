"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { PLANS, SERVICES, MARKET_FACTS, UNIT_ECONOMICS, CAC_USD, AVG_LIFETIME_YEARS, ARR_SCENARIO, arrTotal, paygValue, yearlySavings } from "@/lib/pricing";

const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n >= 1000 || Number.isInteger(n) ? 0 : 2 });
const number = (n: number) => n.toLocaleString("en-US");
const skin = PLANS.find((p) => p.id === "skin")!;
const members = ARR_SCENARIO.slice(0, 3).reduce((sum, row) => sum + row.volume, 0);
const subscriptionArr = ARR_SCENARIO.slice(0, 3).reduce((sum, row) => sum + row.volume * row.unit_usd, 0);

function Slide({ n, title, children, note }: { n: number; title: string; children: ReactNode; note?: string }) {
  return <div className="slide-frame"><section className={`slide slide-${n}`} aria-labelledby={`slide-${n}`}>
    {n === 1 ? <h1 id={`slide-${n}`}>{title}</h1> : <h2 id={`slide-${n}`}>{title}</h2>}
    <div className="slide-content">{children}</div>
    {note && <p className="slide-note">{note}</p>}
    <footer>VetoHealth · Business Cup 2.0 · {n}/10</footer>
  </section></div>;
}

export default function DeckPage() {
  const container = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / 1280)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div className="deck-page">
    <div className="deck-toolbar no-print"><button className="btn-primary" onClick={() => window.print()}>Download PDF</button></div>
    <div ref={container} className="deck" style={{ "--deck-scale": scale } as React.CSSProperties}>
      <Slide n={1} title="VetoHealth">
        <p className="promise">Check before you buy.</p>
        <div className="title-rule" />
        <p className="large">Check → Shelf → Care → Ledger</p>
        <div className="title-meta"><span>Team VetoHealth</span><span>Business Cup 2.0 · Track 01 MONEY</span></div>
      </Slide>
      <Slide n={2} title="Money leaks on health guesses">
        <div className="facts">{MARKET_FACTS.slice(0, 3).map((fact) => <article key={fact.stat}>
          <strong className="big-number">{fact.stat}</strong><p>{fact.text}</p><a className="source" href={fact.url}>{fact.source}</a>
        </article>)}</div>
        <div className="band">Spending pain is our hypothesis. Customer interviews come next.</div>
      </Slide>
      <Slide n={3} title="Meet Maya, 31" note="Synthetic persona. Spending is illustrative, not a measured average.">
        <div className="split"><div><strong className="hero-number">$80<span>/mo</span></strong><p>Skincare and supplements discovered on TikTok.</p></div>
          <ol className="editorial-list"><li>Sees a persuasive health claim</li><li>Buys before checking the evidence</li><li>Stacks overlapping routine products</li><li>Wants personal advice before spending again</li></ol></div>
      </Slide>
      <Slide n={4} title="Check → Shelf → Care → Ledger" note="Educational only. Not medical advice. Clinical care requires licensed partners.">
        <div className="steps">{[
          ["01", "Check", "Live PubMed, linked evidence", "/check"],
          ["02", "Shelf", "Review products and overlaps", "/shelf"],
          ["03", "Care", "Request clinician interpretation", "/care"],
          ["04", "Ledger", "Saved checks, spending and care", "/ledger"],
        ].map(([n, heading, text, href]) => <a href={href} key={n}><span className="step-number">{n}</span><h3>{heading}</h3><p>{text}</p></a>)}</div>
        <div className="band">AI reads, the rubric decides</div><p className="muted">Retrieval failure → incomplete; uncertainty stays visible.</p>
      </Slide>
      <Slide n={5} title="Money you can see" note="User-reported spending; no guaranteed savings or product safety conclusions.">
        <div className="facts">
          <article><h3>Money kept</h3><p>Track purchases you decided to skip after checking.</p><a href="/ledger">Your spending ledger →</a></article>
          <article><h3>Price of proof</h3><p>Evidence per dollar, graded live with our engine.</p><span className="muted">Live grading · Shelf</span></article>
          <article><h3>Overlap spend</h3><p>See monthly spending on products sharing active ingredients.</p><a href="/shelf">Review your shelf →</a></article>
        </div>
        <div className="band">Evidence before another purchase.</div>
      </Slide>
      <Slide n={6} title="What we sell" note="Pilot: device-local requests; no payment, confirmed appointments, or clinician dispatch.">
        <table className="plans-table"><thead><tr><th>Plan</th><th>Monthly</th><th>Annual</th><th>Individual value</th><th>Annual saving</th><th>Commitment</th></tr></thead><tbody>{PLANS.map((p) => <tr key={p.id}><th>{p.name}</th><td>{usd(p.monthly)}</td><td>{usd(p.annual)}</td><td>{usd(paygValue(p))}</td><td>{usd(yearlySavings(p))}</td><td>{p.commitment}</td></tr>)}</tbody></table>
        <div className="service-prices">{Object.values(SERVICES).map((s) => <span key={s.id}>{s.name} <b>{usd(s.price)}</b></span>)}</div>
        <div className="price-explainer"><strong>{usd(SERVICES.home_skin.price)} once</strong><span>One home visit</span><strong>{usd(skin.monthly)}/mo × 12</strong><span>{usd(skin.annual)}/year: {skin.included.map((i) => i.qty).join(" / ")} visits / videos / photos</span></div>
      </Slide>
      <Slide n={7} title="Contribution before scale" note="Assumptions: twelve paid months, expected utilisation; excludes acquisition costs and fixed overhead.">
        <table><thead><tr><th>Plan</th><th>Revenue/yr</th><th>Cost/yr</th><th>Contribution/yr</th><th>Lifetime</th><th>LTV</th><th>LTV/CAC</th></tr></thead><tbody>{UNIT_ECONOMICS.map((row) => {
          const contribution = row.revenue - row.cost_to_serve;
          const lifetime = AVG_LIFETIME_YEARS[row.plan];
          const ltv = contribution * lifetime;
          return <tr key={row.plan}><th>{PLANS.find((p) => p.id === row.plan)?.name}</th><td>{usd(row.revenue)}</td><td>{usd(row.cost_to_serve)}</td><td>{usd(contribution)}</td><td>{lifetime} years</td><td>{usd(ltv)}</td><td>{(ltv / CAC_USD).toFixed(2)}×</td></tr>;
        })}</tbody></table>
        <div className="economics-key"><div><strong>{usd(CAC_USD)}</strong><span>Assumed blended CAC</span></div><div><strong>Revenue − cost</strong><span>Annual contribution</span></div><div><strong>Contribution × years</strong><span>Contribution LTV</span></div></div>
      </Slide>
      <Slide n={8} title="Path to $100M ARR" note="Assumed volumes, not a forecast. Pay-as-you-go revenue is nonrecurring; benefits are not double-counted.">
        <div className="arr-layout"><table><thead><tr><th>Revenue line</th><th>Annual volume</th><th>Price</th><th>Revenue/year</th></tr></thead><tbody>{ARR_SCENARIO.map((row) => <tr key={row.line}><th>{row.line.replace("Pay-as-you-go", "PAYG")}</th><td>{number(row.volume)}</td><td>{usd(row.unit_usd)}</td><td>{usd(row.volume * row.unit_usd)}</td></tr>)}</tbody></table><div className="arr-total"><strong>${(arrTotal() / 1e6).toFixed(1)}M</strong><span>Total annual revenue</span><b>${(subscriptionArr / 1e6).toFixed(1)}M</b><span>Subscription ARR</span><b>${((arrTotal() - subscriptionArr) / 1e6).toFixed(1)}M</b><span>Annual PAYG revenue</span></div></div>
        <p className="market-line">{number(members)} members ≈ {(members / 90_000_000 * 100).toFixed(2)}% of <a href={MARKET_FACTS[3].url}>{MARKET_FACTS[3].stat} US adults 25–44</a></p>
      </Slide>
      <Slide n={9} title="Proof it works" note="Pilot: requests stay on-device; no payments, confirmed appointments, or clinician dispatch.">
        <div className="proof-numbers"><div><strong>12/12</strong><span>Recorded broad-direction regression passes</span></div><div><strong>Live</strong><span>PubMed retrieval, versioned reports</span></div></div>
        <div className="split proof-details"><div><h3>Live evidence pipeline</h3><p>Extraction → PubMed → stance reading → rubric → sources</p><a href="/check">Check a claim →</a></div><div><h3>Return and share</h3><p>Money kept · share verdict · expert demo workspace</p><a href="/expert">Open expert workspace →</a></div></div>
        <p className="eval-caveat">Small team-labelled set; not held out. Earlier errors informed fixes; abstention can pass.</p>
        <details className="no-print"><summary>Details</summary><p>docs/EVAL.md: rules-v2, 14 November 2026. Regression evidence, not clinical accuracy or commercial traction.</p></details>
      </Slide>
      <Slide n={10} title="Why we can't be copied" note="Moat strategy; not established defensibility or verified clinician review today.">
        <div className="moat-lines">
          <p><strong>Verdict graph:</strong> claims × studies × creators × products × outcomes</p>
          <p><strong>Living evidence:</strong> science changes, versioned verdicts follow</p>
          <p><strong>Human layer:</strong> clinician-reviewed labels, equipped in-person visits</p>
          <p><strong>Your own data loop:</strong> shelf/labs/money → brief → paid-care</p>
        </div>
        <div className="band">The ask: Stripe · clinician partners · HIPAA-ready backend · legal review</div>
        <details className="no-print"><summary>Strategy and pilot limits</summary>
          <p>The graph grows with every check; stale claims re-check when Ledger opens.</p>
          <p>Expert decisions are device-local demos, without verified clinician identities.</p>
          <p>Clinician-reviewed labels and equipped visits require licensed partners before launch.</p>
          <p>Doctor brief connects personal context to optional paid care.</p>
        </details>
      </Slide>
    </div>
    <style>{`
      .deck-page { padding:24px 16px 64px; background:#F8F3ED; }
      .deck-toolbar { max-width:1280px; margin:0 auto 20px; display:flex; justify-content:flex-end; }
      .deck { max-width:1280px; margin:auto; }
      .slide-frame { width:100%; height:calc(720px * var(--deck-scale)); margin-bottom:24px; }
      section.slide { position:relative; box-sizing:border-box; width:1280px; height:720px; padding:56px 64px 78px; background:#F8F3ED; color:#292326; border:1px solid #ded3ce; transform:scale(var(--deck-scale)); transform-origin:top left; overflow:hidden; font-family:var(--font-manrope),sans-serif; font-size:20px; line-height:1.45; }
      .slide h1,.slide h2,.slide h3 { font-family:var(--font-newsreader),Georgia,serif; font-weight:400; color:#512A35; line-height:1.05; letter-spacing:-.01em; margin:0; }
      .slide h1 { font-size:96px; } .slide h2 { font-size:64px; } .slide h3 { font-size:32px; margin-bottom:24px; }
      .slide p { margin:16px 0; } .slide-content { margin-top:40px; } .slide footer { position:absolute; left:64px; right:64px; bottom:22px; padding-top:12px; border-top:1px solid #d9ccca; font-size:16px; color:#6E6266; }
      .slide-note { position:absolute; left:64px; right:64px; bottom:57px; font-size:16px; color:#6E6266; margin:0 !important; }
      .slide a { color:#854C5C; text-decoration:underline; } .slide .muted { color:#6E6266; font-size:18px; }
      .promise { font-size:48px; color:#512A35; } .large { font-size:30px; } .title-rule { height:8px; width:112px; background:#512A35; margin:48px 0 32px; }
      .title-meta { display:flex; justify-content:space-between; margin-top:80px; font-size:22px; }
      .facts { display:grid; grid-template-columns:repeat(3,1fr); gap:36px; } .facts article { border-top:2px solid #512A35; padding-top:24px; } .facts p { min-height:90px; } .big-number { font-size:62px; color:#512A35; display:block; font-weight:500; } .source { font-size:16px; display:block; }
      .band { background:#EAD9D5; padding:20px 24px; border-radius:6px; margin-top:36px; font-size:24px; color:#512A35; }
      .split { display:grid; grid-template-columns:1fr 1fr; gap:64px; } .hero-number { font-size:108px; color:#512A35; font-weight:500; line-height:1.2; } .hero-number span { font-size:32px; }
      .editorial-list { margin:0; padding-left:28px; } .editorial-list li { padding:17px 0; border-bottom:1px solid #ded3ce; }
      .steps { display:grid; grid-template-columns:repeat(4,1fr); gap:24px; } .steps a { text-decoration:none; border-top:2px solid #512A35; padding-top:20px; color:#292326; } .step-number { display:block; font-size:40px; color:#854C5C; margin-bottom:24px; } .steps h3 { margin-bottom:20px; }
      .slide table { width:100%; border-collapse:collapse; font-size:19px; font-variant-numeric:tabular-nums; } .slide th,.slide td { text-align:left; padding:16px 12px; border-bottom:1px solid #ded3ce; } .slide th { font-weight:500; } .slide thead th { font-size:16px; color:#6E6266; } .total { color:#512A35; background:#EAD9D5; }
      .plans-table th,.plans-table td { padding:12px !important; font-size:18px; } .service-prices { display:flex; flex-wrap:wrap; gap:12px 28px; margin-top:24px; font-size:18px; } .service-prices b { color:#512A35; } .price-explainer { display:grid; grid-template-columns:170px 1fr 190px 2fr; gap:16px; padding-top:24px; margin-top:24px; border-top:2px solid #512A35; font-size:18px; }
      .economics-key { display:flex; justify-content:space-between; margin-top:64px; gap:24px; } .economics-key strong { display:block; font-size:30px; color:#512A35; } .economics-key span { font-size:18px; color:#6E6266; }
      .arr-layout { display:grid; grid-template-columns:3fr 1fr; gap:32px; } .arr-layout table { font-size:17px; } .arr-layout td,.arr-layout th { padding:12px 8px; } .arr-total { display:flex; flex-direction:column; border-left:2px solid #512A35; padding-left:24px; gap:8px; } .arr-total strong { font-size:48px; color:#512A35; } .arr-total b { font-size:28px; margin-top:12px; color:#512A35; } .arr-total span { font-size:16px; color:#6E6266; } .market-line { font-size:24px; }
      .proof-numbers { display:flex; gap:110px; } .proof-numbers strong { display:block; font-size:80px; color:#512A35; line-height:1; } .proof-numbers span { font-size:18px; } .proof-details { margin-top:30px; } .proof-details h3 { margin-bottom:12px; } .proof-details p,.proof-details a { font-size:18px; } .eval-caveat { font-size:16px; color:#6E6266; } .slide details { font-size:16px; } .slide details[open] { position:absolute; inset:160px 64px auto; padding:24px; background:#FDFAF6; border:1px solid #ded3ce; border-radius:6px; }
      .moat-lines p { padding:12px 0; border-bottom:1px solid #ded3ce; font-size:25px; }
      .slide summary { min-height:44px; cursor:pointer; padding:10px 0; }
      @media screen and (max-width:640px) {
        .slide-frame { height:auto; }
        section.slide { width:100%; height:auto; min-height:560px; padding:24px 16px; transform:none; overflow:visible; font-size:16px; border-radius:8px; }
        .slide h1 { font-size:56px; } .slide h2 { font-size:36px; } .slide h3 { font-size:26px; }
        .slide-content { margin-top:24px; overflow-x:auto; }
        .slide footer,.slide-note { position:static; margin-top:24px !important; }
        .facts,.split,.steps,.arr-layout { grid-template-columns:1fr; gap:24px; }
        .facts p { min-height:0; } .title-meta,.economics-key,.proof-numbers { flex-direction:column; gap:24px; }
        .promise { font-size:32px; } .large { font-size:24px; } .band { font-size:18px; }
        .slide a { display:inline-flex; align-items:center; min-height:44px; }
        .slide table { min-width:650px; } .price-explainer { grid-template-columns:1fr; }
        .slide details[open] { position:static; padding:16px; } .moat-lines p { font-size:18px; }
      }
      .loop-lines span { display:block; padding:17px 0; border-bottom:1px solid #ded3ce; }
      @page { size:1280px 720px; margin:0; }
      @media print {
        body > header, body > footer, nav, .no-print { display:none !important; }
        html,body { margin:0 !important; padding:0 !important; width:1280px; print-color-adjust:exact; -webkit-print-color-adjust:exact; }
        body > a { display:none !important; } main,.deck-page,.deck { margin:0 !important; padding:0 !important; max-width:none !important; width:1280px; }
        .slide-frame { margin:0; height:auto; width:1280px; }
        section.slide { break-after:page; page-break-after:always; width:1280px; height:720px; transform:none; border:0; }
        .slide-frame:last-child section.slide { break-after:auto; page-break-after:auto; }
      }
    `}</style>
  </div>;
}
