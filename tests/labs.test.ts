import { describe, expect, it } from "vitest";
import { extractLabValues, SAMPLE_REPORT } from "../lib/labs";
describe("printed lab extraction", () => {
  it("extracts the synthetic report and marks missing units", () => {
    const values = extractLabValues(SAMPLE_REPORT);
    expect(values).toHaveLength(12);
    expect(values.find(v => v.biomarker === "Glucose")?.flag).toBe("high");
    expect(values.find(v => v.biomarker === "Potassium")?.issues).toContain("Missing unit");
  });
  it("uses strict printed one-sided ranges", () => {
    const [v] = extractLabValues("LDL-C 100 mg/dL <100");
    expect(v.ref_text).toBe("<100"); expect(v.flag).toBe("high");
  });
  it("never infers an absent range", () => {
    expect(extractLabValues("Glucose 500 mg/dL")[0].flag).toBe("unknown");
  });
  it("preserves comma decimals and abstains", () => {
    const [v] = extractLabValues("Potassium 4,2 mmol/L 3.5-5.1");
    expect(v.value).toBe("4,2"); expect(v.flag).toBe("unknown");
    expect(v.issues).toContain("Comma decimal — verify against report");
  });
});
