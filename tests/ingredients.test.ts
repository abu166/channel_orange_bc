import { describe, expect, it } from "vitest";
import { analyzeRoutine, parseIngredientList, type RoutineProduct } from "../lib/ingredients";
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
