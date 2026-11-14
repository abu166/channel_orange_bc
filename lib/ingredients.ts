/** Educational label matching only; quantities and formulation safety are not inferred. */
export interface Ingredient { id: string; name: string; synonyms: string[]; class: string; kind: "skincare_active" | "supplement" | "other"; reference?: string }
const rows: [string, string, string, string?][] = [
["retinol","Retinol","retinoid"],["retinal","Retinal","retinoid","retinaldehyde"],["retinyl_palmitate","Retinyl palmitate","retinoid"],["tretinoin","Tretinoin","retinoid","retinoic acid"],["adapalene","Adapalene","retinoid"],
["glycolic","Glycolic acid","aha","glycolic"],["lactic","Lactic acid","aha","lactic"],["mandelic","Mandelic acid","aha","mandelic"],["salicylic","Salicylic acid","bha","salicylic"],["willow","Willow bark","bha","salix alba bark extract"],["bp","Benzoyl peroxide","benzoyl_peroxide"],
["ascorbic","Ascorbic acid","vitamin_c","l-ascorbic acid"],["sap","Sodium ascorbyl phosphate","vitamin_c"],["glucoside","Ascorbyl glucoside","vitamin_c"],["thd","THD ascorbate","vitamin_c","tetrahexyldecyl ascorbate"],["niacinamide","Niacinamide","niacinamide","nicotinamide"],["azelaic","Azelaic acid","azelaic"],["hydroquinone","Hydroquinone","hydroquinone"],["kojic","Kojic acid","kojic"],["ha","Hyaluronic acid","hydrator","sodium hyaluronate"],["ceramides","Ceramides","barrier","ceramide|ceramide np|ceramide ap|ceramide eop"],["fragrance","Fragrance","other","parfum"],["alcohol","Alcohol denat","other","alcohol denat.|denatured alcohol"],["zinc_oxide","Zinc oxide","uv_filter"],["titanium","Titanium dioxide","uv_filter"],["avobenzone","Avobenzone","uv_filter"],["oxybenzone","Oxybenzone","uv_filter"],
["vitamin_a","Vitamin A","vitamin_a_supp","retinyl acetate|beta-carotene|beta carotene"],["d3","Vitamin D3","vitamin_d_supp","cholecalciferol|vitamin d"],["d2","Vitamin D2","vitamin_d_supp","ergocalciferol"],["vitamin_e","Vitamin E","vitamin_e_supp","tocopherol"],["vitamin_k","Vitamin K","vitamin_k_supp"],["b12","Vitamin B12","b12_supp","cobalamin|cyanocobalamin|methylcobalamin"],["folate","Folate","folate_supp","folic acid|methylfolate|5-mthf"],["biotin","Biotin","biotin_supp"],["iron","Iron","iron_supp","ferrous sulfate|ferrous bisglycinate|iron bisglycinate"],["calcium","Calcium","calcium_supp","calcium carbonate|calcium citrate"],["zinc","Zinc","zinc_supp","zinc gluconate|zinc picolinate"],["magnesium","Magnesium","magnesium_supp","magnesium glycinate|magnesium citrate|magnesium oxide"],["caffeine","Caffeine","caffeine_supp"],["guarana","Guarana","caffeine_supp"],["green_tea","Green tea extract","caffeine_supp","egcg|epigallocatechin gallate"],["melatonin","Melatonin","melatonin_supp"],["ashwagandha","Ashwagandha","herbal_supp","withania somnifera"],["turmeric","Turmeric","herbal_supp","curcumin"],["st_john","St John's wort","herbal_supp","st johns wort|st. john's wort|hypericum perforatum"],["fish_oil","Fish oil","omega3_supp","omega-3|omega 3|omega-3 fatty acids"],["collagen","Collagen peptides","collagen_supp","hydrolyzed collagen|collagen"]
];
export const INGREDIENTS: Ingredient[] = rows.map(([id,name,cls,synonyms], index) => ({id,name,class:cls,synonyms:[name,...(synonyms?.split("|") ?? [])],kind:index >= 27 ? "supplement" : cls === "other" ? "other" : "skincare_active"}));
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
export interface RoutineProduct { id:string; name:string; type:"skincare"|"supplement"; timeOfDay:"am"|"pm"|"both"; ingredientsText:string }
const pubmed = (q:string) => ({label:"PubMed search",url:`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(q)}`});
const ods = (name:string) => ({label:`NIH ODS: ${name}`,url:`https://ods.od.nih.gov/factsheets/${name}-Consumer/`});
const nccih = (name:string) => ({label:"NCCIH",url:`https://www.nccih.nih.gov/health/${name}`});
export function analyzeRoutine(products: RoutineProduct[]) {
  const items = products.map(product => ({product,ingredients:parseIngredientList(product.ingredientsText)}));
  const entries = items.flatMap(({product,ingredients})=>ingredients.flatMap(item=>item.canonicalId ? [{product,item,ingredient:ingredientById.get(item.canonicalId)!}] : []));
  const duplicates: {ingredient:string; productNames:string[]; explanation:string}[] = [];
  const warnings: {severity:"info"|"caution";title:string;explanation:string;products:string[];source:{label:string;url:string}}[] = [];
  const groups = new Map<string,typeof entries>();
  for (const entry of entries) for (const key of [`id:${entry.ingredient.id}`, ...(["retinoid","aha","bha","vitamin_c"].includes(entry.ingredient.class) ? [`class:${entry.ingredient.class}`] : [])]) groups.set(key,[...(groups.get(key)??[]),entry]);
  for (const [key,group] of groups) {
    const names = [...new Set(group.map(e=>e.product.id))].map(id=>products.find(p=>p.id===id)!.name);
    if (names.length<2 || (key.startsWith("class:") && new Set(group.map(e=>e.ingredient.id)).size<2)) continue;
    duplicates.push({ingredient:key.startsWith("class:") ? group[0].ingredient.class.toUpperCase() : group[0].ingredient.name,productNames:names,explanation:"Overlapping ingredients across products. Amounts, formulation and individual tolerance are not assessed; overlap does not establish harm."});
  }
  const add = (title:string,explanation:string,group:typeof entries,source:{label:string;url:string},severity:"info"|"caution"="caution") => warnings.push({title,explanation,products:[...new Set(group.map(e=>e.product.name))],source,severity});
  const pairs = new Set<string>();
  for (const a of entries) for (const b of entries) {
    if (a===b || a.product.type!=="skincare" || b.product.type!=="skincare" || (a.product.timeOfDay!=="both" && b.product.timeOfDay!=="both" && a.product.timeOfDay!==b.product.timeOfDay)) continue;
    let title="", explanation="", query="";
    if (a.ingredient.class==="retinoid" && ["aha","bha"].includes(b.ingredient.class)) {title="Retinoid + exfoliating acid in the same slot"; explanation="Combining these may increase irritation. Timing and tolerance are worth discussing with a dermatologist.";query="topical retinoid alpha hydroxy acid irritation";}
    if (a.ingredient.id==="tretinoin" && b.ingredient.id==="bp") {title="Tretinoin + benzoyl peroxide";explanation="Benzoyl peroxide can degrade tretinoin in some formulations. Formulation matters; ask a pharmacist about the combination.";query="tretinoin benzoyl peroxide photodegradation formulation";}
    if (a.ingredient.class==="vitamin_c" && b.ingredient.id==="bp") {title="Vitamin C + benzoyl peroxide";explanation="Oxidation may affect vitamin C stability, particularly ascorbic acid. Derivatives and formulations differ; ask a dermatologist about compatibility.";query="ascorbic acid benzoyl peroxide oxidation";}
    const key = [title,...[a.product.id,b.product.id].sort()].join(":");
    if(title && !pairs.has(key)) {pairs.add(key);add(title,explanation,[a,b],pubmed(query));}
  }
  const supplements = entries.filter(e=>e.product.type==="supplement");
  for (const [cls,name] of [["vitamin_a_supp","VitaminA"],["vitamin_d_supp","VitaminD"],["zinc_supp","Zinc"],["iron_supp","Iron"]]) {
    const group = supplements.filter(e=>e.ingredient.class===cls);
    if(new Set(group.map(e=>e.product.id)).size>1) add(`Multiple sources: ${name.replace("Vitamin","Vitamin ")}`,"Intake from multiple sources adds up toward the upper limit where applicable. Chemical form matters (including preformed vitamin A versus beta-carotene). Total intake and amounts are not calculated; review labels with a pharmacist.",group,ods(name));
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
