import { RUBRIC_VERSION, type Assessment, type Claim, type EvidenceSource, type Stance } from "./types";
import { ENTITIES, isNegatedClaim, keywords, type Entity } from "./extract";
import type { RawArticle } from "./pubmed";
import { pubmedUrl } from "./pubmed";

/* ---------- query building (spec §5.3: primary + high-quality + active contradiction search) ---------- */
const HUMAN = "NOT (animals[mh] NOT humans[mh])";
const QUALITY = '(meta-analysis[pt] OR systematic review[pt] OR randomized controlled trial[pt] OR practice guideline[pt])';
const NULL_CUES = '("no significant"[tiab] OR "no effect"[tiab] OR "not associated"[tiab] OR "did not"[tiab] OR "no difference"[tiab] OR ineffective[tiab] OR "no benefit"[tiab] OR "not effective"[tiab])';

export function claimTerms(claim: Claim): { label: string; q: string }[] {
  const ents = claim.entities.map((n) => ENTITIES.find((e) => e.name === n)).filter(Boolean) as Entity[];
  const terms = ents.map((e) => ({ label: e.name, q: e.q }));
  if (terms.length < 2) for (const k of keywords(claim.normalized_text)) if (!terms.some((t) => t.label.includes(k))) terms.push({ label: k, q: k });
  return terms.slice(0, 3);
}

export function buildQueries(claim: Claim) {
  const core = claimTerms(claim).map((t) => `(${t.q.split(" OR ").map((x) => `"${x}"[tiab]`).join(" OR ")})`).join(" AND ");
  return {
    primary: `${core} ${HUMAN}`,
    quality: `${core} AND ${QUALITY}`,
    contradiction: `${core} AND ${NULL_CUES} ${HUMAN}`,
  };
}

/* ---------- study design (evidence hierarchy) ---------- */
export function design(a: Pick<RawArticle, "pubTypes" | "mesh" | "title" | "abstract">): { label: string; weight: number; nonHuman: boolean } {
  const pt = a.pubTypes.join("|").toLowerCase();
  const txt = `${a.title} ${a.abstract}`.toLowerCase();
  const nonHuman = (a.mesh.includes("Animals") && !a.mesh.includes("Humans")) ||
    (/\b(mice|mouse|rats?|murine|in vitro|cell line|zebrafish|porcine|rabbits?)\b/.test(txt) && !/\b(patients|participants|volunteers|subjects|women|men|adults|children)\b/.test(txt));
  if (nonHuman) return { label: "Animal / lab study", weight: 0.5, nonHuman };
  if (pt.includes("guideline")) return { label: "Clinical guideline", weight: 5, nonHuman };
  if (pt.includes("meta-analysis") || /meta-analys/.test(txt)) return { label: "Meta-analysis", weight: 5, nonHuman };
  if (pt.includes("systematic review") || /systematic review/.test(txt)) return { label: "Systematic review", weight: 4.5, nonHuman };
  if (pt.includes("randomized controlled trial") || /randomi[sz]ed/.test(txt)) return { label: "Randomized trial", weight: 4, nonHuman };
  if (pt.includes("clinical trial")) return { label: "Clinical trial", weight: 3, nonHuman };
  if (/\b(cohort|case-control|cross-sectional|prospective|observational)\b/.test(txt)) return { label: "Observational study", weight: 2, nonHuman };
  if (pt.includes("case reports")) return { label: "Case report", weight: 1, nonHuman };
  if (pt.includes("review")) return { label: "Narrative review", weight: 1.5, nonHuman };
  return { label: "Other study", weight: 1, nonHuman };
}

/* ---------- stance cues ---------- */
const NEG = [
  /\bno (statistically )?significant (difference|effect|improvement|change|benefit|association|reduction|increase)s?\b(?! in (adverse|side))/i,
  /\bnot (significantly )?(associated|effective|efficacious|superior|beneficial)\b/i,
  /\bdid not (significantly )?(improve|reduce|change|affect|differ|increase|decrease|show|prevent|alter)\b/i,
  /\bno (clear |convincing |consistent |beneficial )?(benefit|effect)s?\b/i,
  /\b(ineffective|failed to|does not support|no difference|was not effective|were not effective|not supported)\b/i,
  /\b(increased|higher) risk of\b/i,
  /\b(no|lack of|little|insufficient) (current |clinical |clear |convincing |good |high-quality |robust |scientific )*evidence (to support|that|for|of)\b/i,
  /\bnot supported by\b/i,
];
const POS = [
  /\bsignificant(ly)? (improv|reduc|increas|decreas|lower|benefit|better|enhanc|alleviat)\w*/i,
  /\b(improved|reduced|decreased|enhanced|alleviated|attenuated|lowered|prevented)\b/i,
  /\b(effective|efficacious|beneficial|promising|well-tolerated and effective)\b/i,
  /\bassociated with (a )?(lower|reduced|decreased|improved|better|higher)\b/i,
  /\b(?<!evidence to )(supports? the use|may be (a )?(useful|beneficial|effective))\b/i,
];
const UNCERTAIN = /\b(insufficient|inconclusive|limited|low[- ]certainty|very low[- ]quality|low[- ]quality|conflicting|mixed) (evidence|results|data|findings)\b|\bmore (research|studies|trials) (is|are) needed\b|\bremains unclear\b/i;

export function classifyStance(text: string | null): Stance {
  if (!text) return "neutral";
  const neg = NEG.filter((r) => r.test(text)).length;
  const pos = POS.filter((r) => r.test(text)).length;
  if (UNCERTAIN.test(text) && pos <= neg + 1 && neg === 0) return "neutral";
  if (neg > 0 && neg >= pos) return "contradicts";
  if (pos > neg) return "supports";
  return "neutral";
}

/** Converts a raw PubMed article into an evidence record relative to a claim. Never invents fields. */
export function toEvidence(a: RawArticle, claim: Claim, via: EvidenceSource["retrieved_via"]): EvidenceSource {
  const terms = claimTerms(claim);
  const hay = `${a.title} ${a.abstract} ${a.mesh.join(" ")}`.toLowerCase();
  const matched = terms.filter((t) => [t.label, ...t.q.split(" OR ")].some((x) => hay.includes(x.toLowerCase())));
  const d = design(a);
  let stance = classifyStance(a.conclusion);
  if (isNegatedClaim(claim.normalized_text) && stance !== "neutral") stance = stance === "supports" ? "contradicts" : "supports";
  return {
    pmid: a.pmid, doi: a.doi, title: a.title || "(untitled record)", journal: a.journal, year: a.year, url: pubmedUrl(a.pmid),
    pub_types: a.pubTypes, study_design: d.label, design_weight: d.weight, non_human: d.nonHuman,
    abstract_available: a.abstract.length > 0, conclusion: a.conclusion, stance,
    relevance: terms.length ? Math.round((matched.length / terms.length) * 100) / 100 : 0,
    rationale: `${matched.length ? `Mentions ${matched.map((m) => m.label).join(" + ")}` : "Weak term overlap"} · ${d.label}${via === "contradiction" ? " · found by our null-result search" : ""}`,
    retrieved_via: via,
  };
}

/* ---------- verdict (spec §5.4) ---------- */
export function assess(claim: Claim, evidence: EvidenceSource[], opts: { retrievalComplete: boolean; queries: string[]; model?: string; summaryOverride?: string }): Assessment {
  const rel = evidence.filter((e) => e.relevance >= 0.5);
  const w = (e: EvidenceSource) => e.design_weight * (e.non_human ? 0.3 : 1);
  const sup = rel.filter((e) => e.stance === "supports");
  const con = rel.filter((e) => e.stance === "contradicts");
  const neu = rel.filter((e) => e.stance === "neutral");
  const S = sup.reduce((s, e) => s + w(e), 0);
  const C = con.reduce((s, e) => s + w(e), 0);
  const total = S + C;
  const human = rel.filter((e) => !e.non_human);
  const strong = rel.filter((e) => e.design_weight >= 4 && !e.non_human);
  const ratio = total ? S / total : 0;

  const limitations: string[] = [];
  if (rel.length < 4) limitations.push(`Only ${rel.length} closely relevant ${rel.length === 1 ? "study" : "studies"} found on PubMed.`);
  if (rel.some((e) => e.non_human)) limitations.push(`${rel.filter((e) => e.non_human).length} of the studies are animal or lab studies — results may not apply to people.`);
  if (!strong.length && rel.length) limitations.push("No meta-analyses or randomized trials among the matched studies.");
  if (S > 0 && C > 0) limitations.push("Studies disagree. We weigh study design rather than counting papers as votes.");
  const noAbs = rel.filter((e) => !e.abstract_available).length;
  if (noAbs) limitations.push(`${noAbs} source(s) have no abstract on PubMed; their direction is unknown.`);
  if (claim.missing_qualifiers.length) limitations.push(`The claim doesn't say ${claim.missing_qualifiers.map((q) => ({ dose: "what dose", concentration: "what concentration", population: "for whom", duration: "for how long", route: "how it's used" })[q]).join(", ")} — results often depend on it.`);
  limitations.push("Based on PubMed titles and abstracts only; full texts were not read.");

  const safety: string[] = [];
  const t = claim.normalized_text.toLowerCase();
  if (claim.domain === "supplements") safety.push("Supplements can interact with prescription medicines — a pharmacist can check your list.");
  if (/\b(instead of|stop taking|quit|ditch|replace)\b.*\b(medication|meds|medicine|insulin|antidepressants?|chemo|statins?|inhaler)\b/.test(t)) safety.push("Don't stop or swap prescribed treatment because of an online claim — talk to the clinician who prescribed it.");
  if (/\bpregnan/.test(t)) safety.push("Pregnancy changes what is safe; ask your OB or midwife.");
  if (claim.claim_type === "dosage") safety.push("VetoHealth doesn't give doses. Dosing should come from a clinician or the product label.");
  if (/\b(chest pain|can'?t breathe|trouble breathing|anaphyla|suicid)/.test(t)) safety.push("If you have chest pain, trouble breathing, a severe allergic reaction or thoughts of self-harm, call 911 or 988 now.");

  let verdict: Assessment["verdict"];
  let why: string;
  const over = claim.overclaim_terms.length > 0;
  if (!opts.retrievalComplete) {
    verdict = "insufficient_evidence";
    why = "We couldn't finish searching PubMed, so this report is incomplete. That is not the same as \"no evidence exists\" — please re-run.";
  } else if (human.length < 2 && !(over && rel.length >= 1)) {
    verdict = "insufficient_evidence";
    why = rel.length ? `Only ${human.length} relevant human ${human.length === 1 ? "study" : "studies"} — too thin to judge, so we abstain.` : "We found no closely matching human studies. Extraordinary claims need evidence; we abstain rather than guess.";
  } else if (over && !(ratio >= 0.85 && strong.filter((e) => e.stance === "supports").length >= 2)) {
    verdict = "misleading";
    why = `The claim uses absolute language (“${claim.overclaim_terms.join("”, “")}”) that the evidence doesn't back. ${S > 0 ? "Some studies show a modest effect, not a cure-all." : "None of the matched studies support it as stated."}`;
  } else if (ratio >= 0.75 && S >= 6 && strong.some((e) => e.stance === "supports")) {
    verdict = claim.missing_qualifiers.includes("population") && claim.missing_qualifiers.includes("duration") && S < 10 ? "partially_supported" : "supported";
    why = verdict === "supported" ? "Higher-quality human studies mostly point the same way as the claim." : "The direction holds up, but studies used specific groups, doses or durations the claim leaves out.";
  } else if (ratio >= 0.5 && S >= 2) {
    verdict = "partially_supported";
    why = "There is some supporting evidence, but it is weaker, smaller or more specific than the claim implies.";
  } else if (ratio <= 0.3 && C >= 4) {
    verdict = "contradicted";
    why = "The better-designed studies we found did not find the claimed effect.";
  } else {
    verdict = "insufficient_evidence";
    why = "The evidence is mixed or weak in both directions, so we abstain.";
  }

  const top = [...rel].sort((a, b) => b.design_weight - a.design_weight)[0];
  const summary = opts.summaryOverride ?? `${why} We matched ${rel.length} PubMed ${rel.length === 1 ? "record" : "records"}: ${sup.length} leaning supportive, ${con.length} finding no effect or the opposite, ${neu.length} unclear.${top ? ` Strongest design: ${top.study_design.toLowerCase()} (${top.year}).` : ""}`;
  const agreement = total ? Math.abs(S - C) / total : 0;
  const confidence = opts.retrievalComplete ? Math.min(0.92, (total / (total + 8)) * (0.5 + agreement / 2)) : 0.05;

  return {
    claim_id: claim.claim_id, verdict, confidence_score: Math.round(confidence * 100) / 100,
    confidence_interpretation: "uncalibrated_internal_score", summary,
    supporting_source_ids: sup.map((e) => e.pmid), contradictory_source_ids: con.map((e) => e.pmid), neutral_source_ids: neu.map((e) => e.pmid),
    limitations, safety_notes: safety, retrieval_complete: opts.retrievalComplete,
    requires_human_review: !opts.retrievalComplete || confidence < 0.5 || (S > 0 && C > 0),
    assessment_version: 1, model_version: opts.model ?? "rules-v1", rubric_version: RUBRIC_VERSION, queries: opts.queries,
  };
}
