import type { Claim, EvidenceSource, Stance } from "./types";

/**
 * Optional LLM stance checker. Only runs when ANTHROPIC_API_KEY is set. The model may ONLY label sources we
 * actually retrieved; any PMID it returns that we didn't send is discarded (no fabricated citations).
 */
export const llmEnabled = () => !!process.env.ANTHROPIC_API_KEY;
export const llmModel = () => process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";

export async function refineStances(claim: Claim, evidence: EvidenceSource[]): Promise<{ stances: Map<string, Stance>; summary: string | null } | null> {
  if (!llmEnabled() || !evidence.length) return null;
  const sources = evidence.slice(0, 10).map((e) => `PMID ${e.pmid} [${e.study_design}, ${e.year}] ${e.title}\nConclusion: ${e.conclusion ?? "(no abstract)"}`).join("\n\n");
  const prompt = `Claim: "${claim.normalized_text}"\n\nSources:\n${sources}\n\nFor each PMID decide if its conclusion SUPPORTS the claim as worded, CONTRADICTS it (finds no effect or the opposite), or is NEUTRAL (off-topic, mixed, or no abstract). Then write a 2-sentence plain-English summary for a non-expert, referencing only these sources, without medical advice or doses. Reply with JSON only: {"stances":[{"pmid":"…","stance":"supports|contradicts|neutral"}],"summary":"…"}`;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: AbortSignal.timeout(20_000),
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: llmModel(), max_tokens: 900, system: "You are a careful evidence analyst. Output strict JSON only.", messages: [{ role: "user", content: prompt }] }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data?.content?.find((c: { type: string }) => c.type === "text")?.text ?? "";
    const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    const allowed = new Set(evidence.map((e) => e.pmid));
    const stances = new Map<string, Stance>();
    for (const s of parsed?.stances ?? []) if (allowed.has(String(s.pmid)) && ["supports", "contradicts", "neutral"].includes(s.stance)) stances.set(String(s.pmid), s.stance);
    const summary = typeof parsed?.summary === "string" && parsed.summary.length < 600 ? parsed.summary : null;
    return { stances, summary };
  } catch {
    return null;
  }
}
