import { describe, expect, it } from "vitest";
import { extractLabValues, redactPHI, SAMPLE_REPORT, validateAiLabValues } from "../lib/labs";
import { labSafe } from "../lib/llm";

describe("redactPHI", () => {
  it("drops identifying lines and masks contacts", () => {
    const out = redactPHI("Patient: Jane Doe\nDOB: 01/02/1990\nGlucose 108 mg/dL 65-99\nContact jane@example.com +1 512 555 0100");
    expect(out).not.toMatch(/Jane|1990|example\.com|555/);
    expect(out).toContain("Glucose 108 mg/dL 65-99");
  });
  it("drops values that sit on the line after a label, as in PDF text", () => {
    const out = redactPHI("PATIENT NAME\nJordan Testcase\nDATE OF BIRTH / AGE\n01/01/1990 · 36 y\nPATIENT ID (MRN)\nMRN-TEST-0001234\nCOLLECTED\n11/13/2026 08:05\nGlucose 108 H mg/dL 70-99\nSex Hormone Binding Globulin 45 nmol/L 24-122");
    expect(out).not.toMatch(/Jordan|1990|0001234|11\/13/);
    expect(out).toContain("Glucose 108 H mg/dL 70-99");
    expect(out).toContain("Sex Hormone Binding Globulin 45 nmol/L 24-122");
  });
});

describe("validateAiLabValues", () => {
  const text = "Ferritin 12 ng/mL 15-150\nApolipoprotein B 130 mg/dL <90\nGlucose 108 mg/dL 65-99";
  const known = extractLabValues(text);
  it("keeps values that appear verbatim and skips ones the dictionary already found", () => {
    const out = validateAiLabValues(text, [
      { biomarker: "Apolipoprotein B", value: "130", unit: "mg/dL", ref_text: "<90" },
      { biomarker: "Glucose", value: "108", unit: "mg/dL", ref_text: "65-99" },
    ], known);
    expect(out.map((v) => v.biomarker)).toEqual(["Apolipoprotein B"]);
    expect(out[0].flag).toBe("high");
    expect(out[0].issues[0]).toMatch(/Found by AI/);
  });
  it("rejects invented values or lines", () => {
    const out = validateAiLabValues(text, [
      { biomarker: "Vitamin D", value: "18", unit: "ng/mL", ref_text: "30-100" },
      { biomarker: "Apolipoprotein B", value: "13", unit: "mg/dL", ref_text: "<90" },
    ], known);
    expect(out).toEqual([]);
  });
  it("keeps every value of the synthetic sample report", () => {
    expect(extractLabValues(redactPHI(SAMPLE_REPORT))).toEqual(extractLabValues(SAMPLE_REPORT));
    expect(redactPHI("WBC 6.2 4.0-11.0\nPlatelets 250 150-400")).toBe("WBC 6.2 4.0-11.0\nPlatelets 250 150-400");
  });
});

describe("labSafe", () => {
  it("drops diagnoses, doses and instructions but keeps neutral explanations", () => {
    expect(labSafe("Marker of vitamin D status; being below the lab's range is worth discussing with a clinician.")).toBe(true);
    expect(labSafe("Could I retest in a few months?")).toBe(true);
    expect(labSafe("You have vitamin D deficiency.")).toBe(false);
    expect(labSafe("Consider 2000 IU daily.")).toBe(false);
    expect(labSafe("Should I take a supplement?")).toBe(false);
  });
});

describe("realistic report lines", () => {
  it("reads printed qualifiers and H/L flags without mislabeling other tests", () => {
    const v = extractLabValues("LDL Chol Calc (NIH) 135 H mg/dL 0-99\nC-Reactive Protein, Cardiac (hs-CRP) 3.4 H mg/L 0.0-3.0\nIron Binding Capacity 320 ug/dL 250-450");
    expect(v.map((x) => [x.biomarker, x.value, x.flag])).toEqual([["LDL", "135", "high"], ["CRP", "3.4", "high"], ["Iron", "Binding", "unknown"]]);
  });
  it("skips AI rows that repeat a line the rules already read", () => {
    const text = "Cholesterol, Total 212 H mg/dL 100-199\nMagnesium 1.5 L mg/dL 1.6-2.3";
    const out = validateAiLabValues(text, [
      { biomarker: "Cholesterol, Total", value: "212", unit: "mg/dL", ref_text: "100-199" },
      { biomarker: "Magnesium", value: "1.5", unit: "mg/dL", ref_text: "1.6-2.3" },
    ], extractLabValues(text));
    expect(out.map((x) => [x.biomarker, x.flag, x.raw_line])).toEqual([["Magnesium", "low", "Magnesium 1.5 L mg/dL 1.6-2.3"]]);
  });
});
