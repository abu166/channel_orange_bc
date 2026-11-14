import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { gradeShelf, proofSpend, type ProofGrades } from "../lib/proof";
import { runAnalysis } from "../lib/store";
import type { RoutineProduct } from "../lib/ingredients";

vi.mock("../lib/store", () => ({ runAnalysis: vi.fn() }));
const product = (ingredientsText: string, monthlyUsd?: number, id = "a"): RoutineProduct => ({ id, name: id, ingredientsText, monthlyUsd, type: "skincare", timeOfDay: "pm" });
const grade = (verdict: ProofGrades[string]["verdict"]): ProofGrades[string] => ({ verdict, bottom_line: "Evidence checked.", studies: 2, checked_at: new Date().toISOString() });
const report = (complete = true) => ({ status: "succeeded", claims: [{ assessment: { ...grade("supported"), retrieval_complete: complete }, evidence: [{ counts_as_proof: true }, { counts_as_proof: false }] }] });

describe("proof spending", () => {
  it("handles empty, legacy, base-only and invalid costs", () => {
    expect(proofSpend([], {}).perIngredient).toEqual([]);
    const products = [product("water", 20), ...[undefined, -1, NaN, Infinity].map(n => product("retinol", n))];
    expect(proofSpend(products, {})).toMatchObject({ backedMonthly: 0, unprovenMonthly: 0, ungradedMonthly: 20 });
  });
  it("splits unique actives equally and conserves spending while checks are incomplete", () => {
    const products = [product("retinol, retinol, niacinamide, biotin, water", 30), product("retinol", 12, "b")];
    const result = proofSpend(products, { "Retinol reduces wrinkles.": grade("partially_supported"), "Biotin improves hair growth.": grade("insufficient_evidence") });
    expect(result).toMatchObject({ backedMonthly: 22, unprovenMonthly: 10, ungradedMonthly: 10 });
    expect(result.perIngredient.find(r => r.ingredient === "Retinol")).toMatchObject({ monthlyShare: 22, products: ["a", "b"] });
  });
  it.each(["supported", "partially_supported", "insufficient_evidence", "misleading", "contradicted"] as const)("buckets %s", verdict => {
    const result = proofSpend([product("retinol", 10)], { "Retinol reduces wrinkles.": grade(verdict) });
    expect(result.backedMonthly).toBe(["supported", "partially_supported"].includes(verdict) ? 10 : 0);
    expect(result.backedMonthly + result.unprovenMonthly + result.ungradedMonthly).toBe(10);
  });
  it("keeps fractional shares precise", () => {
    const result = proofSpend([product("retinol, niacinamide, biotin", 10)], {});
    expect(result.ungradedMonthly).toBeCloseTo(10);
    expect(result.perIngredient.reduce((sum, row) => sum + row.monthlyShare, 0)).toBeCloseTo(10);
  });
});

describe("live shelf grading", () => {
  let stored: Map<string, string>;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(runAnalysis).mockReset();
    stored = new Map();
    vi.stubGlobal("localStorage", { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => stored.set(key, value) });
    vi.mocked(runAnalysis).mockResolvedValue(report() as never);
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
  it("deduplicates claims, runs sequentially with a pause and caches seven days", async () => {
    const progress = vi.fn();
    const products = [product("retinol, niacinamide"), product("retinol")];
    const pending = gradeShelf(products, progress);
    await vi.advanceTimersByTimeAsync(0);
    expect(runAnalysis).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1499);
    expect(runAnalysis).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    const grades = await pending;
    expect(runAnalysis).toHaveBeenCalledTimes(2);
    expect(grades["Retinol reduces wrinkles."].studies).toBe(1);
    expect(progress.mock.lastCall?.[0]).toMatchObject({ current: 2, total: 2, grades });
    await gradeShelf(products, progress);
    expect(runAnalysis).toHaveBeenCalledTimes(2);
    vi.setSystemTime(Date.now() + 7 * 86400000);
    await gradeShelf([products[1]], progress);
    expect(runAnalysis).toHaveBeenCalledTimes(3);
  });
  it("never caches incomplete retrieval and retries it", async () => {
    vi.mocked(runAnalysis).mockResolvedValueOnce(report(false) as never);
    await expect(gradeShelf([product("retinol")], () => {})).rejects.toThrow("incomplete");
    expect(stored.has("veto:proof")).toBe(false);
    await gradeShelf([product("retinol")], () => {});
    expect(runAnalysis).toHaveBeenCalledTimes(2);
  });
  it("retains completed progress when a subsequent request fails", async () => {
    vi.mocked(runAnalysis).mockResolvedValueOnce(report() as never).mockRejectedValueOnce(new Error("Provider unavailable"));
    const progress = vi.fn();
    const pending = expect(gradeShelf([product("retinol, niacinamide")], progress)).rejects.toThrow("Provider unavailable");
    await vi.advanceTimersByTimeAsync(1500);
    await pending;
    expect(progress.mock.lastCall?.[0].grades).toHaveProperty("Retinol reduces wrinkles.");
    expect(JSON.parse(stored.get("veto:proof")!)).toHaveProperty("Retinol reduces wrinkles.");
  });
  it("ignores malformed caches and tolerates blocked storage", async () => {
    stored.set("veto:proof", JSON.stringify({ "Retinol reduces wrinkles.": { verdict: "supported" } }));
    await gradeShelf([product("retinol")], () => {});
    vi.stubGlobal("localStorage", { getItem: () => { throw Error(); }, setItem: () => { throw Error(); } });
    await expect(gradeShelf([product("retinol")], () => {})).resolves.toHaveProperty("Retinol reduces wrinkles.");
  });
});
