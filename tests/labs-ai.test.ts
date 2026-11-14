import { describe, expect, it } from "vitest";
import { extractLabValues, redactPHI, SAMPLE_REPORT, validateAiLabValues } from "../lib/labs";
import { labSafe } from "../lib/llm";

describe("redactPHI", () => {
  it("drops identifying lines and masks contacts", () => {
    const out = redactPHI("Patient: Jane Doe\nDOB: 01/02/1990\nGlucose 108 mg/dL 65-99\nContact jane@example.com +1 512 555 0100");
    expect(out).not.toMatch(/Jane|1990|example\.com|555/);
    expect(out).toContain("Glucose 108 mg/dL 65-99");
  });
});

describe("validateAiLabValues", () => {
  const text = "Ferritin 12 ng/mL 15-150\nApolipoprotein B 130 mg/dL <90\nGlucose 108 mg/dL 65-99";
  const known = extractLabValues(text);
  it("keeps values that appear verbatim and skips ones the dictionary already found", () => {
    const out = validateAiLabValues(text, [
      { biomarker: "Apolipoprotein B", value: "130", unit: "mg/dL", ref_text: "<90", line: "Apolipoprotein B 130 mg/dL <90" },
      { biomarker: "Glucose", value: "108", unit: "mg/dL", ref_text: "65-99", line: "Glucose 108 mg/dL 65-99" },
    ], known);
    expect(out.map((v) => v.biomarker)).toEqual(["Apolipoprotein B"]);
    expect(out[0].flag).toBe("high");
    expect(out[0].issues[0]).toMatch(/Found by AI/);
  });
  it("rejects invented values or lines", () => {
    const out = validateAiLabValues(text, [
      { biomarker: "Vitamin D", value: "18", unit: "ng/mL", ref_text: "30-100", line: "Vitamin D 18 ng/mL 30-100" },
      { biomarker: "Apolipoprotein B", value: "95", unit: "mg/dL", ref_text: "<90", line: "Apolipoprotein B 130 mg/dL <90" },
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
