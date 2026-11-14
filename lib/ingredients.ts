/** Educational label matching only; quantities and formulation safety are not inferred. */
export interface Ingredient { id: string; name: string; plain: string; synonyms: string[]; class: string; kind: "skincare_active" | "supplement" | "other"; reference?: string; benefitClaim?: string }
const rows: [string, string, string, string?][] = [
["retinol","Retinol","retinoid"],["retinal","Retinal","retinoid","retinaldehyde"],["retinyl_palmitate","Retinyl palmitate","retinoid"],["tretinoin","Tretinoin","retinoid","retinoic acid"],["adapalene","Adapalene","retinoid"],
["glycolic","Glycolic acid","aha","glycolic"],["lactic","Lactic acid","aha","lactic"],["mandelic","Mandelic acid","aha","mandelic"],["salicylic","Salicylic acid","bha","salicylic"],["willow","Willow bark","bha","salix alba bark extract"],["bp","Benzoyl peroxide","benzoyl_peroxide"],
["ascorbic","Ascorbic acid","vitamin_c","l-ascorbic acid"],["sap","Sodium ascorbyl phosphate","vitamin_c"],["glucoside","Ascorbyl glucoside","vitamin_c"],["thd","THD ascorbate","vitamin_c","tetrahexyldecyl ascorbate"],["niacinamide","Niacinamide","niacinamide","nicotinamide"],["azelaic","Azelaic acid","azelaic"],["hydroquinone","Hydroquinone","hydroquinone"],["kojic","Kojic acid","kojic"],["ha","Hyaluronic acid","hydrator","sodium hyaluronate"],["ceramides","Ceramides","barrier","ceramide|ceramide np|ceramide ap|ceramide eop"],["fragrance","Fragrance","other","parfum"],["alcohol","Alcohol denat","other","alcohol denat.|denatured alcohol"],["zinc_oxide","Zinc oxide","uv_filter"],["titanium","Titanium dioxide","uv_filter"],["avobenzone","Avobenzone","uv_filter"],["oxybenzone","Oxybenzone","uv_filter"],
["vitamin_a","Vitamin A","vitamin_a_supp","retinyl acetate|beta-carotene|beta carotene"],["d3","Vitamin D3","vitamin_d_supp","cholecalciferol|vitamin d"],["d2","Vitamin D2","vitamin_d_supp","ergocalciferol"],["vitamin_e","Vitamin E","vitamin_e_supp"],["vitamin_k","Vitamin K","vitamin_k_supp"],["b12","Vitamin B12","b12_supp","cobalamin|cyanocobalamin|methylcobalamin"],["folate","Folate","folate_supp","folic acid|methylfolate|5-mthf"],["biotin","Biotin","biotin_supp"],["iron","Iron","iron_supp","ferrous sulfate|ferrous bisglycinate|iron bisglycinate"],["calcium","Calcium","calcium_supp","calcium carbonate|calcium citrate"],["zinc","Zinc","zinc_supp","zinc gluconate|zinc picolinate"],["magnesium","Magnesium","magnesium_supp","magnesium glycinate|magnesium citrate|magnesium oxide"],["caffeine","Caffeine","caffeine_supp"],["guarana","Guarana","caffeine_supp"],["green_tea","Green tea extract","caffeine_supp","egcg|epigallocatechin gallate"],["melatonin","Melatonin","melatonin_supp"],["ashwagandha","Ashwagandha","herbal_supp","withania somnifera"],["turmeric","Turmeric","herbal_supp","curcumin"],["st_john","St John's wort","herbal_supp","st johns wort|st. john's wort|hypericum perforatum"],["fish_oil","Fish oil","omega3_supp","omega-3|omega 3|omega-3 fatty acids"],["collagen","Collagen peptides","collagen_supp","hydrolyzed collagen|collagen"]
];
const baseIngredients: [string, string, string, string?][] = [
["water","Water","other","aqua|eau|water/aqua/eau"],
["glycerin","Glycerin","other"],
["butylene_glycol","Butylene glycol","other"],
["propanediol","Propanediol","other"],
["dimethicone","Dimethicone","other"],
["cetearyl_alcohol","Cetearyl alcohol","other"],
["xanthan_gum","Xanthan gum","other"],
["phenoxyethanol","Phenoxyethanol","other"],
["ethylhexylglycerin","Ethylhexylglycerin","other"],
["tocopherol","Tocopherol","other"],
["squalane","Squalane","other"],
["shea_butter","Shea butter","other"],
["sodium_hydroxide","Sodium hydroxide","other"],
["citric_acid","Citric acid","other"],
["carbomer","Carbomer","other"],
["cellulose","Cellulose","other"],
["magnesium_stearate","Magnesium stearate","other"],
["gelatin","Gelatin","other"],
["microcrystalline_cellulose","Microcrystalline cellulose","other"],
["rice_flour","Rice flour","other"],
["silicon_dioxide","Silicon dioxide","other"],
];
const plainDescriptions: Record<string, string> = {
  "retinol": "Helps skin renewal; can irritate at first.",
  "retinal": "A vitamin A ingredient that helps skin renewal; can irritate.",
  "retinyl_palmitate": "A vitamin A derivative used in skin care.",
  "tretinoin": "A prescription vitamin A treatment that helps skin renewal; can irritate.",
  "adapalene": "A retinoid acne treatment that helps keep pores clear; can irritate.",
  "glycolic": "An exfoliating acid that loosens dead skin cells.",
  "lactic": "An exfoliating acid that also helps skin hold moisture.",
  "mandelic": "An exfoliating acid used to smooth skin texture.",
  "salicylic": "An exfoliating acid used to help clear oily pores.",
  "willow": "A plant extract used in skin care; not the same as salicylic acid.",
  "bp": "An acne ingredient that reduces acne-causing bacteria; can irritate.",
  "ascorbic": "Vitamin C used as an antioxidant in skin care.",
  "sap": "A vitamin C derivative used in skin care.",
  "glucoside": "A vitamin C derivative used in skin care.",
  "thd": "An oil-soluble vitamin C derivative used in skin care.",
  "niacinamide": "Helps support the skin barrier and balance oily skin.",
  "azelaic": "Used for blemishes and uneven skin tone; can sting.",
  "hydroquinone": "An ingredient used to lighten dark patches; needs professional guidance.",
  "kojic": "An ingredient used for uneven skin tone.",
  "ha": "Helps skin hold onto water.",
  "ceramides": "Fats that help support the skin barrier.",
  "fragrance": "Adds scent; can bother sensitive skin.",
  "alcohol": "Helps ingredients dissolve and formulas dry; can feel drying.",
  "zinc_oxide": "A mineral UV filter used in sunscreen.",
  "titanium": "A mineral UV filter used in sunscreen.",
  "avobenzone": "A sunscreen ingredient that absorbs UVA rays.",
  "oxybenzone": "A sunscreen ingredient that absorbs UV rays.",
  "vitamin_a": "A nutrient involved in vision and normal immune function.",
  "d3": "A form of vitamin D that helps the body absorb calcium.",
  "d2": "A form of vitamin D that helps the body absorb calcium.",
  "vitamin_e": "A nutrient that helps protect cells from oxidation.",
  "vitamin_k": "A nutrient involved in normal blood clotting.",
  "b12": "A nutrient involved in nerve function and red blood cell formation.",
  "folate": "A B vitamin involved in making DNA and new cells.",
  "biotin": "A B vitamin involved in processing food for energy; can affect some lab tests.",
  "iron": "A mineral needed to carry oxygen in the blood.",
  "calcium": "A mineral involved in bones, muscles and nerve signals.",
  "zinc": "A mineral involved in normal immune function and wound healing.",
  "magnesium": "A mineral involved in muscle and nerve function.",
  "caffeine": "A stimulant that can increase alertness and affect sleep.",
  "guarana": "A plant ingredient that can contain caffeine.",
  "green_tea": "A concentrated tea extract; caffeine content varies.",
  "melatonin": "A hormone involved in the body’s sleep timing.",
  "ashwagandha": "An herbal supplement; effects and interactions depend on the product.",
  "turmeric": "A plant supplement containing curcuminoids; formulations vary.",
  "st_john": "An herbal supplement that interacts with many medicines.",
  "fish_oil": "A source of omega-3 fats; amounts vary by product.",
  "collagen": "Protein broken into smaller pieces for use in supplements.",
  "water": "A base ingredient that dissolves other ingredients.",
  "glycerin": "Helps the formula draw moisture to skin.",
  "butylene_glycol": "Helps dissolve ingredients and hold moisture.",
  "propanediol": "Helps dissolve ingredients and hold moisture.",
  "dimethicone": "Helps skin feel smooth and reduces moisture loss.",
  "cetearyl_alcohol": "A fatty alcohol that softens skin and thickens creams.",
  "xanthan_gum": "Thickens the formula and helps keep it mixed.",
  "phenoxyethanol": "A preservative that helps prevent microbial growth.",
  "ethylhexylglycerin": "Helps preserve the formula and soften skin.",
  "tocopherol": "A form of vitamin E used to protect oils in a formula.",
  "squalane": "An oil-like ingredient that softens skin.",
  "shea_butter": "A plant fat used to soften skin and reduce moisture loss.",
  "sodium_hydroxide": "Adjusts the formula’s acidity; the finished formulation matters.",
  "citric_acid": "Often used to adjust the formula’s acidity.",
  "carbomer": "Thickens the formula into a gel.",
  "cellulose": "A plant-derived material used in capsules or as a thickener.",
  "magnesium_stearate": "Helps powders flow during tablet or capsule production.",
  "gelatin": "A protein used to make capsules and softgels.",
  "microcrystalline_cellulose": "A plant-derived filler that helps tablets hold their shape.",
  "rice_flour": "A filler used in some capsules and powders.",
  "silicon_dioxide": "Helps keep powders from clumping."
};
/** Common marketing claims to check, not established benefits or product endorsements. */
const benefitClaims: Record<string, string> = {
  "retinol": "Retinol reduces wrinkles.",
  "retinal": "Retinal reduces wrinkles.",
  "retinyl_palmitate": "Retinyl palmitate reduces wrinkles.",
  "tretinoin": "Tretinoin reduces acne.",
  "adapalene": "Adapalene reduces acne.",
  "glycolic": "Glycolic acid reduces hyperpigmentation.",
  "lactic": "Lactic acid improves skin hydration.",
  "mandelic": "Mandelic acid reduces acne.",
  "salicylic": "Salicylic acid reduces acne.",
  "willow": "Willow bark reduces acne.",
  "bp": "Benzoyl peroxide reduces acne.",
  "ascorbic": "Topical vitamin C reduces hyperpigmentation.",
  "sap": "Sodium ascorbyl phosphate reduces hyperpigmentation.",
  "glucoside": "Ascorbyl glucoside reduces hyperpigmentation.",
  "thd": "THD ascorbate reduces hyperpigmentation.",
  "niacinamide": "Niacinamide reduces hyperpigmentation.",
  "azelaic": "Azelaic acid reduces acne.",
  "hydroquinone": "Hydroquinone reduces hyperpigmentation.",
  "kojic": "Kojic acid reduces hyperpigmentation.",
  "ha": "Hyaluronic acid improves skin hydration.",
  "ceramides": "Ceramides improve skin hydration.",
  "zinc_oxide": "Zinc oxide sunscreen prevents skin cancer.",
  "titanium": "Titanium dioxide sunscreen prevents skin cancer.",
  "avobenzone": "Avobenzone sunscreen prevents skin cancer.",
  "oxybenzone": "Oxybenzone sunscreen prevents skin cancer.",
  "vitamin_a": "Vitamin A improves immunity.",
  "d3": "Vitamin D improves immunity.",
  "d2": "Vitamin D improves immunity.",
  "vitamin_e": "Vitamin E improves skin hydration.",
  "vitamin_k": "Vitamin K improves heart health.",
  "b12": "Vitamin B12 improves energy.",
  "folate": "Folate improves energy.",
  "biotin": "Biotin improves hair growth.",
  "iron": "Iron improves energy.",
  "calcium": "Calcium improves muscle strength.",
  "zinc": "Zinc reduces acne.",
  "magnesium": "Magnesium improves sleep.",
  "caffeine": "Caffeine improves energy.",
  "guarana": "Guarana improves energy.",
  "green_tea": "Green tea extract improves energy.",
  "melatonin": "Melatonin improves sleep.",
  "ashwagandha": "Ashwagandha reduces stress.",
  "turmeric": "Turmeric reduces joint pain.",
  "st_john": "St John's wort reduces depression.",
  "fish_oil": "Fish oil reduces inflammation.",
  "collagen": "Collagen supplements improve skin elasticity."
};
export const INGREDIENTS: Ingredient[] = [...rows,...baseIngredients].map(([id,name,cls,synonyms]) => ({id,name,benefitClaim:benefitClaims[id],plain:plainDescriptions[id],class:cls,synonyms:[name,...(synonyms?.split("|") ?? [])],kind:cls === "other" ? "other" : cls.endsWith("_supp") ? "supplement" : "skincare_active"}));
export const ingredientById = new Map(INGREDIENTS.map(i => [i.id,i]));
const normalize = (s: string) => s.toLowerCase().replace(/[’]/g,"'").replace(/\s+/g," ").trim();
const aliases = INGREDIENTS.flatMap(i => i.synonyms.map(s => ({alias:normalize(s), id:i.id}))).sort((a,b)=>b.alias.length-a.alias.length);
export interface ParsedIngredient { raw: string; canonicalId: string | null; concentration: string | null }
export function parseIngredientList(text: string): ParsedIngredient[] {
  return text.split(/[,\n;•]+/).map(s=>s.trim()).filter(Boolean).map(raw => {
    const quantities = raw.match(/\d+(?:\.\d+)?\s*(?:%|mcg|μg|µg|mg|g|iu)\b|\d+(?:\.\d+)?\s*%/gi);
    let clean = raw;
    for (const q of quantities ?? []) clean = clean.replace(q, " ");
    clean = normalize(clean.replace(/[()]/g," "));
    const match = aliases.find(a => clean === a.alias);
    return {raw, canonicalId:match?.id ?? null, concentration:quantities?.join("; ") ?? null};
  });
}
export interface RoutineProduct { id:string; name:string; type:"skincare"|"supplement"; timeOfDay:"am"|"pm"|"both"; ingredientsText:string; monthlyUsd?:number }
const pubmed = (q:string) => ({label:"PubMed search",url:`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(q)}`});
const ods = (name:string) => ({label:`NIH ODS: ${name}`,url:`https://ods.od.nih.gov/factsheets/${name}-Consumer/`});
const nccih = (name:string) => ({label:"NCCIH",url:`https://www.nccih.nih.gov/health/${name}`});
export function analyzeRoutine(products: RoutineProduct[]) {
  const items = products.map(product => ({product,ingredients:parseIngredientList(product.ingredientsText)}));
  const entries = items.flatMap(({product,ingredients})=>ingredients.flatMap(item=>item.canonicalId ? [{product,item,ingredient:ingredientById.get(item.canonicalId)!}] : []));
  const duplicates: {ingredient:string; productIds:string[]; productNames:string[]; explanation:string}[] = [];
  const warnings: {severity:"info"|"caution";title:string;explanation:string;products:string[];source:{label:string;url:string}}[] = [];
  const groups = new Map<string,typeof entries>();
  for (const entry of entries.filter(e=>e.ingredient.kind!=="other")) for (const key of [`id:${entry.ingredient.id}`, ...(["retinoid","aha","bha","vitamin_c"].includes(entry.ingredient.class) ? [`class:${entry.ingredient.class}`] : [])]) groups.set(key,[...(groups.get(key)??[]),entry]);
  for (const [key,group] of groups) {
    const names = [...new Set(group.map(e=>e.product.id))].map(id=>products.find(p=>p.id===id)!.name);
    if (names.length<2 || (key.startsWith("class:") && new Set(group.map(e=>e.ingredient.id)).size<2)) continue;
    duplicates.push({ingredient:key.startsWith("class:") ? group[0].ingredient.class.toUpperCase() : group[0].ingredient.name,productIds:[...new Set(group.map(e=>e.product.id))],productNames:names,explanation:"Overlapping ingredients across products. Amounts, formulation and individual tolerance are not assessed; overlap does not establish harm."});
  }
  // One card per rule; combine every affected product, including within-product matches.
  const warningProducts = new Map<string, Set<string>>();
  const add = (title:string,explanation:string,group:typeof entries,source:{label:string;url:string},severity:"info"|"caution"="caution") => {
    const ids = warningProducts.get(title) ?? new Set<string>();
    for (const entry of group) ids.add(entry.product.id);
    warningProducts.set(title,ids);
    const names = products.filter(p=>ids.has(p.id)).map(p=>p.name);
    const existing = warnings.find(w=>w.title===title);
    if (existing) existing.products=names;
    else warnings.push({title,explanation,products:names,source,severity});
  };
  for (const a of entries) for (const b of entries) {
    if (a===b || a.product.type!=="skincare" || b.product.type!=="skincare" || (a.product.timeOfDay!=="both" && b.product.timeOfDay!=="both" && a.product.timeOfDay!==b.product.timeOfDay)) continue;
    let title="", explanation="", query="";
    if (a.ingredient.class==="retinoid" && ["aha","bha"].includes(b.ingredient.class)) {title="Retinoid + exfoliating acid in the same slot"; explanation="Combining these may increase irritation. Timing and tolerance are worth discussing with a dermatologist.";query="topical retinoid alpha hydroxy acid irritation";}
    if (a.ingredient.id==="tretinoin" && b.ingredient.id==="bp") {title="Tretinoin + benzoyl peroxide";explanation="Benzoyl peroxide can degrade tretinoin in some formulations. Formulation matters; ask a pharmacist about the combination.";query="tretinoin benzoyl peroxide photodegradation formulation";}
    if (a.ingredient.class==="vitamin_c" && b.ingredient.id==="bp") {title="Vitamin C + benzoyl peroxide";explanation="Oxidation may affect vitamin C stability, particularly ascorbic acid. Derivatives and formulations differ; ask a dermatologist about compatibility.";query="ascorbic acid benzoyl peroxide oxidation";}
    if(title) add(title,explanation,[a,b],pubmed(query));
  }
  const supplements = entries.filter(e=>e.product.type==="supplement");
  const nutrientRules = [
    ["vitamin_a_supp","VitaminA","Too much preformed vitamin A can harm the liver. The upper limit applies to preformed vitamin A, not beta-carotene; chemical form matters."],
    ["vitamin_d_supp","VitaminD","Too much vitamin D can raise blood calcium and harm the kidneys. Vitamin D2 and D3 both contribute to total intake."],
    ["zinc_supp","Zinc","Too much zinc over time can reduce copper absorption and impair immune function."],
    ["iron_supp","Iron","Too much iron can cause stomach upset and, at high intakes, serious poisoning. Individual needs and medical conditions matter."]
  ];
  for (const [cls,name,explanation] of nutrientRules) {
    const group = supplements.filter(e=>e.ingredient.class===cls);
    if(new Set(group.map(e=>e.product.id)).size>1) add(`Multiple sources: ${name.replace("Vitamin","Vitamin ")}`,`${explanation} Total intake and amounts are not calculated; review labels with a pharmacist before comparing intake with the upper limit.`,group,ods(name));
  }
  const ironCalcium = supplements.filter(e=>["iron_supp","calcium_supp"].includes(e.ingredient.class));
  if(new Set(ironCalcium.map(e=>e.ingredient.class)).size===2) add("Iron + calcium","Calcium can reduce iron absorption when taken together. Timing is worth asking a pharmacist about.",ironCalcium,ods("Iron"));
  for (const id of ["biotin","st_john","green_tea","ashwagandha","turmeric","melatonin"]) {
    const group=supplements.filter(e=>e.ingredient.id===id); if(!group.length) continue;
    const notes:Record<string,[string,string,{label:string;url:string}]>={
      biotin:["Biotin and blood tests","Biotin can interfere with some lab tests. Tell your clinician before blood work.",pubmed("biotin interference immunoassay")],
      st_john:["St John's wort interactions","St John's wort interacts with many medicines. A pharmacist can review your medication list.",nccih("st-johns-wort")],
      green_tea:["Green tea extract: liver reports","Rare liver-injury reports involve concentrated green tea extracts. This does not establish your individual risk; discuss concerns with a clinician.",nccih("green-tea")],
      ashwagandha:["Ashwagandha: liver reports","Rare liver-injury reports exist. Discuss supplement use and individual risk with a clinician.",nccih("ashwagandha")],
      turmeric:["Turmeric: liver reports","Liver-injury reports exist for some turmeric supplements, particularly enhanced-bioavailability products. Discuss concerns with a clinician.",nccih("turmeric")],
      melatonin:["Melatonin context","Long-term safety information is limited; product content can vary. A clinician can help interpret sleep concerns and possible interactions.",nccih("melatonin-what-you-need-to-know")]
    }; const [title,explanation,source]=notes[id];add(title,explanation,group,source,id==="melatonin"?"info":"caution");
  }
  const caffeine=supplements.filter(e=>e.ingredient.class==="caffeine_supp");
  if(new Set(caffeine.map(e=>e.ingredient.id)).size>1 || new Set(caffeine.map(e=>e.product.id)).size>1) add("Multiple possible caffeine sources","Caffeine, guarana and green tea extracts may overlap; caffeine content varies and some extracts are decaffeinated. Amounts are not inferred.",caffeine,pubmed("caffeine guarana green tea supplements"));
  return {items,duplicates,warnings,unrecognized:items.flatMap(({product,ingredients})=>ingredients.filter(i=>!i.canonicalId).map(i=>({...i,productId:product.id,productName:product.name})))};
}

/** Known monthly spend; each product counts once across all duplicate groups. */
export function overlapSpend(products: RoutineProduct[], analysis: ReturnType<typeof analyzeRoutine>) {
  const ids = new Set(analysis.duplicates.flatMap(group => group.productIds));
  const productsInOverlaps = products.filter(product => ids.has(product.id));
  const sum = (items: RoutineProduct[]) => Math.round(items.reduce((total, product) =>
    total + (typeof product.monthlyUsd === "number" && Number.isFinite(product.monthlyUsd) && product.monthlyUsd >= 0 ? product.monthlyUsd : 0), 0) * 100) / 100;
  return { shelfMonthly: sum(products), overlapMonthly: sum(productsInOverlaps), productsInOverlaps };
}
