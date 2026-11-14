import { describe, expect, it } from "vitest";
import { assess, classifyStance, design, isRelevant } from "../lib/assess";
import { extractClaims } from "../lib/extract";
import type { EvidenceSource, Stance } from "../lib/types";
const claim=extractClaims("Collagen reduces wrinkles in adults over twelve weeks.").claims[0];
// Synthetic fixtures are never presented as fetched publications and contain no citation URL.
const evidence=(pmid:string,stance:Stance):EvidenceSource=>({pmid,doi:null,title:"Synthetic test fixture",journal:"Fixture",year:"2026",url:"",pub_types:["Randomized Controlled Trial"],study_design:"Randomized trial",design_weight:4,non_human:false,abstract_available:true,conclusion:null,stance,relevance:1,rationale:"Synthetic unit-test data",retrieved_via:"primary",counts_as_proof:true,mentions_comparator:false,ai_reason:null});
describe("assessment",()=>{
 it("classifies positive, null and uncertain cues",()=>{expect(classifyStance("Significantly improved hydration.")).toBe("supports");expect(classifyStance("No significant difference in wrinkles.")).toBe("contradicts");expect(classifyStance("Insufficient evidence.")).toBe("neutral");});
 it("F-05 abstains on retrieval failure even with supportive records",()=>{const r=assess(claim,[evidence("fixture-a","supports"),evidence("fixture-b","supports")],{retrievalComplete:false,queries:["fixture query"]});expect(r.verdict).toBe("insufficient_evidence");expect(r.retrieval_complete).toBe(false);expect(r.requires_human_review).toBe(true);});
 it("F-06 preserves both directions of conflicting evidence",()=>{const r=assess(claim,[evidence("fixture-a","supports"),evidence("fixture-b","contradicts")],{retrievalComplete:true,queries:[]});expect(r.supporting_source_ids).toEqual(["fixture-a"]);expect(r.contradictory_source_ids).toEqual(["fixture-b"]);expect(r.limitations.join(" ")).toContain("disagree");expect(r.requires_human_review).toBe(true);});
 it("abstains on a single human study for a nonabsolute claim",()=>expect(assess(claim,[evidence("fixture-a","supports")],{retrievalComplete:true,queries:[]}).verdict).toBe("insufficient_evidence"));
});


describe("evidence safeguards", () => {
 it("abstains on comparisons without comparator-mentioning evidence", () => {
  const comparison = extractClaims("Rosemary oil regrows hair as well as minoxidil.").claims[0];
  const sources = [evidence("fixture-a", "supports"), evidence("fixture-b", "supports")];
  expect(sources.every(isRelevant)).toBe(true);
  expect(assess(comparison, sources, { retrievalComplete: true, queries: [] }).verdict).toBe("insufficient_evidence");
 });
 it("reads cold prevention separately from symptom duration", () => {
  const conclusion = "The failure of vitamin C supplementation to reduce the incidence of colds in the general population indicates that routine supplementation is not justified. Vitamin C may reduce the duration of colds.";
  expect(classifyStance(conclusion, /\b(incidence|risk|prevent\w*|occurrence|develop\w*|onset)\b/i)).toBe("contradicts");
 });
 it.each([
  { pubTypes: ["Journal Article"], mesh: ["Animals"], title: "Collagen reduced wrinkles in mice", abstract: "Laboratory experiment." },
  { pubTypes: ["Review"], mesh: ["Humans"], title: "Collagen and wrinkles", abstract: "A narrative overview." },
 ])("does not treat supportive animal or narrative evidence as proof: $title", (article) => {
  const d = design(article);
  expect(d.proof).toBe(false);
  const sources = ["fixture-a", "fixture-b"].map((id) => ({ ...evidence(id, "supports"), study_design: d.label, design_weight: d.weight, non_human: d.nonHuman, counts_as_proof: d.proof }));
  const result = assess(claim, sources, { retrievalComplete: true, queries: [] });
  expect(["supported", "partially_supported"]).not.toContain(result.verdict);
  expect(result.verdict).toBe("insufficient_evidence");
 });
});
