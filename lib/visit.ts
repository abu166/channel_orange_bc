import { PLANS, SERVICES } from "./pricing";
import { isZip } from "./booking";

export const CONCERNS = ["Acne", "Dark spots / pigmentation", "Fine lines", "Dryness", "Oiliness", "Redness / rosacea", "Moles to check", "Sun damage"] as const;
export interface VisitAddress { line1: string; city: string; state: string; zip: string }
const STATES = new Set("AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC".split(" "));
export function validateAddress(address: VisitAddress): Partial<Record<keyof VisitAddress, string>> {
  const errors: Partial<Record<keyof VisitAddress, string>> = {};
  if (!address.line1.trim()) errors.line1 = "Enter your street address.";
  if (!address.city.trim()) errors.city = "Enter your city.";
  if (!STATES.has(address.state.trim().toUpperCase())) errors.state = "Enter a valid two-letter US state code.";
  if (!isZip(address.zip)) errors.zip = "Enter a five-digit ZIP code.";
  return errors;
}

/** Fictional measurements and clinician selections; never personalised advice. */
export const SAMPLE_SKIN_REPORT = {
  label: "Example report — synthetic data",
  metrics: [
    { name: "Hydration", score: 42, note: "Example imaging suggests lower surface moisture." },
    { name: "Oil", score: 64, note: "More surface oil appears around the nose and forehead." },
    { name: "Pigmentation", score: 38, note: "Some uneven colour appears in the example images." },
    { name: "Wrinkles", score: 26, note: "Fine lines appear around the eyes in this example." },
    { name: "Pores", score: 55, note: "Pores appear more visible across the central face." },
    { name: "Redness", score: 31, note: "Mild areas of visible redness appear in the example." },
  ],
  moleMap: "12 moles mapped, 0 flagged for follow-up",
  routine: [
    { time: "AM + PM", product: "Gentle cleanser · glycerin", why: "For this example: cleanses while supporting surface moisture." },
    { time: "AM", product: "Vitamin C serum 10–15%", why: "For this example: selected to address uneven-looking tone." },
    { time: "AM", product: "Broad-spectrum SPF 50 · zinc oxide", why: "For this example: selected for daily UV protection." },
    { time: "AM + PM", product: "Moisturiser · ceramides", why: "For this example: selected to support the skin barrier." },
    { time: "PM", product: "Retinoid · clinician chooses formulation", why: "For this example: a clinician would assess suitability for fine lines before prescribing." },
  ],
};

/** Launch charge is the first monthly payment for a plan, or one visit paid once. */
export function visitCharge(planId: string) {
  const plan = PLANS.find(p => p.id === planId && (p.id === "skin" || p.id === "whole"));
  return { price: plan ? plan.monthly : SERVICES.home_skin.price, planId: plan?.id ?? null,
    label: plan ? `${plan.name} · $${plan.monthly}/month · ${plan.commitment} ($${plan.annual} total)` : `Pay once · $${SERVICES.home_skin.price} this visit` };
}
