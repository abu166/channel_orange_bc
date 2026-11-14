/** "Money kept" ledger: spending the user decided to skip after a check. Stored on this device only. */
export interface SavingEntry {
  id: string;
  created_at: string;
  source: "claim" | "routine";
  label: string;
  monthly_usd: number;
}

const KEY = "veto:savings";
const EVENT = "veto:savings";

export function listSavings(): SavingEntry[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

function write(entries: SavingEntry[]) {
  try { localStorage.setItem(KEY, JSON.stringify(entries)); } catch { /* storage blocked */ }
  window.dispatchEvent(new Event(EVENT));
}

/** Adds or replaces the entry with the same source + label (no double counting). */
export function addSaving(e: Omit<SavingEntry, "id" | "created_at">): SavingEntry {
  const monthly = Math.max(0, Math.min(10_000, Math.round(e.monthly_usd * 100) / 100));
  const entry: SavingEntry = { ...e, monthly_usd: monthly, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  write([entry, ...listSavings().filter((x) => !(x.source === e.source && x.label === e.label))]);
  return entry;
}

export function removeSaving(id: string) { write(listSavings().filter((x) => x.id !== id)); }

export function savingsTotals(entries = listSavings()) {
  const monthly = entries.reduce((s, x) => s + x.monthly_usd, 0);
  return { monthly, yearly: monthly * 12, count: entries.length };
}

export const SAVINGS_EVENT = EVENT;
export const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 ? 2 : 0 });
