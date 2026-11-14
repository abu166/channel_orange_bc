import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exportLedger, getProfile, importLedger, LEDGER_KEYS, saveProfile, wipeLedger } from "../lib/ledger";

describe("device ledger", () => {
  let storage: Map<string, string>;
  beforeEach(() => {
    storage = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); },
      removeItem: (key: string) => { storage.delete(key); },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("exports, wipes and restores every ledger area without a DOM", () => {
    for (const key of LEDGER_KEYS) storage.set(key, JSON.stringify([{ id: key }]));
    saveProfile({ firstName: "Maya", skinType: "dry", goals: ["Spend less"] });
    storage.set("unrelated", "keep me");
    const snapshot = exportLedger();
    expect(snapshot.app).toBe("vetohealth");
    expect(snapshot.version).toBe(1);
    expect(Number.isNaN(Date.parse(snapshot.exported_at))).toBe(false);
    expect(Object.keys(snapshot.data)).toEqual([...LEDGER_KEYS]);
    wipeLedger();
    expect([...storage.entries()]).toEqual([["unrelated", "keep me"]]);
    expect(importLedger(JSON.parse(JSON.stringify(snapshot)))).toEqual([...LEDGER_KEYS]);
    expect(exportLedger().data).toEqual(snapshot.data);
    expect(getProfile()).toEqual({ firstName: "Maya", skinType: "dry", goals: ["Spend less"] });
    expect(storage.get("unrelated")).toBe("keep me");
  });

  it.each([null, undefined, "bad JSON", [], {}, { app: "other", version: 1, data: {} }, { app: "vetohealth", version: 2, data: {} }, { app: "vetohealth", version: 1, data: null }, { app: "vetohealth", version: 1, data: "invalid" }])("rejects invalid file %# without changing storage", file => {
    storage.set("veto:routine", "[]");
    expect(() => importLedger(file)).toThrow("Not a VetoHealth ledger file.");
    expect([...storage.entries()]).toEqual([["veto:routine", "[]"]]);
  });

  it("ignores unknown keys during import", () => {
    expect(importLedger({ app: "vetohealth", version: 1, data: { unrelated: "overwrite", "veto:routine": [] } })).toEqual(["veto:routine"]);
    expect(storage.has("unrelated")).toBe(false);
  });
});
