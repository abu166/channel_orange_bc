/**
 * Single source of truth for prices, plans, unit economics and the $100M ARR scenario.
 * Every page imports from here. All costs/volumes are labelled ASSUMPTIONS (hackathon pilot, not audited data).
 */

/* ------------------------------ pay-as-you-go services ------------------------------ */
export interface CostLine { label: string; usd: number }
export interface Service {
  id: "lab_review" | "lab_consult" | "home_skin" | "skin_followup";
  name: string; short: string; price: number; minutes: number; mode: string; who: string;
  /** Where the customer's money goes (sums to price; last line is our margin). */
  breakdown: CostLine[];
  equipment?: readonly string[];
}
export const SERVICES = {
  lab_review: { id: "lab_review", name: "Written lab review", short: "A clinician explains your results in writing within 24 h", price: 10, minutes: 0, mode: "Written, within 24 h", who: "Licensed physician or nurse practitioner",
    breakdown: [{ label: "Clinician time (≈5 min reading + writing)", usd: 5 }, { label: "Secure platform & payments", usd: 1 }, { label: "VetoHealth margin", usd: 4 }] },
  lab_consult: { id: "lab_consult", name: "Lab results video consult", short: "15-minute video call about your results", price: 20, minutes: 15, mode: "Video call", who: "Licensed physician or nurse practitioner",
    breakdown: [{ label: "Clinician time (15 min + notes)", usd: 12 }, { label: "Secure video, platform & payments", usd: 2 }, { label: "VetoHealth margin", usd: 6 }] },
  home_skin: { id: "home_skin", name: "Home skin check", short: "A clinician comes to you with pro skin-analysis equipment", price: 129, minutes: 45, mode: "At your address", who: "Board-certified dermatology clinician",
    equipment: ["Digital dermatoscope for mole mapping", "Skin-imaging camera: hydration, oil, pigmentation, wrinkles, pores", "UV camera for hidden sun damage"],
    breakdown: [{ label: "Clinician time incl. travel (≈75 min)", usd: 72 }, { label: "Travel costs", usd: 12 }, { label: "Pro equipment (≈$15k kit, shared)", usd: 9 }, { label: "Written report + doctor-picked routine", usd: 8 }, { label: "Booking, insurance & payments", usd: 8 }, { label: "VetoHealth margin", usd: 20 }] },
  skin_followup: { id: "skin_followup", name: "Skin video follow-up", short: "15-minute video check-in with your skin clinician", price: 20, minutes: 15, mode: "Video call", who: "Dermatology clinician",
    breakdown: [{ label: "Clinician time (15 min + notes)", usd: 12 }, { label: "Secure video, platform & payments", usd: 2 }, { label: "VetoHealth margin", usd: 6 }] },
} as const satisfies Record<string, Service>;
export type ServiceId = keyof typeof SERVICES;

/* ------------------------------------ memberships ------------------------------------ */
export interface Included { label: string; qty: number; unit_usd: number }
export interface Plan {
  id: "free" | "lab" | "skin" | "whole";
  name: string; monthly: number; commitment: string; tagline: string; best_for: string;
  included: Included[]; perks: string[]; hot?: boolean;
  /** Back-compat summary list for compact cards. */
  features: string[];
  /** Total paid over 12 months. */
  annual: number;
}
const plan = (p: Omit<Plan, "features" | "annual">): Plan => ({
  ...p, annual: p.monthly * 12,
  features: [...p.included.map((i) => `${i.qty === Infinity ? "Unlimited" : i.qty}× ${i.label}`), ...p.perks],
});
export const PLANS: Plan[] = [
  plan({ id: "free", name: "Free", monthly: 0, commitment: "Free forever", tagline: "Check what you see online", best_for: "Anyone scrolling health advice",
    included: [], perks: ["3 claim checks a day with real PubMed studies", "Skincare & supplement routine checker", "Upload a lab report and see each value next to the lab's range", "Pay as you go: $10 written review, $20 video consult, $129 home skin check"] }),
  plan({ id: "lab", name: "Lab Plus", monthly: 9, commitment: "Cancel anytime", tagline: "Understand every blood test, all year", best_for: "People who test 1–4× a year",
    included: [{ label: "video consults about your results", qty: 6, unit_usd: 20 }, { label: "written lab reviews", qty: 4, unit_usd: 10 }],
    perks: ["Lab history & trend charts (same lab only)", "Retest reminders", "Extra consults $12 instead of $20"] }),
  plan({ id: "skin", name: "Skin Plus", monthly: 29, commitment: "12-month plan, billed monthly", tagline: "Pro skin analysis at home, a routine picked by a doctor", best_for: "Acne, pigmentation, aging or mole worries", hot: true,
    included: [{ label: "home skin checks with pro equipment", qty: 2, unit_usd: 129 }, { label: "video follow-ups with your clinician", qty: 4, unit_usd: 20 }, { label: "monthly photo check-ins reviewed by a clinician", qty: 12, unit_usd: 10 }],
    perks: ["Doctor-selected routine, updated after every visit", "Unlimited claim checks & label scans", "Extra home visits $99 instead of $129"] }),
  plan({ id: "whole", name: "Whole Health", monthly: 34, commitment: "12-month plan, billed monthly", tagline: "Skin Plus + Lab Plus in one", best_for: "Skin and blood work in one place",
    included: [{ label: "home skin checks with pro equipment", qty: 2, unit_usd: 129 }, { label: "skin video follow-ups", qty: 4, unit_usd: 20 }, { label: "monthly photo check-ins", qty: 12, unit_usd: 10 }, { label: "lab video consults", qty: 6, unit_usd: 20 }, { label: "written lab reviews", qty: 4, unit_usd: 10 }],
    perks: ["Everything in Skin Plus and Lab Plus", "Priority booking", "$4/month less than buying both"] }),
];
/** What the included services would cost bought one by one, over 12 months. */
export const paygValue = (p: Plan) => p.included.reduce((s, i) => s + i.qty * i.unit_usd, 0);
export const yearlySavings = (p: Plan) => Math.max(0, paygValue(p) - p.annual);

/** Plain-English answer to "why is a visit $129 if the plan is $29/month?" */
export const PRICE_EXPLAINER = "$129 is one home visit, paid once. Skin Plus is $29 a month for 12 months: $348 a year for 2 home visits, 4 video follow-ups and 12 photo check-ins. Bought one by one, that is $458.";

/* --------------------------- unit economics (ASSUMPTIONS) --------------------------- */
/** Expected yearly cost to serve one member, assuming members use ~60–85% of what's included. */
export const UNIT_ECONOMICS = [
  { plan: "lab", revenue: 108, cost_to_serve: 55, note: "3 consults + 2 written reviews used on average + platform" },
  { plan: "skin", revenue: 348, cost_to_serve: 259, note: "1.7 visits, 2 follow-ups, 12 photo reviews + platform" },
  { plan: "whole", revenue: 408, cost_to_serve: 314, note: "Skin + Lab usage combined" },
] as const;
export const CAC_USD = 45; // blended, assumption: free claim checker + creator content drives organic sign-ups
export const AVG_LIFETIME_YEARS = { lab: 2, skin: 2.5, whole: 2.5 } as const; // assumption

/* ------------------------- $100M ARR scenario (ASSUMPTIONS) ------------------------- */
export const ARR_SCENARIO = [
  { line: "Skin Plus members", volume: 140_000, unit_usd: 348 },
  { line: "Lab Plus members", volume: 220_000, unit_usd: 108 },
  { line: "Whole Health members", volume: 45_000, unit_usd: 408 },
  { line: "Pay-as-you-go home skin checks", volume: 45_000, unit_usd: 129 },
  { line: "Pay-as-you-go lab video consults", volume: 160_000, unit_usd: 20 },
  { line: "Pay-as-you-go written lab reviews", volume: 100_000, unit_usd: 10 },
] as const;
export const arrTotal = () => ARR_SCENARIO.reduce((s, r) => s + r.volume * r.unit_usd, 0);

/* ----------------------------- market facts (SOURCED) ----------------------------- */
export const MARKET_FACTS = [
  { stat: "34.5 days", text: "average wait for a new-patient dermatologist appointment in 15 large US cities", source: "Merritt Hawkins survey, 2022 (via Becker's Hospital Review)", url: "https://www.beckershospitalreview.com/hospital-physician-relationships/new-patient-wait-times-for-dermatologists-in-15-major-cities.html" },
  { stat: "75%", text: "of US adults use dietary supplements", source: "CRN Consumer Survey 2026, Morning Consult, n=3,005", url: "https://www.nutritionaloutlook.com/view/crn-survey-fda-supplement-listing-higher-consumer-confidence" },
  { stat: "$150–300", text: "typical self-pay price of a dermatologist office visit (estimates vary widely)", source: "Published self-pay estimates, e.g. walk-in dermatology price guides", url: "https://walkindermatology.com/how-much-does-it-cost-to-see-a-dermatologist-without-insurance/" },
  { stat: "≈90M", text: "US adults aged 25–44, our target customers", source: "US Census Bureau population estimates (rounded)", url: "https://www.census.gov/programs-surveys/popest.html" },
] as const;

/** Pilot service area for home visits (ZIP prefixes). */
export const PILOT_AREAS: { city: string; prefixes: string[] }[] = [
  { city: "Austin, TX", prefixes: ["786", "787"] },
  { city: "New York, NY", prefixes: ["100", "101", "102", "103", "104", "112", "113", "114"] },
  { city: "Los Angeles, CA", prefixes: ["900", "901", "902", "903", "904", "905", "906", "907", "908", "910", "911", "912", "913", "914", "915", "916", "917", "918"] },
  { city: "Miami, FL", prefixes: ["330", "331", "332"] },
];
