import { afterEach, describe, expect, it, vi } from "vitest";
import { diffVersions, isStale } from "../lib/living";
import type { Report, Verdict } from "../lib/types";
import type { Thread } from "../lib/store";

// Minimal synthetic fixtures: only fields read by these helpers.
const report = (verdict: Verdict, pmids: string[], created_at = "2026-11-01T00:00:00Z") => ({
  created_at, claims: [{ assessment: { verdict }, evidence: pmids.map(pmid => ({ pmid })) }],
}) as Report;
const thread = (versions: Report[]) => ({ versions }) as Thread;
afterEach(() => vi.useRealTimers());

describe("diffVersions", () => {
  it("compares verdicts and unique PMID additions/removals without mutations", () => {
    const before = report("partially_supported", ["synthetic-a", "synthetic-b"]);
    const after = report("contradicted", ["synthetic-b", "synthetic-c", "synthetic-c"]);
    const snapshot = JSON.stringify([before, after]);
    expect(diffVersions(before, after)).toEqual([{
      verdictBefore: "partially_supported", verdictAfter: "contradicted", changed: true,
      newPmids: ["synthetic-c"], removedPmids: ["synthetic-a"],
    }]);
    expect(JSON.stringify([before, after])).toBe(snapshot);
  });
  it("marks unchanged verdicts even when evidence changes", () => {
    expect(diffVersions(report("supported", []), report("supported", ["synthetic-a"]))[0].changed).toBe(false);
  });
  it("handles added, removed, and empty claims by index", () => {
    const empty = { ...report("supported", []), claims: [] };
    const full = report("supported", ["synthetic-a"]);
    expect(diffVersions(empty, full)[0]).toMatchObject({ verdictBefore: null, verdictAfter: "supported", changed: true });
    expect(diffVersions(full, empty)[0]).toMatchObject({ verdictAfter: null, removedPmids: ["synthetic-a"] });
    expect(diffVersions(empty, empty)).toEqual([]);
  });
});

describe("isStale", () => {
  it("uses the latest version and strictly exceeds seven days", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-08T00:00:00Z"));
    const old = report("supported", []);
    expect(isStale(thread([old]))).toBe(false);
    vi.advanceTimersByTime(1);
    expect(isStale(thread([old]))).toBe(true);
    expect(isStale(thread([old, report("supported", [], "2026-11-07T00:00:00Z")]))).toBe(false);
    expect(isStale(thread([old]), 3)).toBe(true);
  });
  it("does not recheck empty, invalid, or future dates", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-08T00:00:00Z"));
    expect(isStale(thread([]))).toBe(false);
    expect(isStale(thread([report("supported", [], "invalid")]))).toBe(false);
    expect(isStale(thread([report("supported", [], "2026-12-01T00:00:00Z")]))).toBe(false);
  });
});
