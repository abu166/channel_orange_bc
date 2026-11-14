"use client";

import { ingredientById, parseIngredientList, type RoutineProduct } from "./ingredients";
import { runAnalysis } from "./store";
import { VERDICTS, type Verdict } from "./types";

export interface ProofGrade {
  verdict: Verdict;
  bottom_line: string;
  studies: number;
  checked_at: string;
}
export type ProofGrades = Record<string, ProofGrade>;
export interface ProofProgress { current: number; total: number; claim: string; grades: ProofGrades }
const WEEK = 7 * 24 * 60 * 60 * 1000;

function shelfActives(product: RoutineProduct) {
  return [...new Set(parseIngredientList(product.ingredientsText).flatMap(i => i.canonicalId ? [i.canonicalId] : []))]
    .flatMap(id => { const ingredient = ingredientById.get(id); return ingredient?.benefitClaim ? [ingredient] : []; });
}

function readCache(): ProofGrades {
  try {
    const value: unknown = JSON.parse(localStorage.getItem("veto:proof") ?? "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([, g]) => g &&
      Object.hasOwn(VERDICTS, g.verdict) && typeof g.bottom_line === "string" &&
      Number.isInteger(g.studies) && g.studies >= 0 && typeof g.checked_at === "string" &&
      Date.now() - Date.parse(g.checked_at) >= 0 && Date.now() - Date.parse(g.checked_at) < WEEK));
  } catch { return {}; }
}

/** Sequential live checks; incomplete retrievals never become evidence or cached verdicts. */
export async function gradeShelf(products: RoutineProduct[], onProgress: (progress: ProofProgress) => void): Promise<ProofGrades> {
  const claims = [...new Set(products.flatMap(p => shelfActives(p).map(i => i.benefitClaim!)))];
  const cache = readCache();
  const grades: ProofGrades = {};
  let requested = false;
  for (const [index, claim] of claims.entries()) {
    onProgress({ current: index + 1, total: claims.length, claim, grades: { ...grades } });
    if (!cache[claim]) {
      if (requested) await new Promise(resolve => setTimeout(resolve, 1500));
      requested = true;
      const report = await runAnalysis({ text: claim, content_type: "text" }, () => {});
      const result = report.claims[0];
      if (report.status === "failed" || report.claims.length !== 1 || !result?.assessment.retrieval_complete) {
        throw new Error("Evidence check incomplete; remaining spending stays ungraded.");
      }
      cache[claim] = {
        verdict: result.assessment.verdict, bottom_line: result.assessment.bottom_line,
        studies: result.evidence.filter(e => e.counts_as_proof).length, checked_at: new Date().toISOString(),
      };
      try { localStorage.setItem("veto:proof", JSON.stringify(cache)); } catch { /* Checks work without storage. */ }
    }
    grades[claim] = cache[claim];
    onProgress({ current: index + 1, total: claims.length, claim, grades: { ...grades } });
  }
  return grades;
}

/** Equal allocation across distinct actives; missing grades retain their ungraded share. */
export function proofSpend(products: RoutineProduct[], grades: ProofGrades) {
  let backedMonthly = 0, unprovenMonthly = 0, ungradedMonthly = 0;
  const rows = new Map<string, { ingredient: string; claim: string; verdict: Verdict | null; monthlyShare: number; products: string[] }>();
  for (const product of products) {
    const cost = typeof product.monthlyUsd === "number" && Number.isFinite(product.monthlyUsd) && product.monthlyUsd >= 0 ? product.monthlyUsd : 0;
    const actives = shelfActives(product);
    if (!actives.length) { ungradedMonthly += cost; continue; }
    for (const active of actives) {
      const claim = active.benefitClaim!;
      const verdict = grades[claim]?.verdict ?? null;
      const share = cost / actives.length;
      if (verdict === "supported" || verdict === "partially_supported") backedMonthly += share;
      else if (verdict) unprovenMonthly += share;
      else ungradedMonthly += share;
      const row = rows.get(active.id) ?? { ingredient: active.name, claim, verdict, monthlyShare: 0, products: [] };
      row.monthlyShare += share;
      row.products.push(product.name);
      rows.set(active.id, row);
    }
  }
  return { backedMonthly, unprovenMonthly, ungradedMonthly, perIngredient: [...rows.values()] };
}
