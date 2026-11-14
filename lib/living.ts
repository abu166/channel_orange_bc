import type { Report, Verdict } from "./types";
import type { Thread } from "./store";

/** Index-based comparison; absent claims have a null verdict. */
export function diffVersions(prev: Report, next: Report) {
  return Array.from({ length: Math.max(prev.claims.length, next.claims.length) }, (_, index) => {
    const before = prev.claims[index];
    const after = next.claims[index];
    const verdictBefore: Verdict | null = before?.assessment.verdict ?? null;
    const verdictAfter: Verdict | null = after?.assessment.verdict ?? null;
    const oldIds = new Set(before?.evidence.map(e => e.pmid) ?? []);
    const newIds = new Set(after?.evidence.map(e => e.pmid) ?? []);
    return { verdictBefore, verdictAfter, changed: verdictBefore !== verdictAfter,
      newPmids: [...newIds].filter(id => !oldIds.has(id)),
      removedPmids: [...oldIds].filter(id => !newIds.has(id)) };
  });
}

export function isStale(thread: Thread, days = 7) {
  const latest = thread.versions.at(-1);
  if (!latest) return false;
  const checkedAt = Date.parse(latest.created_at);
  return Number.isFinite(checkedAt) && Date.now() - checkedAt > days * 86_400_000;
}
