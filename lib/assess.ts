import { RUBRIC_VERSION, type Assessment, type Claim, type EvidenceSource, type Stance } from "./types";
import { ENTITIES, isNegatedClaim, keywords, type Entity } from "./extract";
import type { RawArticle } from "./pubmed";
import { pubmedUrl } from "./pubmed";

/* ---------- query building (spec §5.3: primary + high-quality + active contradiction search) ---------- */
const HUMAN = "NOT (animals[mh] NOT humans[mh])";
const QUALITY = "(meta-analysis[pt] OR systematic review[pt] OR randomized controlled trial[pt] OR practice guideline[pt])";
const NULL_CUES = '("no significant"[tiab] OR "no effect"[tiab] OR "not associated"[tiab] OR "did not"[tiab] OR "no difference"[tiab] OR ineffective[tiab] OR "no benefit"[tiab] OR "not effective"[tiab])';

export function claimTerms(claim: Claim): { label: string; q: string }[] {
  if (claim.search_terms?.length) return claim.search_terms.slice(0, 3);
  const ents = claim.entities.map((n) => ENTITIES.find((e) => e.name === n)).filter(Boolean) as Entity[];
  const terms = ents.map((e) => ({ label: e.name, q: e.q }));
  if (terms.length < 2) for (const k of keywords(claim.normalized_text)) if (!terms.some((t) => t.label.includes(k)) && k !== claim.comparator) terms.push({ label: k, q: k });
  return terms.slice(0, 3);
}

// [tw] = text words: title, abstract and MeSH headings, so "soft drinks" also finds papers indexed under "Carbonated Beverages".
const tiab = (q: string) => `(${q.split(" OR ").map((x) => `"${x.trim()}"[tw]`).join(" OR ")})`;

export function buildQueries(claim: Claim) {
  const core = claimTerms(claim).map((t) => tiab(t.q)).join(" AND ");
  return {
    primary: `${core} ${HUMAN}`,
    quality: `${core} AND ${QUALITY}`,
    contradiction: `${core} AND ${NULL_CUES} ${HUMAN}`,
    comparator: claim.comparator ? `${core} AND ${tiab(claim.comparator)}` : null,
    // Used only when the strict searches find nothing: PubMed's automatic term mapping, no field tags.
    broad: `${claimTerms(claim).map((t) => `(${t.q.split(" OR ").map((x) => x.trim()).join(" OR ")})`).join(" AND ")} ${HUMAN}`,
  };
}

/* ---------- study design (evidence hierarchy) ---------- */
export function design(a: Pick<RawArticle, "pubTypes" | "mesh" | "title" | "abstract">): { label: string; weight: number; nonHuman: boolean; proof: boolean } {
  const pt = a.pubTypes.join("|").toLowerCase();
  const txt = `${a.title} ${a.abstract}`.toLowerCase();
  const nonHuman = (a.mesh.includes("Animals") && !a.mesh.includes("Humans")) ||
    (/\b(mice|mouse|rats?|murine|in vitro|cell line|zebrafish|porcine|rabbits?)\b/.test(txt) && !/\b(patients|participants|volunteers|subjects|women|men|adults|children)\b/.test(txt));
  if (nonHuman) return { label: "Animal / lab study", weight: 0.3, nonHuman, proof: false };
  if (pt.includes("guideline")) return { label: "Clinical guideline", weight: 5, nonHuman, proof: true };
  if (pt.includes("meta-analysis") || /meta-analys/.test(txt)) return { label: "Meta-analysis", weight: 5, nonHuman, proof: true };
  if (pt.includes("systematic review") || /systematic review/.test(txt)) return { label: "Systematic review", weight: 4.5, nonHuman, proof: true };
  if (pt.includes("randomized controlled trial") || /randomi[sz]ed/.test(txt)) return { label: "Randomized trial", weight: 4, nonHuman, proof: true };
  if (pt.includes("clinical trial")) return { label: "Clinical trial", weight: 3, nonHuman, proof: true };
  if (/\b(cohort|case-control|cross-sectional|prospective|observational)\b/.test(txt)) return { label: "Observational study", weight: 2, nonHuman, proof: true };
  if (pt.includes("case reports")) return { label: "Case report", weight: 0.5, nonHuman, proof: false };
  if (pt.includes("review")) return { label: "Narrative review", weight: 1, nonHuman, proof: false };
  return { label: "Other study", weight: 0.8, nonHuman, proof: false };
}

/* ---------- stance cues (sentence level) ---------- */
const NEG = [
  /\bno (statistically )?significant (difference|effect|improvement|change|benefit|association|reduction|increase)s?\b(?! in (adverse|side))/i,
  /\bnot (significantly )?(associated|effective|efficacious|superior|beneficial|justified|recommended|supported)\b/i,
  /\b(did|does|do|was|were) not (significantly |appear to |seem to )?(improve|reduce|change|affect|differ|increase|decrease|show|prevent|alter|be effective|have|lower)\b/i,
  /\b(did|does|do) not appear\b/i,
  /\bno (clear |convincing |consistent |beneficial |meaningful )?(benefit|effect)s?\b/i,
  /\b(ineffective|failed to|failure (of|to)|does not support|no difference|unlikely to|not be recommended)\b/i,
  /\b(increased|higher) risk of\b/i,
  /\b(no|lack of|little|insufficient) (current |clinical |clear |convincing |good |high-quality |robust |scientific )*evidence (to support|that|for|of)\b/i,
  /\bnot supported by\b/i,
];
const POS = [
  /\bsignificant(ly)? (improv|reduc|increas|decreas|lower|benefit|better|enhanc|alleviat)\w*/i,
  /\b(improved|reduced|decreased|enhanced|alleviated|attenuated|lowered|prevented|reduces|improves)\b/i,
  /\b(effective|efficacious|beneficial|promising)\b/i,
  /\bassociated with (a )?(lower|reduced|decreased|improved|better|higher)\b/i,
  /\b(?<!evidence to )(supports? the use|may be (a )?(useful|beneficial|effective))\b/i,
];
const UNCERTAIN = /\b(insufficient|inconclusive|limited|low[- ]certainty|very low[- ]quality|low[- ]quality|conflicting|mixed) (evidence|results|data|findings)\b|\bmore (research|studies|trials) (is|are) needed\b|\bremains unclear\b/i;
const FOCUS: Partial<Record<Claim["claim_type"], RegExp>> = {
  prevention: /\b(incidence|risk|prevent\w*|occurrence|develop\w*|onset)\b/i,
  safety: /\b(safe\w*|adverse|toxic\w*|harm\w*|side effects?|risk)\b/i,
};

/** Harm claims ("X causes cancer") flip what counts as support: higher risk supports, lower risk / no link contradicts. */
export const isHarmClaim = (t: string) => /\b(causes?|caused|leads? to|triggers?|damages?|increases? (the )?risk|raises? (the )?risk|is (bad|toxic|dangerous|harmful)|are (bad|toxic|dangerous|harmful)|gives? you)\b/i.test(t);
const HARM_UP = /\b(increased|higher|elevated|greater) (risk|incidence|odds)\b|\bpositive(ly)? associat\w*|\bassociated with (an |a )?(increased|higher|greater)\b|\bcarcinogenic\b|\bcaus(es|ed) \w+/i;
const HARM_DOWN = /\b(lower|reduced|decreased) (risk|incidence|odds)\b|\binverse(ly)? (associat\w*|relat\w*)|\bprotective\b|\bassociated with (a )?(lower|reduced|decreased)\b/i;

/** Sentence-level stance. With `focus`, only sentences about the claimed outcome (e.g. incidence for "prevents") count. */
export function classifyStance(text: string | null, focus?: RegExp, harm = false): Stance {
  if (!text) return "neutral";
  let sents = text.split(/(?<=[.;])\s+/).filter((s) => s.length > 8);
  if (focus) { const f = sents.filter((s) => focus.test(s)); if (f.length) sents = f; }
  let score = 0;
  sents.forEach((s, i) => {
    const w = i === 0 ? 1.5 : 1;
    if (harm) {
      if (HARM_UP.test(s) && !/\bno (significant )?(increased|higher)/i.test(s)) score += w;
      else if (HARM_DOWN.test(s) || NEG.some((r) => r.test(s))) score -= w;
      return;
    }
    if (NEG.some((r) => r.test(s))) score -= w;
    else if (POS.some((r) => r.test(s)) && !UNCERTAIN.test(s)) score += w;
  });
  return score < 0 ? "contradicts" : score > 0 ? "supports" : "neutral";
}

/** Converts a raw PubMed article into an evidence record relative to a claim. Never invents fields. */
export function toEvidence(a: RawArticle, claim: Claim, via: EvidenceSource["retrieved_via"]): EvidenceSource {
  const terms = claimTerms(claim);
  const hay = `${a.title} ${a.abstract} ${a.mesh.join(" ")}`.toLowerCase();
  const matched = terms.filter((t) => [t.label, ...t.q.split(" OR ")].some((x) => hay.includes(x.trim().toLowerCase())));
  const d = design(a);
  let stance = classifyStance(a.conclusion, FOCUS[claim.claim_type], isHarmClaim(claim.normalized_text));
  if (isNegatedClaim(claim.normalized_text) && stance !== "neutral") stance = stance === "supports" ? "contradicts" : "supports";
  const mentionsComparator = !!claim.comparator && hay.includes(claim.comparator);
  return {
    pmid: a.pmid, doi: a.doi, title: a.title || "(untitled record)", journal: a.journal, year: a.year, url: pubmedUrl(a.pmid),
    pub_types: a.pubTypes, study_design: d.label, design_weight: d.weight, non_human: d.nonHuman,
    abstract_available: a.abstract.length > 0, conclusion: a.conclusion, stance,
    relevance: terms.length ? Math.round((matched.length / terms.length) * 100) / 100 : 0,
    rationale: `${matched.length ? `Mentions ${matched.map((m) => m.label).join(" + ")}` : "Weak term overlap"}${mentionsComparator ? ` + ${claim.comparator}` : ""}${via === "contradiction" ? " · found by our no-effect search" : ""}`,
    retrieved_via: via, counts_as_proof: d.proof, mentions_comparator: mentionsComparator, ai_reason: null,
  };
}

/** Only sources that mention every key term count (intervention AND outcome). */
export const isRelevant = (e: EvidenceSource) => e.relevance >= 0.99 || (e.relevance >= 0.66 && e.design_weight >= 4);

/* ---------- verdict (spec §5.4) ---------- */
export function assess(
  claim: Claim, evidence: EvidenceSource[],
  opts: { retrievalComplete: boolean; queries: string[]; model?: string; aiUsed?: boolean; bottomLine?: string | null; explainer?: string | null },
): Assessment {
  let rel = evidence.filter(isRelevant);
  const headToHead = claim.comparator ? rel.filter((e) => e.mentions_comparator) : null;
  const pool = headToHead ?? rel;
  const w = (e: EvidenceSource) => e.design_weight;
  const sup = pool.filter((e) => e.stance === "supports");
  const con = pool.filter((e) => e.stance === "contradicts");
  const S = sup.reduce((s, e) => s + w(e), 0);
  const C = con.reduce((s, e) => s + w(e), 0);
  const total = S + C;
  const proof = pool.filter((e) => e.counts_as_proof);
  const proofSup = sup.filter((e) => e.counts_as_proof);
  const strongSup = proofSup.filter((e) => e.design_weight >= 4);
  const ratio = total ? S / total : 0;
  const iv = claimTerms(claim)[0]?.label ?? "this";

  const limitations: string[] = [];
  if (rel.length < 4) limitations.push(`Only ${rel.length} closely matching ${rel.length === 1 ? "study" : "studies"} found on PubMed.`);
  if (headToHead && !headToHead.length) limitations.push(`No study we found compared ${iv} with ${claim.comparator} directly, so the comparison can't be verified.`);
  const weak = rel.filter((e) => !e.counts_as_proof).length;
  if (weak) limitations.push(`${weak} of the matched papers are animal studies, case reports or opinion-style reviews. We show them but they don't count as proof.`);
  if (!rel.some((e) => e.design_weight >= 4) && rel.length) limitations.push("No meta-analyses or randomized trials among the matched studies.");
  if (S > 0 && C > 0) limitations.push("Studies disagree. We weigh study design rather than counting papers as votes.");
  if (claim.missing_qualifiers.length) limitations.push(`Your claim doesn't say ${claim.missing_qualifiers.map((q) => ({ dose: "how much", concentration: "what strength", population: "who it's for", duration: "for how long", route: "how it's used" })[q]).join(", ")}. Results often depend on that.`);
  limitations.push("Based on PubMed titles and abstracts; full papers were not read.");

  const safety: string[] = [];
  const t = claim.normalized_text.toLowerCase();
  if (claim.comparator) safety.push(`Don't swap ${claim.comparator} for an alternative without talking to a clinician. Comparisons on social media are rarely tested head to head.`);
  if (claim.domain === "supplements") safety.push("Supplements can interact with prescription medicines. A pharmacist can check your list for free.");
  if (/\b(instead of|stop taking|quit|ditch|replace)\b.*\b(medication|meds|medicine|insulin|antidepressants?|chemo|statins?|inhaler)\b/.test(t)) safety.push("Don't stop or swap prescribed treatment because of an online claim. Talk to the clinician who prescribed it.");
  if (/\bpregnan/.test(t)) safety.push("Pregnancy changes what is safe; ask your OB or midwife.");
  if (claim.claim_type === "dosage") safety.push("VetoHealth doesn't give doses. Dosing should come from a clinician or the product label.");
  if (/\b(chest pain|can'?t breathe|trouble breathing|anaphyla|suicid)/.test(t)) safety.push("If you have chest pain, trouble breathing, a severe allergic reaction or thoughts of self-harm, call 911 or 988 now.");

  let verdict: Assessment["verdict"];
  let why: string;
  let line: string;
  const over = claim.overclaim_terms.length > 0;
  if (!opts.retrievalComplete) {
    verdict = "insufficient_evidence";
    why = "We couldn't finish searching PubMed, so this report is incomplete. That is not the same as \"no evidence exists\".";
    line = "Search didn't finish — re-run in a minute before trusting this.";
  } else if (headToHead && headToHead.length === 0) {
    verdict = "insufficient_evidence";
    why = `The claim compares ${iv} with ${claim.comparator}, but none of the matched studies tested them against each other.`;
    line = `Unproven: no study we found tested ${iv} against ${claim.comparator} head to head.`;
  } else if (proof.length < 2) {
    verdict = over && C > 0 ? "misleading" : "insufficient_evidence";
    why = proof.length ? `Only ${proof.length} solid human study matched. That's too thin to judge, so we abstain.` : "We found no solid human studies (trials, cohorts or reviews of trials) that match this claim.";
    line = over ? `No good evidence for “${claim.overclaim_terms[0]}”. Big promise, no human proof.` : "Not enough human research to say either way.";
  } else if (over && !(ratio >= 0.85 && strongSup.length >= 2)) {
    verdict = "misleading";
    why = `The claim uses absolute language (“${claim.overclaim_terms.join("”, “")}”) that the evidence doesn't back. ${proofSup.length ? "Some studies show a modest effect, not a cure-all." : "None of the solid studies support it as stated."}`;
    line = proofSup.some((e) => e.design_weight >= 4) ? `Overhyped: there's a modest effect at best, not “${claim.overclaim_terms[0]}”.` : `Overhyped: the research doesn't back “${claim.overclaim_terms[0]}”.`;
  } else if (ratio >= 0.75 && strongSup.length >= 2) {
    verdict = claim.missing_qualifiers.includes("population") && claim.missing_qualifiers.includes("duration") && S < 12 ? "partially_supported" : "supported";
    why = verdict === "supported" ? "Higher-quality human studies mostly point the same way as the claim." : "The direction holds up, but studies used specific groups, doses or durations the claim leaves out.";
    line = verdict === "supported" ? `Mostly true: ${strongSup.length} high-quality studies back it up.` : `Mostly true, with fine print: it worked in specific groups and doses.`;
  } else if (ratio >= 0.55 && proofSup.length >= 1) {
    verdict = "partially_supported";
    why = "There is some supporting evidence, but it is weaker, smaller or more specific than the claim implies.";
    line = "Partly true: some human studies agree, but the effect is smaller or narrower than claimed.";
  } else if (ratio <= 0.35 && C >= 4) {
    verdict = "contradicted";
    why = "The better-designed studies we found did not find the claimed effect.";
    line = "Probably not true: the strongest studies found no real effect.";
  } else {
    verdict = "insufficient_evidence";
    why = "The evidence is mixed or weak in both directions, so we abstain.";
    line = "Studies disagree. There's no clear answer yet.";
  }

  const top = [...pool].sort((a, b) => b.design_weight - a.design_weight)[0];
  const summary = `${why} Of ${rel.length} matching PubMed ${rel.length === 1 ? "record" : "records"}: ${rel.filter((e) => e.stance === "supports").length} lean supportive, ${rel.filter((e) => e.stance === "contradicts").length} found no effect or the opposite, ${rel.filter((e) => e.stance === "neutral").length} are unclear.${top ? ` Strongest design: ${top.study_design.toLowerCase()} (${top.year}).` : ""}`;
  const agreement = total ? Math.abs(S - C) / total : 0;
  const confidence = opts.retrievalComplete ? Math.min(0.92, (total / (total + 8)) * (0.5 + agreement / 2)) : 0.05;
  const strength_label: Assessment["strength_label"] = confidence >= 0.6 ? "Strong" : confidence >= 0.4 ? "Moderate" : confidence >= 0.2 ? "Weak" : "Very weak";
  rel = rel.slice();

  return {
    claim_id: claim.claim_id, verdict, confidence_score: Math.round(confidence * 100) / 100,
    confidence_interpretation: "uncalibrated_internal_score", summary,
    bottom_line: opts.retrievalComplete && opts.bottomLine && verdict !== "insufficient_evidence" ? opts.bottomLine : line,
    plain_explainer: opts.explainer ?? null, strength_label, ai_used: !!opts.aiUsed,
    supporting_source_ids: rel.filter((e) => e.stance === "supports").map((e) => e.pmid),
    contradictory_source_ids: rel.filter((e) => e.stance === "contradicts").map((e) => e.pmid),
    neutral_source_ids: rel.filter((e) => e.stance === "neutral").map((e) => e.pmid),
    limitations, safety_notes: safety, retrieval_complete: opts.retrievalComplete,
    requires_human_review: !opts.retrievalComplete || confidence < 0.5 || (S > 0 && C > 0),
    assessment_version: 1, model_version: opts.model ?? "rules-v2", rubric_version: RUBRIC_VERSION, queries: opts.queries,
  };
}
