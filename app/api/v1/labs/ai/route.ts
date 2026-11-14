import { aiLabExplain, aiLabExtract, labAiEnabled } from "@/lib/llm";
import { extractLabValues, redactPHI, validateAiLabValues } from "@/lib/labs";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/v1/labs/ai — opt-in AI help for lab reports (user presses a button).
 *  { mode: "extract", text }    → extra values the dictionary missed, each verified to appear verbatim in the report
 *  { mode: "explain", markers } → plain-English meaning per confirmed value + questions for a clinician
 * Identifiers are stripped before anything is sent; nothing is stored or logged.
 */
export async function POST(req: Request) {
  if (!labAiEnabled()) return Response.json({ error: "ai_unavailable", message: "AI help isn't switched on for lab results." }, { status: 503 });
  const body = await req.json().catch(() => null);
  if (body?.mode === "extract" && typeof body.text === "string" && body.text.trim().length > 20) {
    const redacted = redactPHI(body.text);
    const known = extractLabValues(redacted);
    const candidates = await aiLabExtract(redacted, known.map((k) => k.raw_line.trim().slice(0, 80)));
    if (!candidates) return Response.json({ error: "ai_unavailable", message: "The AI reader is busy. Try again in a minute." }, { status: 503 });
    return Response.json({ values: validateAiLabValues(redacted, candidates, known), proposed: candidates.length });
  }
  if (body?.mode === "explain" && Array.isArray(body.markers) && body.markers.length > 0) {
    const markers = body.markers.slice(0, 40).map((m: Record<string, unknown>) => ({
      biomarker: String(m.biomarker ?? "").slice(0, 60), value: String(m.value ?? "").slice(0, 20),
      unit: m.unit ? String(m.unit).slice(0, 20) : null, ref_text: m.ref_text ? String(m.ref_text).slice(0, 30) : null, flag: String(m.flag ?? "unknown").slice(0, 10),
    })).filter((m: { biomarker: string; value: string }) => m.biomarker && m.value);
    const out = await aiLabExplain(markers);
    if (!out) return Response.json({ error: "ai_unavailable", message: "The AI reader is busy. Try again in a minute." }, { status: 503 });
    return Response.json(out);
  }
  return Response.json({ error: "invalid_input", message: "Send a report text or confirmed values." }, { status: 400 });
}
