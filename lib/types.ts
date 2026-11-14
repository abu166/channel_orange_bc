/** Shared, versioned contracts (mirrors the VetoHealth spec §5.1, §5.4, §7.2). */
export const SCHEMA_VERSION = "veto.claims.v1";
export const RUBRIC_VERSION = "rubric-2026.11-a";

export type Verdict = "supported" | "partially_supported" | "insufficient_evidence" | "misleading" | "contradicted";
export type Stance = "supports" | "contradicts" | "neutral";
export type ContentType = "text" | "screenshot_text" | "transcript" | "permitted_url_metadata";

export const VERDICTS: Record<Verdict, { label: string; color: string; blurb: string }> = {
  supported: { label: "Supported", color: "var(--color-support)", blurb: "Consistent, good-quality human evidence backs the claim as stated." },
  partially_supported: { label: "Partly true", color: "var(--color-partial)", blurb: "Some evidence agrees, but with caveats: narrower population, dose or outcome than claimed." },
  insufficient_evidence: { label: "Not enough evidence", color: "var(--color-insufficient)", blurb: "We abstain. Too few relevant studies, or retrieval was incomplete." },
  misleading: { label: "Misleading", color: "var(--color-misleading)", blurb: "A kernel of truth wrapped in overclaiming language (cures, detox, guaranteed…)." },
  contradicted: { label: "Contradicted", color: "var(--color-contradict)", blurb: "The better-quality evidence points the other way." },
};

export interface Qualifiers {
  dose: string | null;
  concentration: string | null;
  population: string | null;
  duration: string | null;
  route: string | null;
}

export interface Claim {
  claim_id: string;
  verbatim_text: string;
  normalized_text: string;
  domain: "dermatology" | "nutrition" | "supplements" | "fitness" | "sleep" | "mental_health" | "general_health";
  claim_type: "efficacy" | "safety" | "prevention" | "mechanism" | "dosage" | "diagnosis";
  entities: string[];
  qualifiers: Qualifiers;
  missing_qualifiers: (keyof Qualifiers)[];
  overclaim_terms: string[];
  source_offsets: { start: number; end: number };
  is_paraphrase: boolean;
  extraction_confidence: number;
}

export interface EvidenceSource {
  pmid: string;
  doi: string | null;
  title: string;
  journal: string;
  year: string;
  url: string;
  pub_types: string[];
  study_design: string;
  design_weight: number;
  non_human: boolean;
  abstract_available: boolean;
  conclusion: string | null;
  stance: Stance;
  relevance: number;
  rationale: string;
  retrieved_via: "primary" | "contradiction";
}

export interface Assessment {
  claim_id: string;
  verdict: Verdict;
  confidence_score: number;
  confidence_interpretation: "uncalibrated_internal_score";
  summary: string;
  supporting_source_ids: string[];
  contradictory_source_ids: string[];
  neutral_source_ids: string[];
  limitations: string[];
  safety_notes: string[];
  retrieval_complete: boolean;
  requires_human_review: boolean;
  assessment_version: number;
  model_version: string;
  rubric_version: string;
  queries: string[];
}

export interface ClaimReport { claim: Claim; evidence: EvidenceSource[]; assessment: Assessment }

export interface Report {
  id: string;
  version: number;
  created_at: string;
  input: { content_type: ContentType; text: string; source_url: string | null; language: string };
  status: "succeeded" | "needs_review" | "insufficient_input" | "failed";
  claims: ClaimReport[];
  warnings: string[];
  model_metadata: { extractor: string; assessor: string; rubric_version: string; schema_version: string };
}

/** Events streamed (NDJSON) from POST /api/v1/claims/analyze */
export type StreamEvent =
  | { type: "stage"; stage: "extract" | "search" | "contradict" | "assess" | "done"; message: string; claimIndex?: number }
  | { type: "claims"; claims: Claim[] }
  | { type: "claim_done"; index: number; result: ClaimReport }
  | { type: "done"; report: Report }
  | { type: "error"; code: "invalid_input" | "rate_limited" | "provider_unavailable" | "internal"; message: string };
