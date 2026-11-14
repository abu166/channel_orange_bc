import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";

// Exercise the actual page save handler without mounting Next.js or WebGL.
const source = ts.createSourceFile("page.tsx", readFileSync("app/analyze/page.tsx", "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handler = "";
function visit(node: ts.Node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === "addToShelf") handler = node.getText(source);
  ts.forEachChild(node, visit);
}
visit(source);
const js = ts.transpile(handler, { target: ts.ScriptTarget.ES2022 });
function save(saved = "[]", monthlyCost = "12.50", failWrite = false) {
  const setLabelError = vi.fn();
  const router = { push: vi.fn() };
  const localStorage = { getItem: vi.fn(() => saved), setItem: vi.fn((_key: string, _value: string) => { if (failWrite) throw new Error("quota"); }) };
  new Function("localStorage", "router", "setLabelError", "crypto", "monthlyCost", `const productName = ' Serum ', ingredientsText = ' Niacinamide ', productType = 'skincare', timeOfDay = 'pm'; ${js}; addToShelf();`)(localStorage, router, setLabelError, { randomUUID: () => "new-product" }, monthlyCost);
  return { localStorage, router, setLabelError };
}
describe("Check label save", () => {
  it("appends Shelf-compatible products before navigating", () => {
    const { localStorage, router } = save('[{"id":"existing"}]');
    expect(JSON.parse(localStorage.setItem.mock.calls[0][1] as string)).toEqual([{ id: "existing" }, { id: "new-product", name: "Serum", type: "skincare", timeOfDay: "pm", ingredientsText: "Niacinamide", monthlyUsd: 12.5 }]);
    expect(localStorage.setItem.mock.calls[0][0]).toBe("veto:routine");
    expect(router.push).toHaveBeenCalledWith("/shelf");
  });
  it("omits an optional cost", () => {
    const { localStorage } = save("[]", "");
    expect(JSON.parse(localStorage.setItem.mock.calls[0][1] as string)[0]).not.toHaveProperty("monthlyUsd");
  });
  it.each(["-1", "NaN", "10001"])("rejects invalid cost %s", cost => {
    const result = save("[]", cost);
    expect(result.localStorage.setItem).not.toHaveBeenCalled();
    expect(result.router.push).not.toHaveBeenCalled();
  });
  it.each(["bad json", "{}"])("preserves unreadable storage %s", saved => {
    const result = save(saved);
    expect(result.localStorage.setItem).not.toHaveBeenCalled();
    expect(result.router.push).not.toHaveBeenCalled();
    expect(result.setLabelError).toHaveBeenLastCalledWith(expect.stringContaining("could not be saved"));
  });
  it("stays on Check when writing fails", () => {
    const result = save("[]", "0", true);
    expect(result.router.push).not.toHaveBeenCalled();
    expect(result.setLabelError).toHaveBeenLastCalledWith(expect.stringContaining("could not be saved"));
  });
});
