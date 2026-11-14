/** Printed report data only: no clinical reference ranges or unit conversions. */
export const BIOMARKERS = [
  ["glucose", "Glucose"], ["hba1c", "HbA1c", "Hemoglobin A1c", "A1C"],
  ["cholesterol", "Total cholesterol", "Cholesterol, Total"], ["ldl", "LDL", "LDL-C", "LDL Cholesterol Calc", "LDL Cholesterol"],
  ["hdl", "HDL", "HDL-C", "HDL Cholesterol"], ["triglycerides", "Triglycerides"], ["tsh", "TSH"],
  ["free_t4", "Free T4", "T4, Free"], ["vitamin_d", "Vitamin D 25-OH", "25-Hydroxy Vitamin D", "Vitamin D, 25-Hydroxy"],
  ["b12", "Vitamin B12", "Vitamin B-12"], ["ferritin", "Ferritin"], ["iron", "Iron", "Iron, Total"],
  ["hemoglobin", "Hemoglobin", "Hgb"], ["hematocrit", "Hematocrit", "Hct"], ["wbc", "WBC", "White Blood Cell Count"],
  ["platelets", "Platelets", "Platelet Count"], ["alt", "ALT", "ALT (SGPT)"], ["ast", "AST", "AST (SGOT)"],
  ["creatinine", "Creatinine"], ["egfr", "eGFR"], ["bun", "BUN", "Urea Nitrogen (BUN)"],
  ["sodium", "Sodium"], ["potassium", "Potassium"], ["calcium", "Calcium"], ["crp", "CRP", "C-Reactive Protein"],
] as const;
export interface LabValue {
  id: string; biomarker: string; raw_line: string; value: string; unit: string | null;
  ref_low: number | null; ref_high: number | null; ref_text: string | null;
  flag: "low" | "high" | "in_range" | "unknown"; confidence: number; issues: string[];
}
const number = "[+-]?\\d+(?:[.,]\\d+)?";
export function printedRange(text: string | null): { low: number | null; high: number | null; exclusive: boolean } {
  const pair = text?.match(new RegExp(`^(${number})\\s*[-–]\\s*(${number})$`));
  if (pair && !text?.includes(",")) return { low: Number(pair[1]), high: Number(pair[2]), exclusive: false };
  const limit = text?.match(new RegExp(`^(<=|>=|<|>|≤|≥)\\s*(${number})$`));
  if (limit && !text?.includes(",")) return { low: /[>≥]/.test(limit[1]) ? Number(limit[2]) : null, high: /[<≤]/.test(limit[1]) ? Number(limit[2]) : null, exclusive: limit[1] === "<" || limit[1] === ">" };
  return { low: null, high: null, exclusive: false };
}
export function assessLabValue(value: string, unit: string | null, ref_text: string | null) {
  const issues: string[] = [];
  if (!unit?.trim()) issues.push("Missing unit");
  if (!ref_text?.trim()) issues.push("Missing reference range");
  if (value.includes(",") || ref_text?.includes(",")) issues.push("Comma decimal — verify against report");
  const numeric = new RegExp(`^${number}$`).test(value) && !value.includes(",");
  if (!numeric) issues.push("Value not numeric");
  const range = printedRange(ref_text);
  if (ref_text && range.low === null && range.high === null) issues.push("Reference range not numeric — verify");
  if (range.low !== null && range.high !== null && range.low >= range.high) issues.push("Reference range bounds need checking");
  let flag: LabValue["flag"] = "unknown";
  if (numeric && !issues.some(i => i.includes("range bounds")) && (range.low !== null || range.high !== null)) {
    const n = Number(value);
    flag = range.low !== null && (n < range.low || (range.exclusive && n === range.low)) ? "low" : range.high !== null && (n > range.high || (range.exclusive && n === range.high)) ? "high" : "in_range";
  }
  return { ref_low: range.low, ref_high: range.high, flag, issues, confidence: Math.max(0.2, 0.98 - issues.length * 0.22) };
}
export function extractLabValues(text: string): LabValue[] {
  const aliases = BIOMARKERS.flatMap(([id, name, ...rest]) => [name, ...rest].map(alias => ({ id, name, alias }))).sort((a, b) => b.alias.length - a.alias.length);
  const out: LabValue[] = [];
  for (const raw_line of text.split(/\r?\n/)) {
    const line = raw_line.trim();
    const match = aliases.find(({ alias }) => line.toLowerCase().startsWith(alias.toLowerCase()) && /^[\s:|]/.test(line.slice(alias.length, alias.length + 1)));
    if (!match) continue;
    const tail = line.slice(match.alias.length).replace(/^[\s:|]+/, "");
    const first = tail.match(/^(<?=?|>?=?)\s*[+-]?\d+(?:[.,]\d+)?|^\S+/)?.[0];
    if (!first) continue;
    const value = first;
    const remainder = tail.slice(first.length).trim();
    const rangeMatch = remainder.match(new RegExp(`(?:${number}\\s*[-–]\\s*${number}|(?:<=|>=|<|>|≤|≥)\\s*${number})`));
    const ref_text = rangeMatch?.[0] ?? null;
    const unitText = (rangeMatch ? remainder.slice(0, rangeMatch.index) : remainder).replace(/\b(?:High|Low|H|L|Normal|Reference|Range)\b/gi, "").replace(/[|:]/g, " ").trim();
    const unit = unitText || null;
    out.push({ id: `${match.id}-${out.length}`, biomarker: match.name, raw_line, value, unit, ref_text, ...assessLabValue(value, unit, ref_text) });
  }
  return out;
}
export const SAMPLE_REPORT = `Sample Diagnostics — SYNTHETIC DEMO ONLY
Patient: Demo Patient
Glucose 108 mg/dL 65-99
Hemoglobin A1c 5.4 % 4.0-5.6
Total cholesterol 185 mg/dL 100-199
LDL Cholesterol Calc 112 mg/dL <100
HDL Cholesterol 58 mg/dL 40-90
Triglycerides 92 mg/dL 0-149
TSH 2.1 mIU/L 0.4-4.5
Vitamin D 25-OH 24 ng/mL 30-100
Hemoglobin 14.1 g/dL 12.0-16.0
Creatinine 0.9 mg/dL 0.6-1.2
Sodium 140 mmol/L 135-145
Potassium 4.2 3.5-5.1`;
