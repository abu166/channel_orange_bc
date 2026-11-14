import { describe, expect, it } from "vitest";
import { extractClaims } from "../lib/extract";
describe("claim extraction",()=>{
 it("F-02 splits a compound sentence",()=>{const {claims}=extractClaims("Collagen reduces wrinkles and improves skin elasticity.");expect(claims).toHaveLength(2);expect(claims[1].normalized_text.toLowerCase()).toContain("collagen");});
 it("F-03 excludes questions and opinions",()=>{const r=extractClaims("Does collagen reduce wrinkles? I love collagen.");expect(r.claims).toHaveLength(0);expect(r.nonClaims).toHaveLength(2);});
 it("F-04 retains a printed dosage qualifier",()=>{const {claims}=extractClaims("Magnesium 200 mg improves sleep in adults.");expect(claims).toHaveLength(1);expect(claims[0].qualifiers.dose).toBe("200 mg");expect(claims[0].verbatim_text).toContain("200 mg");});
});
