/**
 * The Ledger: everything VetoHealth keeps for a visitor, stored on this device only (no account).
 * Export / import moves it between devices; wipe deletes it (spec §8.2).
 */
export const LEDGER_KEYS = ["veto:threads:v2", "veto:savings", "veto:bookings", "veto:routine", "veto:proof", "veto:reviews", "veto:waitlist", "veto:profile"] as const;
export const LEDGER_EVENT = "veto:ledger";

export interface Profile { firstName: string; skinType: "" | "dry" | "oily" | "combination" | "sensitive" | "normal"; goals: string[] }
export const EMPTY_PROFILE: Profile = { firstName: "", skinType: "", goals: [] };

const safeGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } };
const notify = () => { if (typeof window !== "undefined") { window.dispatchEvent(new Event(LEDGER_EVENT)); window.dispatchEvent(new Event("veto:store")); window.dispatchEvent(new Event("veto:savings")); } };

export function getProfile(): Profile {
  try { return { ...EMPTY_PROFILE, ...JSON.parse(safeGet("veto:profile") ?? "{}") }; } catch { return EMPTY_PROFILE; }
}
export function saveProfile(p: Profile) { safeSet("veto:profile", JSON.stringify(p)); notify(); }

export interface LedgerFile { app: "vetohealth"; version: 1; exported_at: string; data: Record<string, unknown> }

/** Snapshot of every ledger key that has data. */
export function exportLedger(): LedgerFile {
  const data: Record<string, unknown> = {};
  for (const k of LEDGER_KEYS) {
    const raw = safeGet(k);
    if (raw) { try { data[k] = JSON.parse(raw); } catch { /* skip corrupt */ } }
  }
  return { app: "vetohealth", version: 1, exported_at: new Date().toISOString(), data };
}

/** Validates and restores a ledger file. Unknown keys are ignored; returns the keys restored. */
export function importLedger(file: unknown): string[] {
  if (!file || typeof file !== "object") throw new Error("Not a VetoHealth ledger file.");
  const f = file as Partial<LedgerFile>;
  if (f.app !== "vetohealth" || f.version !== 1 || !f.data || typeof f.data !== "object") throw new Error("Not a VetoHealth ledger file.");
  const restored: string[] = [];
  for (const k of LEDGER_KEYS) {
    if (k in f.data) { safeSet(k, JSON.stringify((f.data as Record<string, unknown>)[k])); restored.push(k); }
  }
  notify();
  return restored;
}

export function wipeLedger() {
  for (const k of LEDGER_KEYS) { try { localStorage.removeItem(k); } catch { /* storage blocked */ } }
  notify();
}

export function downloadLedger() {
  const url = URL.createObjectURL(new Blob([JSON.stringify(exportLedger(), null, 2)], { type: "application/json" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `vetohealth-ledger-${new Date().toISOString().slice(0, 10)}.json` });
  a.click();
  URL.revokeObjectURL(url);
}
