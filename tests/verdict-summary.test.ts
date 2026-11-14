import { describe, expect, it } from "vitest";
import { fitsVerdict } from "../lib/assess";

describe("fitsVerdict: the AI summary never contradicts the verdict badge", () => {
  it("rejects hedged summaries under Supported", () => {
    expect(fitsVerdict("Many studies suggest collagen may modestly aid muscle-tendon health, but evidence isn't conclusive.", "supported")).toBe(false);
    expect(fitsVerdict("Results are mixed across trials.", "supported")).toBe(false);
    expect(fitsVerdict("Several good trials show better skin elasticity after 8-12 weeks.", "supported")).toBe(true);
  });
  it("requires a negative reading under Contradicted", () => {
    expect(fitsVerdict("Large trials found no benefit for colds in most people.", "contradicted")).toBe(true);
    expect(fitsVerdict("Studies show it helps a lot.", "contradicted")).toBe(false);
  });
  it("lets hedged summaries through for partial verdicts", () => {
    expect(fitsVerdict("Some small studies show a modest effect, but not a cure.", "partially_supported")).toBe(true);
  });
});
