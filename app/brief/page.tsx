"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProfile } from "@/lib/ledger";
import { listThreads } from "@/lib/store";
import { analyzeRoutine, type RoutineProduct } from "@/lib/ingredients";
import { listBookings } from "@/lib/booking";
import { savingsTotals, usd } from "@/lib/savings";
import { SERVICES } from "@/lib/pricing";
import { VERDICTS, type ClaimReport } from "@/lib/types";

type Section = "claims" | "routine" | "labs" | "questions";
type Marker = { biomarker: string; value: string; unit: string | null; ref_text: string; appointment: string };

export default function BriefPage() {
  const [firstName, setFirstName] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [claims, setClaims] = useState<ClaimReport[]>([]);
  const [routine, setRoutine] = useState<ReturnType<typeof analyzeRoutine> | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [money, setMoney] = useState(0);
  const [date, setDate] = useState("");
  const [included, setIncluded] = useState<Record<Section, boolean>>({ claims: true, routine: true, labs: true, questions: true });

  useEffect(() => {
    try {
      setStatus("loading");
      setFirstName(getProfile().firstName);
      // Probe storage so blocked access is reported instead of appearing empty.
      const raw: unknown = JSON.parse(localStorage.getItem("veto:routine") ?? "[]");
      if (!Array.isArray(raw)) throw new Error("Invalid shelf");
      const products: RoutineProduct[] = [];
      for (const [index, item] of raw.entries()) {
        if (!item || typeof item !== "object" || typeof item.name !== "string" || typeof item.ingredientsText !== "string" || !["skincare", "supplement"].includes(item.type) || !["am", "pm", "both"].includes(item.timeOfDay)) continue;
        products.push({ id: typeof item.id === "string" ? item.id : `brief-${index}`, name: item.name, type: item.type, timeOfDay: item.timeOfDay, ingredientsText: item.ingredientsText,
          ...(typeof item.monthlyUsd === "number" && Number.isFinite(item.monthlyUsd) && item.monthlyUsd >= 0 ? { monthlyUsd: item.monthlyUsd } : {}) });
      }
      setRoutine(analyzeRoutine(products)); // Uses parseIngredientList for each product.
      setClaims(listThreads().flatMap(thread => thread.versions.at(-1)?.claims ?? []));
      const outside: Marker[] = [];
      for (const booking of listBookings()) {
        if (booking.status !== "requested" || !["lab_consult", "lab_review"].includes(booking.kind) || Date.parse(booking.slot_iso) < Date.now()) continue;
        if (!booking.details?.markers) continue;
        // A malformed optional summary must not hide other saved checks.
        try {
          const rows: unknown = JSON.parse(booking.details.markers);
          if (!Array.isArray(rows)) continue;
          for (const row of rows) {
            if (!row || typeof row !== "object" || !["low", "high"].includes(row.flag) || typeof row.biomarker !== "string" || typeof row.value !== "string" || typeof row.ref_text !== "string" || !row.ref_text.trim()) continue;
            outside.push({ biomarker: row.biomarker, value: row.value, unit: typeof row.unit === "string" ? row.unit : null, ref_text: row.ref_text, appointment: new Date(booking.slot_iso).toLocaleString() });
          }
        } catch { /* No usable lab summary for this booking. */ }
      }
      setMarkers(outside);
      const total = savingsTotals().monthly;
      setMoney(Number.isFinite(total) && total >= 0 ? total : 0);
      setDate(new Date().toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" }));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [attempt]);

  const questions = [
    ...(included.claims ? claims.map(item => `Is there good evidence for “${item.claim.verbatim_text}” for someone like me?`) : []),
    ...(included.routine ? routine?.duplicates.map(item => `Is repeated ${item.ingredient.toLowerCase()} in my routine a problem?`) ?? [] : []),
    ...(included.routine ? routine?.warnings.filter(item => item.severity === "caution").map(item => `Does “${item.title}” affect my routine?`) ?? [] : []),
    ...(included.labs ? markers.map(item => `Should ${item.biomarker} outside the lab range be rechecked?`) : []),
  ];
  const empty = !claims.length && !routine?.items.length && !markers.length;

  return (
    <article className="doctor-brief mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <Link href="/ledger" className="brief-controls btn-ghost mb-6 min-h-11">Back to ledger</Link>
      <h1 className="display text-4xl sm:text-5xl">{firstName ? `${firstName}’s doctor brief` : "Your doctor brief"}</h1>
      <p className="mt-3 text-base text-muted">{date || "Preparing date"} · From your checks</p>
      {status === "loading" && <div className="mt-8" role="status"><p>Reading saved checks on this device.</p><progress className="mt-3 w-full accent-burgundy" aria-label="Reading saved checks" /></div>}
      {status === "error" && <div className="brief-controls mt-8" role="alert"><p>Saved checks could not be read.</p><button className="btn-primary mt-4" onClick={() => setAttempt(value => value + 1)}>Retry</button></div>}
      {status === "ready" && <>
        <div className="brief-controls my-6 flex flex-wrap gap-3">
          <button className="btn-primary min-h-11" disabled={empty || !Object.values(included).some(Boolean)} onClick={() => window.print()}>Print or save PDF</button>
          <Link className="btn-ghost min-h-11" href="/labs">Discuss it in a ${SERVICES.lab_consult.price} consult</Link>
        </div>
        {empty && <div className="brief-controls my-8 border-y border-line py-6"><h2 className="display text-2xl">Start with your checks</h2><p className="mt-2">Save a check or shelf to prepare your brief.</p><div className="mt-3 flex flex-wrap gap-4"><Link className="inline-flex min-h-11 items-center underline" href="/check">Check a claim</Link><Link className="inline-flex min-h-11 items-center underline" href="/shelf">Open your shelf</Link></div></div>}
        {!empty && <p className="my-4 text-base">Money kept from your checks: {usd(money)}/month.</p>}
        {([ ["claims", "Claims I’m considering"], ["routine", "Shelf overlaps & cautions"], ["labs", "Lab values to discuss"], ["questions", "Questions to ask"] ] as const).map(([key, title]) => (
          <section key={key} className={`brief-section border-t border-line py-5 ${included[key] ? "" : "brief-excluded"}`}>
            <div className="flex items-center gap-3"><input id={`include-${key}`} type="checkbox" checked={included[key]} onChange={event => setIncluded(current => ({ ...current, [key]: event.target.checked }))} className="brief-controls h-5 w-5 shrink-0 accent-burgundy" /><h2 className="display text-2xl"><label className="flex min-h-11 cursor-pointer items-center" htmlFor={`include-${key}`}>{title}</label></h2></div>
            {included[key] && <div className="mt-3 space-y-3 break-words">
              {key === "claims" && (claims.length ? claims.map((item, index) => <div key={`${item.claim.claim_id}-${index}`}><p>{item.claim.verbatim_text}</p><p className="font-medium">{VERDICTS[item.assessment.verdict]?.label ?? "Incomplete"}{!item.assessment.retrieval_complete && " · Retrieval incomplete"}</p><details><summary className="min-h-11 cursor-pointer py-2">Bottom line and references</summary><p>{item.assessment.bottom_line}</p><ul className="mt-2 space-y-2">{item.evidence.slice(0, 2).filter(source => /^\d+$/.test(source.pmid)).map(source => <li key={source.pmid}><a className="underline" href={`https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`}>{source.title} · PMID {source.pmid}</a></li>)}</ul></details></div>) : <p>No saved claims from your checks.</p>)}
              {key === "routine" && <>
                {routine?.duplicates.map((item, index) => <p key={`overlap-${index}`}>Repeated {item.ingredient.toLowerCase()}</p>)}
                {routine?.warnings.filter(item => item.severity === "caution").map((item, index) => <p key={`caution-${index}`}>{item.title}</p>)}
                {!routine?.duplicates.length && !routine?.warnings.some(item => item.severity === "caution") && <p>No overlaps or cautions recorded from your checks.</p>}
                {!!routine?.items.length && <p className="text-muted">Label matching only; amounts and individual risk remain unassessed.</p>}
                {!!routine?.unrecognized.length && <p>Unrecognised ingredients remain unassessed.</p>}
              </>}
              {key === "labs" && (markers.length ? markers.map((item, index) => <div key={index}><p>{item.biomarker}: {item.value} {item.unit}</p><p>Lab range: {item.ref_text} · Outside the lab’s range</p><details><summary className="min-h-11 cursor-pointer py-2">Request details</summary><p>{item.appointment} · Pilot request; appointment unconfirmed.</p></details></div>) : <p>No flagged values saved with upcoming lab requests.</p>)}
              {key === "questions" && (questions.length ? <ul className="list-disc space-y-2 pl-5">{[...new Set(questions)].map(question => <li key={question}>{question}</li>)}</ul> : <p>What should I bring to my next appointment?</p>)}
            </div>}
          </section>
        ))}
        <p className="mt-6 border-t border-line pt-4 text-base text-muted">Prepared by VetoHealth from your own checks. Not a diagnosis.</p>
      </>}
      <style jsx global>{`
        @media print {
          @page { size: auto; margin: 12mm; }
          html, body, main, .doctor-brief { background: white !important; color: black !important; }
          body > header, body > footer, body > a, .brief-controls, .brief-excluded { display: none !important; }
          .doctor-brief { max-width: none; padding: 0; font-size: 10pt; }
          .doctor-brief h1 { font-size: 26pt; }
          .doctor-brief h2 { font-size: 15pt; }
          .doctor-brief p, .doctor-brief li, .doctor-brief a { font-size: 10pt; line-height: 1.3; color: black; }
          .brief-section { padding: 6pt 0; }
          .doctor-brief label { min-height: 0; }
          .doctor-brief details > summary { display: none; }
          .doctor-brief details > *:not(summary) { display: block !important; }
          .doctor-brief details { content-visibility: visible !important; }
          .doctor-brief details::details-content { content-visibility: visible !important; }
          .doctor-brief li { break-inside: avoid; }
          .doctor-brief h2 { break-after: avoid; }
          .doctor-brief a { text-decoration: none; }
        }
      `}</style>
    </article>
  );
}
