import { describe, expect, it } from "vitest";
import { extractClaims } from "../lib/extract";
import { analyzeRoutine, overlapSpend, INGREDIENTS, ingredientById, parseIngredientList, type RoutineProduct } from "../lib/ingredients";
const product=(id:string,ingredientsText:string,timeOfDay:RoutineProduct["timeOfDay"]="pm"):RoutineProduct=>({id,name:id,type:"skincare",timeOfDay,ingredientsText});
describe("ingredient parsing",()=>{
 it("resolves synonyms and case",()=>expect(parseIngredientList("Retinaldehyde; NICOTINAMIDE; sodium hyaluronate").map(i=>i.canonicalId)).toEqual(["retinal","niacinamide","ha"]));
 it("retains printed concentrations",()=>expect(parseIngredientList("Salicylic acid 2% • ferrous sulfate 500 mg").map(i=>i.concentration)).toEqual(["2%","500 mg"]));
 it("does not guess unknowns or partial names",()=>expect(parseIngredientList("mystery extract, zinc mystery complex").every(i=>i.canonicalId===null)).toBe(true));
});
describe("routine checks",()=>{
 it("F-09 flags duplicate actives across products",()=>expect(analyzeRoutine([product("a","retinol"),product("b","retinol")]).duplicates[0].productNames).toEqual(["a","b"]));
 it("flags class overlap",()=>expect(analyzeRoutine([product("a","retinol"),product("b","retinal")]).duplicates.some(d=>d.ingredient==="RETINOID")).toBe(true));
 it("cautions for retinoid and AHA in the same slot",()=>expect(analyzeRoutine([product("a","retinol"),product("b","glycolic acid")]).warnings.some(w=>w.title.includes("same slot"))).toBe(true));
 it("does not flag irritation for separate AM and PM slots",()=>expect(analyzeRoutine([product("a","retinol","pm"),product("b","glycolic acid","am")]).warnings).toEqual([]));
 it("both overlaps either slot, including within a product",()=>expect(analyzeRoutine([product("a","retinol, salicylic acid","both")]).warnings).toHaveLength(1));
 it("does not treat topical zinc oxide as supplemental zinc",()=>expect(analyzeRoutine([product("a","zinc oxide"),{...product("b","zinc"),type:"supplement"}]).warnings).toEqual([]));
 it("flags supplement accumulation and retains unknowns",()=>{const result=analyzeRoutine([ {...product("a","vitamin d3, biotin, unknown"),type:"supplement"},{...product("b","ergocalciferol"),type:"supplement"}]);expect(result.warnings.some(w=>w.title.includes("Multiple sources"))).toBe(true);expect(result.unrecognized[0].raw).toBe("unknown");});
});


describe("routine usability regressions",()=>{
 it("merges same-rule matches across products and within a product",()=>{
   const result=analyzeRoutine([
     product("serum","retinol, retinol"),
     product("cream","retinal, glycolic acid, lactic acid"),
     product("toner","salicylic acid")
   ]);
   expect(result.warnings).toHaveLength(1);
   expect(result.warnings[0].title).toBe("Retinoid + exfoliating acid in the same slot");
   expect(result.warnings[0].products).toEqual(["serum","cream","toner"]);
 });
 it("keeps different rules separate for the same products",()=>{
   const result=analyzeRoutine([product("a","tretinoin, vitamin c, ascorbic acid"),product("b","benzoyl peroxide")]);
   expect(result.warnings.map(w=>w.title)).toEqual(["Tretinoin + benzoyl peroxide","Vitamin C + benzoyl peroxide"]);
 });
 it("recognises common base ingredients as other without active overlaps",()=>{
   const text="water, aqua, eau, glycerin, butylene glycol, propanediol, dimethicone, cetearyl alcohol, xanthan gum, phenoxyethanol, ethylhexylglycerin, tocopherol, squalane, shea butter, sodium hydroxide, citric acid, carbomer, cellulose, magnesium stearate, gelatin, microcrystalline cellulose, rice flour, silicon dioxide";
   const parsed=parseIngredientList(text);
   expect(parsed.every(i=>i.canonicalId && ingredientById.get(i.canonicalId)?.kind==="other")).toBe(true);
   expect(parsed.slice(0,3).map(i=>i.canonicalId)).toEqual(["water","water","water"]);
   const result=analyzeRoutine([product("a",text),product("b",text)]);
   expect(result.unrecognized).toEqual([]);
   expect(result.duplicates).toEqual([]);
   expect(result.warnings).toEqual([]);
   expect(ingredientById.get("vitamin_e")?.kind).toBe("supplement");
 });
 it.each([
   ["vitamin a","Vitamin A","VitaminA","preformed vitamin A","beta-carotene"],
   ["vitamin d3","Vitamin D","VitaminD","blood calcium","D2 and D3"],
   ["zinc gluconate","Zinc","Zinc","copper absorption","immune function"],
   ["ferrous sulfate","Iron","Iron","stomach upset","poisoning"]
 ])("uses nutrient-specific context and source for %s",(ingredient,title,sheet,reason,detail)=>{
   const result=analyzeRoutine(["a","b"].map(id=>({...product(id,ingredient),type:"supplement" as const})));
   expect(result.warnings).toHaveLength(1);
   const warning=result.warnings[0];
   expect(warning.title).toBe(`Multiple sources: ${title}`);
   expect(warning.explanation).toContain(reason);
   expect(warning.explanation).toContain(detail);
   expect(warning.explanation).toContain("not calculated");
   expect(warning.source.url).toBe(`https://ods.od.nih.gov/factsheets/${sheet}-Consumer/`);
   if(sheet!=="VitaminA") expect(warning.explanation).not.toContain("beta-carotene");
 });
});

describe("plain ingredient explanations",()=>{
 it.each(INGREDIENTS)("explains $name in plain language",ingredient=>{
   expect(typeof ingredient.plain).toBe("string");
   expect(ingredient.plain.trim().length).toBeGreaterThan(15);
   expect(ingredient.plain.length).toBeLessThan(150);
 });
});


describe("overlap spending",()=>{
 it("supports legacy shelves and empty shelves",()=>{
   expect(overlapSpend([],analyzeRoutine([]))).toEqual({shelfMonthly:0,overlapMonthly:0,productsInOverlaps:[]});
   const products=[product("a","retinol"),product("b","retinol")];
   expect(overlapSpend(products,analyzeRoutine(products))).toEqual({shelfMonthly:0,overlapMonthly:0,productsInOverlaps:products});
 });
 it("counts each product once across ingredient and family groups",()=>{
   const products=[{...product("a","retinol, niacinamide"),monthlyUsd:28},{...product("b","retinal, niacinamide"),monthlyUsd:34},{...product("c","water"),monthlyUsd:18}];
   expect(overlapSpend(products,analyzeRoutine(products))).toEqual({shelfMonthly:80,overlapMonthly:62,productsInOverlaps:products.slice(0,2)});
 });
 it("uses IDs when product names match and excludes warning-only products",()=>{
   const products=[{...product("a","retinol"),name:"Serum",monthlyUsd:10},{...product("b","retinol"),monthlyUsd:20},{...product("c","glycolic acid"),name:"Serum",monthlyUsd:30}];
   expect(overlapSpend(products,analyzeRoutine(products))).toEqual({shelfMonthly:60,overlapMonthly:30,productsInOverlaps:products.slice(0,2)});
 });
 it("sums partial costs, accepts zero, rejects invalid costs and rounds cents",()=>{
   const products=[0,undefined,-5,NaN,Infinity,0.1,0.2].map((monthlyUsd,i)=>({...product(String(i),"retinol"),monthlyUsd}));
   expect(overlapSpend(products,analyzeRoutine(products))).toMatchObject({shelfMonthly:0.3,overlapMonthly:0.3});
 });
});

describe("benefit claims",()=>{
 it.each(INGREDIENTS)("assigns a checkable claim only to active $name",ingredient=>{
   if(ingredient.kind==="other") expect(ingredient.benefitClaim).toBeUndefined();
   else {
     expect(ingredient.benefitClaim).toMatch(/\b(reduces|improves|improve|prevents)\b.+\.$/);
     expect(ingredient.benefitClaim!.split(" ").length).toBeLessThanOrEqual(14);
     expect(extractClaims(ingredient.benefitClaim!).claims).toHaveLength(1);
   }
 });
 it("keeps derivatives distinct and shares identical vitamin D claims",()=>{
   expect(ingredientById.get("retinal")?.benefitClaim).not.toEqual(ingredientById.get("retinol")?.benefitClaim);
   expect(ingredientById.get("d2")?.benefitClaim).toEqual(ingredientById.get("d3")?.benefitClaim);
 });
});
