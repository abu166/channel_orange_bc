import type { Claim, Qualifiers } from "./types";

/** Health entity dictionary. `q` is the PubMed-friendly query term; `syn` are lay synonyms matched in text. */
export interface Entity { name: string; q: string; syn: string[]; kind: "intervention" | "outcome"; domain: Claim["domain"] }
const E = (name: string, kind: Entity["kind"], domain: Claim["domain"], q: string, syn: string[] = []): Entity => ({ name, kind, domain, q, syn: [name, ...syn] });

export const ENTITIES: Entity[] = [
  // interventions
  E("collagen", "intervention", "supplements", "collagen", ["collagen peptides", "collagen powder"]),
  E("vitamin c", "intervention", "supplements", "ascorbic acid OR vitamin C", ["ascorbic acid", "vit c"]),
  E("vitamin d", "intervention", "supplements", "vitamin D", ["vit d", "cholecalciferol", "vitamin d3"]),
  E("zinc", "intervention", "supplements", "zinc"),
  E("magnesium", "intervention", "supplements", "magnesium", ["magnesium glycinate"]),
  E("melatonin", "intervention", "sleep", "melatonin"),
  E("ashwagandha", "intervention", "supplements", "ashwagandha OR withania somnifera"),
  E("turmeric", "intervention", "supplements", "curcumin OR turmeric", ["curcumin"]),
  E("biotin", "intervention", "supplements", "biotin"),
  E("fish oil", "intervention", "supplements", "omega-3 OR fish oil", ["omega-3", "omega 3"]),
  E("probiotics", "intervention", "nutrition", "probiotics", ["probiotic"]),
  E("creatine", "intervention", "fitness", "creatine"),
  E("retinol", "intervention", "dermatology", "retinoid OR retinol OR tretinoin", ["retinoid", "retinoids", "tretinoin", "retin-a"]),
  E("niacinamide", "intervention", "dermatology", "niacinamide"),
  E("hyaluronic acid", "intervention", "dermatology", "hyaluronic acid"),
  E("sunscreen", "intervention", "dermatology", "sunscreen OR sunscreening agents", ["spf", "sunblock"]),
  E("rosemary oil", "intervention", "dermatology", "rosemary oil OR rosmarinus", ["rosemary"]),
  E("castor oil", "intervention", "dermatology", "castor oil"),
  E("beef tallow", "intervention", "dermatology", "tallow", ["tallow"]),
  E("red light therapy", "intervention", "dermatology", "low-level light therapy OR photobiomodulation", ["red light", "led therapy"]),
  E("microneedling", "intervention", "dermatology", "microneedling"),
  E("celery juice", "intervention", "nutrition", "celery OR apium graveolens", ["celery"]),
  E("apple cider vinegar", "intervention", "nutrition", "vinegar OR acetic acid", ["acv", "vinegar"]),
  E("lemon water", "intervention", "nutrition", "lemon OR citrus", ["lemon"]),
  E("green tea", "intervention", "nutrition", "green tea OR catechins", ["matcha", "egcg"]),
  E("coffee", "intervention", "nutrition", "coffee OR caffeine", ["caffeine", "espresso"]),
  E("sugar", "intervention", "nutrition", "dietary sugars OR sugar", ["added sugar", "sugary"]),
  E("dairy", "intervention", "nutrition", "dairy OR milk", ["milk", "cheese"]),
  E("raw milk", "intervention", "nutrition", "raw milk OR unpasteurized milk"),
  E("seed oils", "intervention", "nutrition", "vegetable oils OR linoleic acid", ["seed oil", "canola oil", "vegetable oil"]),
  E("intermittent fasting", "intervention", "nutrition", "intermittent fasting OR time-restricted eating", ["fasting"]),
  E("keto diet", "intervention", "nutrition", "ketogenic diet", ["keto", "ketogenic"]),
  E("alcohol", "intervention", "nutrition", "alcohol drinking", ["wine", "beer"]),
  E("cold plunge", "intervention", "fitness", "cold water immersion", ["ice bath", "cold shower", "cold exposure"]),
  E("sauna", "intervention", "fitness", "sauna bathing", ["saunas"]),
  E("exercise", "intervention", "fitness", "exercise", ["workout", "walking", "running", "strength training"]),
  E("aspartame", "intervention", "nutrition", "aspartame", ["diet soda", "artificial sweetener"]),
  E("fluoride", "intervention", "general_health", "fluoride"),
  E("vaccines", "intervention", "general_health", "vaccines OR vaccination", ["vaccine", "vaccination"]),
  E("blue light", "intervention", "sleep", "blue light", ["screens", "screen time"]),
  E("mouth taping", "intervention", "sleep", "mouth taping OR mouth tape", ["mouth tape"]),
  // outcomes
  E("wrinkles", "outcome", "dermatology", "skin aging OR wrinkles", ["fine lines", "skin aging", "aging skin", "anti-aging"]),
  E("skin elasticity", "outcome", "dermatology", "skin elasticity", ["elasticity", "firmness"]),
  E("skin hydration", "outcome", "dermatology", "skin hydration", ["hydration", "dry skin"]),
  E("acne", "outcome", "dermatology", "acne vulgaris", ["breakouts", "pimples", "zits"]),
  E("eczema", "outcome", "dermatology", "atopic dermatitis OR eczema", ["atopic dermatitis"]),
  E("hyperpigmentation", "outcome", "dermatology", "hyperpigmentation OR melasma", ["dark spots", "melasma", "pigmentation"]),
  E("hair loss", "outcome", "dermatology", "alopecia", ["alopecia", "balding", "thinning hair"]),
  E("hair growth", "outcome", "dermatology", "hair growth OR alopecia", ["hair regrowth", "grow hair", "thicker hair"]),
  E("skin cancer", "outcome", "dermatology", "skin neoplasms OR melanoma", ["melanoma"]),
  E("sleep", "outcome", "sleep", "sleep quality OR sleep", ["insomnia", "sleep quality", "fall asleep"]),
  E("anxiety", "outcome", "mental_health", "anxiety"),
  E("depression", "outcome", "mental_health", "depression", ["depressive"]),
  E("stress", "outcome", "mental_health", "psychological stress OR cortisol", ["cortisol"]),
  E("memory", "outcome", "mental_health", "memory OR cognition", ["focus", "brain fog", "cognition"]),
  E("immunity", "outcome", "general_health", "immune function OR immunity", ["immune system", "immune"]),
  E("common cold", "outcome", "general_health", "common cold", ["colds", "cold symptoms"]),
  E("inflammation", "outcome", "general_health", "inflammation", ["inflammatory"]),
  E("cancer", "outcome", "general_health", "neoplasms OR cancer"),
  E("heart disease", "outcome", "general_health", "cardiovascular diseases", ["heart health", "heart attack", "cardiovascular"]),
  E("blood pressure", "outcome", "general_health", "blood pressure OR hypertension", ["hypertension"]),
  E("cholesterol", "outcome", "general_health", "cholesterol"),
  E("blood sugar", "outcome", "general_health", "blood glucose OR insulin resistance", ["insulin", "glucose", "diabetes"]),
  E("gut health", "outcome", "nutrition", "gastrointestinal microbiome", ["gut", "microbiome", "bloating", "digestion"]),
  E("liver", "outcome", "general_health", "liver function", ["liver detox"]),
  E("energy", "outcome", "general_health", "fatigue", ["fatigue", "tired"]),
  E("testosterone", "outcome", "general_health", "testosterone"),
  E("muscle", "outcome", "fitness", "muscle strength OR muscle mass", ["muscle growth", "strength"]),
  E("joint pain", "outcome", "general_health", "arthralgia OR osteoarthritis", ["joints", "arthritis"]),
  E("autism", "outcome", "general_health", "autism spectrum disorder"),
  E("cavities", "outcome", "general_health", "dental caries", ["tooth decay"]),
  E("longevity", "outcome", "general_health", "mortality OR longevity", ["live longer", "lifespan"]),
];

const CLAIM_VERBS = /\b(cures?|cured|heals?|treats?|reverses?|prevents?|protects?|reduces?|lowers?|raises?|increases?|boosts?|improves?|fights?|kills?|detox(es|ifies)?|burns?|clears?|fades?|causes?|leads? to|triggers?|damages?|destroys?|ruins?|helps?|works?|fixes|repairs?|regrows?|grows?|stimulates?|strengthens?|weakens?|blocks?|is (good|bad|great|terrible|toxic|safe|dangerous) for|are (good|bad|toxic|safe|dangerous)|is linked to|are linked to|linked to|associated with|gives? you|makes? you|will (give|make|help))\b/i;
const OVERCLAIM = /\b(cures?|cured|miracle|detox(es|ify)?|toxins|guaranteed|100%|instantly|overnight|forever|completely|reverses?|melts?|flush(es)? out|secret|doctors don'?t want|never fails|always works|permanently|in (just )?\d+ days)\b/gi;
const OPINION = /^\s*(i (think|feel|believe|love|hate|like|guess)|in my opinion|imo|honestly i|personally)\b/i;
const FILLER = /\b(guys|literally|honestly|basically|like,|omg|ok so|so yeah|you know|y'all)\b/gi;
const NEGATION = /\b(doesn'?t|does not|don'?t|do not|won'?t|will not|can'?t|cannot|never|isn'?t|aren'?t|is not|are not|no evidence)\b/i;

const QUAL: Record<keyof Qualifiers, RegExp> = {
  dose: /\b\d+(?:[.,]\d+)?\s?(?:mg|mcg|µg|g|grams?|iu|ml|milligrams?|cups?|glasses?|tablespoons?|tbsp|tsp|capsules?|pills?|servings?|scoops?)\b/i,
  concentration: /\b\d+(?:\.\d+)?\s?%/,
  duration: /\b(?:\d+|a|one|two|three|four|six|eight|twelve)\s*(?:days?|weeks?|months?|years?|hours?|minutes?)\b|\b(?:every (?:day|morning|night)|daily|nightly|twice a day|once a day)\b/i,
  population: /\b(?:women|men|kids|children|adults|elderly|older adults|seniors|pregnant|athletes|teens|teenagers|babies|infants|postmenopausal|menopausal|people with [a-z]+)\b/i,
  route: /\b(?:topical(?:ly)?|oral(?:ly)?|appl(?:y|ied|ying)|drink(?:ing)?|eat(?:ing)?|tak(?:e|ing)|supplement(?:ing|s)?|cream|serum|pills?|capsules?|tea|juice|injections?|rub(?:bing)?|massage)\b/i,
};

const STOP = new Set("the a an and or but if then this that these those it its is are was were be been being to of in on for with as at by from your you my our their they them we i he she his her will can could should would just really very so too also than more most much many any some every all no not do does did have has had get gets got make makes made thing things stuff people anyone everyone way day night morning".split(" "));

export function findEntities(text: string): Entity[] {
  const lower = ` ${text.toLowerCase()} `;
  const found: Entity[] = [];
  for (const e of ENTITIES) {
    if (e.syn.some((s) => new RegExp(`[^a-z]${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^a-z]`).test(lower))) found.push(e);
  }
  // drop entities whose name is contained by another found entity's synonym (e.g. "milk" inside "raw milk")
  return found.filter((e) => !found.some((o) => o !== e && o.name.includes(e.name) && o.name !== e.name));
}

const uuid = () => (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36));

interface Segment { text: string; start: number; end: number }

/** Split into sentences with exact offsets into the original text. */
function sentences(text: string): Segment[] {
  const out: Segment[] = [];
  const re = /[^.!?\n;]+[.!?;]*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const raw = m[0];
    const lead = raw.length - raw.trimStart().length;
    const t = raw.trim();
    if (t.length > 2) out.push({ text: t, start: m.index + lead, end: m.index + lead + t.length });
  }
  return out;
}

/** Split "X reduces A and boosts B" into two segments, sharing the subject. */
function splitCompound(seg: Segment): { seg: Segment; subjectPrefix: string | null }[] {
  const verbsRe = new RegExp(CLAIM_VERBS.source, "gi");
  const hits = [...seg.text.matchAll(verbsRe)];
  if (hits.length < 2) return [{ seg, subjectPrefix: null }];
  const subject = seg.text.slice(0, hits[0].index).trim();
  const parts: { seg: Segment; subjectPrefix: string | null }[] = [];
  let cursor = 0;
  for (let i = 1; i < hits.length; i++) {
    const between = seg.text.slice(hits[i - 1].index! + hits[i - 1][0].length, hits[i].index);
    const conj = between.match(/(,\s*(and\s+)?|\s+and\s+(it\s+)?(also\s+)?|\s+plus\s+|\s+while\s+)(?=[^,]*$)/i);
    if (!conj || conj.index === undefined) continue;
    const cut = hits[i - 1].index! + hits[i - 1][0].length + conj.index;
    const left = seg.text.slice(cursor, cut).trim();
    if (left) parts.push({ seg: { text: left, start: seg.start + cursor, end: seg.start + cut }, subjectPrefix: cursor === 0 ? null : subject });
    cursor = cut + conj[0].length;
  }
  if (parts.length === 0) return [{ seg, subjectPrefix: null }];
  const rest = seg.text.slice(cursor).trim();
  if (rest) parts.push({ seg: { text: rest, start: seg.start + cursor, end: seg.end }, subjectPrefix: subject });
  return parts;
}

function clean(t: string) {
  return t.replace(/[#@][\w]+/g, "").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").replace(FILLER, "").replace(/\s+/g, " ").replace(/\s+([,.!?])/g, "$1").trim();
}

function domainOf(ents: Entity[]): Claim["domain"] {
  return (ents.find((e) => e.kind === "outcome")?.domain ?? ents[0]?.domain ?? "general_health");
}

function typeOf(t: string): Claim["claim_type"] {
  if (/\b(prevent|protect|reduce(s)? (the )?risk|lower(s)? (the )?risk)\w*/i.test(t)) return "prevention";
  if (/\b(safe|toxic|dangerous|harmful|causes? cancer|side effects?|poison)\b/i.test(t)) return "safety";
  if (/\b(works by|because it|by (increasing|blocking|boosting|stimulating))\b/i.test(t)) return "mechanism";
  if (QUAL.dose.test(t) && /\b(take|need|should|per day|a day)\b/i.test(t)) return "dosage";
  if (/\b(means you have|sign of|symptom of|diagnos)\w*/i.test(t)) return "diagnosis";
  return "efficacy";
}

export function extractClaims(input: string): { claims: Claim[]; nonClaims: string[] } {
  const claims: Claim[] = [];
  const nonClaims: string[] = [];
  let lastSubject: string | null = null;

  for (const s of sentences(input)) {
    if (s.text.trim().endsWith("?")) { nonClaims.push(s.text); continue; }
    for (const { seg, subjectPrefix } of splitCompound(s)) {
      let norm = clean(seg.text).replace(/[.!;]+$/, "");
      let paraphrase = false;
      if (subjectPrefix) { norm = `${clean(subjectPrefix)} ${norm}`; paraphrase = true; }
      // resolve a leading pronoun ("It also prevents…") using the previous claim's subject
      if (/^(it|this|they|these|that)\b/i.test(norm) && lastSubject) { norm = norm.replace(/^(it|this|they|these|that)\b/i, lastSubject); paraphrase = true; }
      norm = norm.replace(/^(and|also|plus|so|but)\s+/i, "");

      const ents = findEntities(norm);
      const hasVerb = CLAIM_VERBS.test(norm);
      if (!hasVerb || ents.length === 0 || (OPINION.test(norm) && ents.length < 2)) {
        if (norm.length > 3) nonClaims.push(seg.text);
        continue;
      }
      const verbIdx = norm.search(CLAIM_VERBS);
      if (verbIdx > 0) lastSubject = norm.slice(0, verbIdx).trim().replace(/^(and|also|so)\s+/i, "") || lastSubject;

      const qualifiers = Object.fromEntries(
        (Object.keys(QUAL) as (keyof Qualifiers)[]).map((k) => [k, norm.match(QUAL[k])?.[0] ?? null]),
      ) as unknown as Qualifiers;
      const claim_type = typeOf(norm);
      const domain = domainOf(ents);
      const missing: (keyof Qualifiers)[] = [];
      if (claim_type !== "mechanism") {
        if (!qualifiers.population) missing.push("population");
        if (!qualifiers.duration) missing.push("duration");
        if (["supplements", "nutrition"].includes(domain) && !qualifiers.dose) missing.push("dose");
        if (domain === "dermatology" && !qualifiers.concentration && ents.some((e) => e.kind === "intervention")) missing.push("concentration");
      }
      const overclaim = [...new Set((norm.match(OVERCLAIM) ?? []).map((x) => x.toLowerCase()))];
      const hasBoth = ents.some((e) => e.kind === "intervention") && ents.some((e) => e.kind === "outcome");
      const conf = Math.min(0.95, 0.45 + (hasBoth ? 0.3 : 0.1) + (ents.length >= 2 ? 0.1 : 0) - (paraphrase ? 0.1 : 0) - (OPINION.test(norm) ? 0.15 : 0));

      claims.push({
        claim_id: uuid(),
        verbatim_text: seg.text,
        normalized_text: norm.charAt(0).toUpperCase() + norm.slice(1),
        domain,
        claim_type,
        entities: ents.map((e) => e.name),
        qualifiers,
        missing_qualifiers: missing,
        overclaim_terms: overclaim,
        source_offsets: { start: seg.start, end: seg.end },
        is_paraphrase: paraphrase,
        extraction_confidence: Math.round(conf * 100) / 100,
      });
    }
  }
  return { claims, nonClaims };
}

export const isNegatedClaim = (t: string) => NEGATION.test(t);

/** Content words used as a fallback when the dictionary misses. */
export function keywords(t: string): string[] {
  return [...new Set(t.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w) && !CLAIM_VERBS.test(w)))].slice(0, 4);
}
