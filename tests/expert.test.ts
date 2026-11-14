import { describe, expect, it } from "vitest";
import { appendReview, listReviews, REVIEW_KEY, saveReview, validateReview, type ReviewInput } from "../lib/expert";
const input: ReviewInput = { item_id: "claim:report:v1:claim", reviewer: "Demo reviewer", decision: "agree", rationale: "", note: "Demo note" };
function memoryStorage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
}
describe("expert demo audit trail", () => {
  it("appends without mutating earlier decisions or input", () => {
    const first = appendReview([], input, "2026-11-14T10:00:00Z");
    Object.freeze(first[0]); Object.freeze(first);
    const next = appendReview(first, { ...input, decision: "request_evidence", note: "Retrieve human studies" });
    expect(next).toHaveLength(2);
    expect(next[0]).toEqual(first[0]);
    expect(first).toHaveLength(1);
    expect(input.note).toBe("Demo note");
  });
  it("requires a valid verdict and nonblank rationale for changes", () => {
    expect(validateReview({ ...input, decision: "change", verdict: "supported", rationale: "  " })).toMatch(/reason/);
    expect(() => appendReview([], { ...input, decision: "change", rationale: "Reason" })).toThrow(/verdict/);
    expect(validateReview({ ...input, decision: "change", verdict: "contradicted", rationale: "Evidence conflicts" })).toBeNull();
  });
  it("requires reviewer identity and rejects invalid decisions", () => {
    expect(validateReview({ ...input, reviewer: " " })).toMatch(/name/);
    expect(validateReview({ ...input, decision: "invalid" as ReviewInput["decision"] })).toMatch(/valid decision/);
  });
  it("persists separate items and repeated decisions in order", () => {
    const storage = memoryStorage();
    saveReview(input, storage);
    saveReview({ ...input, item_id: "booking:1", decision: "request_evidence" }, storage);
    saveReview({ ...input, decision: "change", verdict: "misleading", rationale: "Overstated finding" }, storage);
    expect(listReviews(storage).map((e) => e.item_id)).toEqual([input.item_id, "booking:1", input.item_id]);
    expect(listReviews(storage)[0].decision).toBe("agree");
  });
  it("preserves unreadable audit data instead of overwriting it", () => {
    const storage = memoryStorage(); storage.setItem(REVIEW_KEY, "broken");
    expect(() => saveReview(input, storage)).toThrow();
    expect(storage.getItem(REVIEW_KEY)).toBe("broken");
    storage.setItem(REVIEW_KEY, "{}");
    expect(() => listReviews(storage)).toThrow(/preserved/);
  });
  it("propagates storage failures so the UI cannot claim success", () => {
    expect(() => saveReview(input, { getItem: () => null, setItem: () => { throw new Error("Storage blocked"); } })).toThrow("Storage blocked");
  });
});
