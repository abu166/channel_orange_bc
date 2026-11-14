import type { Claim, EvidenceSource, Stance } from "./types";

/**
 * Pluggable LLM layer. Works with FREE tiers: Groq (default) or Google Gemini via their OpenAI-compatible APIs,
 * plus OpenRouter or Anthropic. The LLM never decides the verdict: it (1) extracts claims from messy text and
 * (2) reads each study's conclusion. Every PMID it returns is checked against what we actually retrieved.
 */
interface Provider { name: string; kind: "openai" | "anthropic"; url: string; key: string; model: string }

function provider(): Provider | null {
  const env = process.env;
  if (env.GROQ_API_KEY) return { name: "groq", kind: "openai", url: "https://api.groq.com/openai/v1/chat/completions", key: env.GROQ_API_KEY, model: env.AI_MODEL || "auto" };
  if (env.GEMINI_API_KEY) return { name: "gemini", kind: "openai", url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", key: env.GEMINI_API_KEY, model: env.AI_MODEL || "gemini-flash-latest" };
  if (env.OPENROUTER_API_KEY) return { name: "openrouter", kind: "openai", url: "https://openrouter.ai/api/v1/chat/completions", key: env.OPENROUTER_API_KEY, model: env.AI_MODEL || "meta-llama/llama-3.3-70b-instruct:free" };
  if (env.ANTHROPIC_API_KEY) return { name: "anthropic", kind: "anthropic", url: "https://api.anthropic.com/v1/messages", key: env.ANTHROPIC_API_KEY, model: env.AI_MODEL || "claude-haiku-5-5" };
  return null;
}

export const llmEnabled = () => provider() !== null;
export const llmModel = () => { const p = provider(); return p ? `${p.name}:${p.model === "auto" ? resolvedModel ?? "auto" : p.model}` : "none"; };

/** Groq model availability differs per account and changes over time: ask which models this key can use. */
const PREFERRED = ["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "openai/gpt-oss-20b", "llama-3.1-8b-instant"];
let resolvedModel: string | null = null;
async function resolveModel(p: Provider, force = false): Promise<string> {
  if (p.model !== "auto") return p.model;
  if (resolvedModel && !force) return resolvedModel;
  const res = await fetch(p.url.replace("/chat/completions", "/models"), { headers: { authorization: `Bearer ${p.key}` }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`LLM models ${res.status}`);
  const ids: string[] = ((await res.json())?.data ?? []).map((m: { id: string }) => m.id);
  const chat = ids.filter((id) => !/whisper|guard|tts|orpheus|playai|prompt-guard|compound/i.test(id));
  resolvedModel = PREFERRED.find((m) => ids.includes(m)) ?? chat[0] ?? null;
  if (!resolvedModel) throw new Error("No chat model available for this key");
  return resolvedModel;
}

async function callOnce(p: Provider, system: string, user: string, timeoutMs: number, retried = false): Promise<string> {
  const model = await resolveModel(p);
  const res = p.kind === "anthropic"
    ? await fetch(p.url, { method: "POST", signal: AbortSignal.timeout(timeoutMs), headers: { "content-type": "application/json", "x-api-key": p.key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model, max_tokens: 1500, temperature: 0, system, messages: [{ role: "user", content: user }] }) })
    : await fetch(p.url, { method: "POST", signal: AbortSignal.timeout(timeoutMs), headers: { "content-type": "application/json", authorization: `Bearer ${p.key}` },
        body: JSON.stringify({
          model, temperature: 0, max_tokens: 2000,
          ...(model.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
          // Groq and OpenRouter support strict JSON mode; it guarantees a parseable object.
          ...(p.name === "groq" || p.name === "openrouter" ? { response_format: { type: "json_object" } } : {}),
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
        }) });
  if (!res.ok) {
    // Log status + provider message only (never the key or user content) so failures are diagnosable.
    const detail = await res.text().catch(() => "");
    const msg = detail.match(/"message"\s*:\s*"([^"]{0,200})/)?.[1] ?? "";
    console.warn(`[llm] ${p.name}:${model} HTTP ${res.status} ${msg}`);
    if (res.status === 404 && p.model === "auto" && !retried) { resolvedModel = null; await resolveModel(p, true); return callOnce(p, system, user, timeoutMs, true); }
    throw new Error(`LLM ${res.status}: ${msg}`);
  }
  const data = await res.json();
  return p.kind === "anthropic" ? data?.content?.find((c: { type: string }) => c.type === "text")?.text ?? "" : data?.choices?.[0]?.message?.content ?? "";
}

/** JSON-only call with one retry on network/parse failure. Returns null instead of guessing. */
async function chatJSON<T>(system: string, user: string, timeoutMs = 20_000): Promise<T | null> {
  const p = provider();
  if (!p) return null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await callOnce(p, system, user, timeoutMs);
      const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
      if (json) return JSON.parse(json) as T;
    } catch { /* retry once, then give up */ }
  }
  return null;
}

export interface AiClaim { verbatim: string; normalized: string; intervention: string; outcome: string; intervention_terms?: string[]; outcome_terms?: string[]; claim_type?: string }

/** Claim extraction for messy captions/transcripts. Output is validated and enriched by lib/extract.ts. */
export async function aiExtract(text: string): Promise<AiClaim[] | null> {
  const out = await chatJSON<{ claims?: AiClaim[] }>(
    "You extract checkable health claims from social-media text for a fact-checking tool. Reply with JSON only.",
    `Text:\n"""${text.slice(0, 4000)}"""\n\nReturn {"claims":[{"verbatim":"exact substring copied from the text","normalized":"one atomic claim in plain English, keeping any dose, population or duration","intervention":"1-3 word name of the thing (e.g. soda)","outcome":"1-3 word name of the effect (e.g. waist size)","intervention_terms":["2-4 synonyms scientists use in PubMed titles/MeSH, short, no quotes (e.g. sugar-sweetened beverages, soft drinks, soda)"],"outcome_terms":["2-4 PubMed synonyms (e.g. waist circumference, abdominal obesity, visceral fat)"],"claim_type":"efficacy|safety|prevention|mechanism|dosage|diagnosis"}]}.\nRules: split compound sentences into separate claims; skip questions, jokes, opinions without a factual health assertion, ads and non-health statements; search terms must be the vocabulary researchers actually use (MeSH-style), never whole phrases like "soda consumption"; at most 5 claims; empty list if none.`,
  );
  if (!out?.claims || !Array.isArray(out.claims)) return null;
  return out.claims.filter((c) => c && typeof c.normalized === "string" && typeof c.intervention === "string" && c.normalized.length > 5).slice(0, 5);
}

/** Reads retrieved conclusions only; returns stance per PMID plus plain-English copy. */
export async function refineStances(claim: Claim, evidence: EvidenceSource[]): Promise<{ stances: Map<string, Stance>; reasons: Map<string, string>; bottomLine: string | null; explainer: string | null } | null> {
  if (!evidence.length) return null;
  const sources = evidence.slice(0, 10).map((e) => `PMID ${e.pmid} [${e.study_design}, ${e.year}] ${e.title}\nConclusion: ${e.conclusion ?? "(no abstract)"}`).join("\n\n");
  const out = await chatJSON<{ stances?: { pmid: string; stance: string; why?: string }[]; bottom_line?: string; explainer?: string }>(
    "You are a careful evidence analyst explaining research to a non-scientist. Reply with JSON only. Never give medical advice or doses.",
    `Claim: "${claim.normalized_text}"\n\nSources:\n${sources}\n\nClaim type: ${claim.claim_type}${claim.comparator ? `; it compares against ${claim.comparator}` : ""}.
For each PMID: "supports" if its conclusion backs the claim AS WORDED, "contradicts" if it found no effect or the opposite, "neutral" if off-topic, mixed, a different outcome, or no abstract.
Rules: judge the exact outcome claimed (for "prevents" claims judge incidence/risk, not duration or severity); for harm claims ("X causes Y") lower risk or no association CONTRADICTS and higher risk SUPPORTS; animal, cell and narrative-review findings are "neutral" unless the claim is about them; a comparison claim needs a head-to-head study, otherwise "neutral". Add "why": max 14 plain words on what that study found (e.g. "Trial in 100 women: less wrinkling after 12 weeks").\nThen write "bottom_line": max 18 words a 30-year-old would get instantly (e.g. "Some small studies show a modest effect, but not a cure."), and "explainer": 2-3 short sentences on what the studies actually found, mentioning study types, using only these sources.\nReturn {"stances":[{"pmid":"…","stance":"…","why":"…"}],"bottom_line":"…","explainer":"…"}`,
  );
  if (!out) return null;
  const allowed = new Set(evidence.map((e) => e.pmid));
  const stances = new Map<string, Stance>();
  const reasons = new Map<string, string>();
  for (const s of out.stances ?? []) {
    if (!allowed.has(String(s.pmid)) || !["supports", "contradicts", "neutral"].includes(s.stance)) continue;
    stances.set(String(s.pmid), s.stance as Stance);
    if (typeof s.why === "string" && s.why.length < 160) reasons.set(String(s.pmid), s.why.trim());
  }
  const clean = (s: unknown, max: number) => (typeof s === "string" && s.length > 3 && s.length < max ? s.trim() : null);
  return { stances, reasons, bottomLine: clean(out.bottom_line, 200), explainer: clean(out.explainer, 700) };
}

/** Health probe for /api/v1/ai/status: one tiny JSON call, reports provider, model and the provider's error text. */
export async function aiStatus(): Promise<{ provider: string; model: string; ok: boolean; error: string | null }> {
  const p = provider();
  if (!p) return { provider: "none", model: "none", ok: false, error: "No AI key configured" };
  try {
    const text = await callOnce(p, "Reply with JSON only.", 'Return {"ok":true} as JSON.', 15_000);
    return { provider: p.name, model: resolvedModel ?? p.model, ok: /"ok"\s*:\s*true/.test(text), error: null };
  } catch (e) {
    return { provider: p.name, model: resolvedModel ?? p.model, ok: false, error: e instanceof Error ? e.message : "unknown error" };
  }
}
