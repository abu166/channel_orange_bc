import { VERDICTS, type Verdict } from "./types";

export const REVIEW_KEY = "veto:reviews";
export type ReviewDecision = "agree" | "change" | "request_evidence";
export interface ReviewEntry {
  item_id: string;
  reviewer: string;
  decision: ReviewDecision;
  verdict?: Verdict;
  rationale: string;
  note: string;
  timestamp: string;
}
export type ReviewInput = Omit<ReviewEntry, "timestamp">;
export type ReviewStorage = Pick<Storage, "getItem" | "setItem">;

export function validateReview(input: ReviewInput): string | null {
  if (!input.item_id.trim()) return "Select a review item.";
  if (!input.reviewer.trim()) return "Enter a reviewer name for the demo audit trail.";
  if (!["agree", "change", "request_evidence"].includes(input.decision)) return "Choose a valid decision.";
  if (input.decision === "change" && (!input.verdict || !Object.hasOwn(VERDICTS, input.verdict))) return "Choose a valid verdict.";
  if (input.decision === "change" && !input.rationale.trim()) return "Explain the reason for changing the verdict.";
  return null;
}

export function appendReview(entries: readonly ReviewEntry[], input: ReviewInput, timestamp = new Date().toISOString()): ReviewEntry[] {
  const error = validateReview(input);
  if (error) throw new Error(error);
  if (!Number.isFinite(Date.parse(timestamp))) throw new Error("Invalid review timestamp.");
  return [...entries, { ...input, reviewer: input.reviewer.trim(), rationale: input.rationale.trim(), note: input.note.trim(), timestamp }];
}

export function listReviews(storage: ReviewStorage = localStorage): ReviewEntry[] {
  const raw = storage.getItem(REVIEW_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every((entry) => entry && typeof entry.item_id === "string" && typeof entry.reviewer === "string" && typeof entry.rationale === "string" && typeof entry.note === "string" && typeof entry.timestamp === "string" && Number.isFinite(Date.parse(entry.timestamp)) && !validateReview(entry))) {
    throw new Error("The saved review audit trail could not be read. Existing data has been preserved.");
  }
  return parsed;
}

export function saveReview(input: ReviewInput, storage: ReviewStorage = localStorage): ReviewEntry[] {
  const entries = appendReview(listReviews(storage), input);
  storage.setItem(REVIEW_KEY, JSON.stringify(entries));
  return entries;
}
