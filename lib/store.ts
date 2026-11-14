"use client";
import type { Report } from "./types";

/** Local-first persistence (no login). Each thread keeps immutable versions so re-checks never overwrite history. */
export interface Challenge { id: string; created_at: string; claim_id: string; source_url: string; explanation: string; status: "submitted" | "in_review" }
export interface Thread { id: string; title: string; created_at: string; updated_at: string; versions: Report[]; challenges: Challenge[] }

const KEY = "veto:threads:v2"; // v2: report schema with bottom_line, evidence ladder fields
const read = (): Thread[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } };
const write = (t: Thread[]) => { try { localStorage.setItem(KEY, JSON.stringify(t.slice(0, 50))); } catch { /* storage full or blocked */ } window.dispatchEvent(new Event("veto:store")); };

export const listThreads = () => read().sort((a, b) => b.updated_at.localeCompare(a.updated_at));
export const getThread = (id: string) => read().find((t) => t.id === id) ?? null;

export function saveReport(report: Report, threadId?: string): Thread {
  const all = read();
  const normalize = (text: string) => text.trim().replace(/\s+/g, " ").toLowerCase();
  const existing = threadId
    ? all.find((t) => t.id === threadId)
    : all.find((t) => t.versions[0] && normalize(t.versions[0].input.text) === normalize(report.input.text));
  if (existing) {
    const v = { ...report, version: existing.versions.length + 1 };
    existing.versions.push(v);
    existing.updated_at = v.created_at;
    write(all);
    return existing;
  }
  const first = report.claims[0]?.claim.normalized_text ?? report.input.text.slice(0, 80);
  const t: Thread = { id: report.id, title: first, created_at: report.created_at, updated_at: report.created_at, versions: [report], challenges: [] };
  write([t, ...all]);
  return t;
}

export function addChallenge(threadId: string, c: Omit<Challenge, "id" | "created_at" | "status">) {
  const all = read();
  const t = all.find((x) => x.id === threadId);
  if (!t) return;
  t.challenges.push({ ...c, id: crypto.randomUUID(), created_at: new Date().toISOString(), status: "submitted" });
  write(all);
}

export function deleteThread(id: string) { write(read().filter((t) => t.id !== id)); }

/** Runs the streaming analysis and reports progress. */
export async function runAnalysis(
  body: { text: string; content_type: string; source_url?: string | null; creator?: string | null },
  on: (e: import("./types").StreamEvent) => void,
): Promise<Report> {
  const res = await fetch("/api/v1/claims/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ message: "The server didn't answer. Check your connection and retry." }));
    throw new Error(err.message);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let report: Report | null = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const l of lines) {
      if (!l.trim()) continue;
      const e = JSON.parse(l);
      on(e);
      if (e.type === "done") report = e.report;
      if (e.type === "error") throw new Error(e.message);
    }
  }
  if (!report) throw new Error("The analysis stopped before finishing. Please retry.");
  return report;
}
