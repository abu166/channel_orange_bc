import { extractClaims } from "@/lib/extract";
import { esearch, efetch, ProviderError } from "@/lib/pubmed";
import { assess, buildQueries, toEvidence } from "@/lib/assess";
import { llmEnabled, llmModel, refineStances } from "@/lib/llm";
import { RUBRIC_VERSION, SCHEMA_VERSION, type ClaimReport, type ContentType, type EvidenceSource, type Report, type StreamEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_CLAIMS = 4;
const hits = new Map<string, number[]>(); // best-effort per-instance rate limit
const TYPES: ContentType[] = ["text", "screenshot_text", "transcript", "permitted_url_metadata"];

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= 12) return Response.json({ type: "error", code: "rate_limited", message: "Too many checks in a minute — take a breath and retry." }, { status: 429 });
  hits.set(ip, [...recent, now]);

  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.slice(0, 6000) : "";
  const content_type: ContentType = TYPES.includes(body?.content_type) ? body.content_type : "text";
  const source_url = typeof body?.source_url === "string" && /^https?:\/\//.test(body.source_url) ? body.source_url.slice(0, 500) : null;
  if (text.trim().length < 8) return Response.json({ type: "error", code: "invalid_input", message: "Paste at least one full sentence." }, { status: 400 });

  const stream = new ReadableStream({
    async start(ctrl) {
      const send = (e: StreamEvent) => ctrl.enqueue(new TextEncoder().encode(JSON.stringify(e) + "\n"));
      const warnings: string[] = [];
      try {
        send({ type: "stage", stage: "extract", message: "Splitting the text into atomic claims" });
        const { claims: all, nonClaims } = extractClaims(text);
        const claims = all.slice(0, MAX_CLAIMS);
        if (all.length > MAX_CLAIMS) warnings.push(`Found ${all.length} claims; checked the first ${MAX_CLAIMS}.`);
        if (claims.some((c) => c.extraction_confidence < 0.6)) warnings.push("Some claims were extracted with low confidence — double-check the wording.");
        send({ type: "claims", claims });

        const results: ClaimReport[] = [];
        for (const [i, claim] of claims.entries()) {
          const q = buildQueries(claim);
          let complete = true;
          const byId = new Map<string, EvidenceSource>();
          try {
            send({ type: "stage", stage: "search", message: `Searching PubMed for “${claim.entities.join(" + ")}”`, claimIndex: i });
            const [primary, quality] = [await esearch(q.primary, 6), await esearch(q.quality, 5)];
            send({ type: "stage", stage: "contradict", message: "Actively hunting for studies that found no effect", claimIndex: i });
            const contra = await esearch(q.contradiction, 5);
            const ids = [...new Set([...quality, ...primary, ...contra])].slice(0, 14);
            const arts = await efetch(ids);
            for (const a of arts) byId.set(a.pmid, toEvidence(a, claim, contra.includes(a.pmid) && !primary.includes(a.pmid) && !quality.includes(a.pmid) ? "contradiction" : "primary"));
          } catch (err) {
            complete = false;
            warnings.push(err instanceof ProviderError ? `PubMed ${err.code === "rate_limited" ? "rate-limited us" : "was unavailable"} while checking claim ${i + 1}; that report is marked incomplete.` : `Evidence retrieval failed for claim ${i + 1}.`);
          }
          send({ type: "stage", stage: "assess", message: "Weighing study designs and directions", claimIndex: i });
          let evidence = [...byId.values()].sort((a, b) => b.relevance - a.relevance || b.design_weight - a.design_weight);
          let summary: string | undefined;
          let model = "rules-v1";
          if (complete && llmEnabled()) {
            const refined = await refineStances(claim, evidence.filter((e) => e.relevance >= 0.5));
            if (refined) {
              evidence = evidence.map((e) => (refined.stances.has(e.pmid) ? { ...e, stance: refined.stances.get(e.pmid)! } : e));
              summary = refined.summary ?? undefined;
              model = `rules-v1+${llmModel()}`;
            } else warnings.push("AI stance check unavailable — used rule-based cues.");
          }
          const assessment = assess(claim, evidence, { retrievalComplete: complete, queries: [q.primary, q.quality, q.contradiction], model, summaryOverride: summary });
          const result = { claim, evidence: evidence.filter((e) => e.relevance >= 0.5).slice(0, 10), assessment };
          results.push(result);
          send({ type: "claim_done", index: i, result });
        }

        const report: Report = {
          id: crypto.randomUUID(), version: 1, created_at: new Date().toISOString(),
          input: { content_type, text, source_url, language: "en" },
          status: claims.length === 0 ? "insufficient_input" : results.some((r) => r.assessment.requires_human_review) ? "needs_review" : "succeeded",
          claims: results,
          warnings: claims.length === 0 ? [`No checkable health claim found${nonClaims.length ? " — questions and opinions aren't assessed" : ""}. Try a statement like “X improves Y”.`, ...warnings] : warnings,
          model_metadata: { extractor: "rules-extract-v1", assessor: llmEnabled() ? `rules-v1+${llmModel()}` : "rules-v1", rubric_version: RUBRIC_VERSION, schema_version: SCHEMA_VERSION },
        };
        send({ type: "stage", stage: "done", message: "Report ready" });
        send({ type: "done", report });
      } catch {
        send({ type: "error", code: "internal", message: "Something broke on our side. Nothing was saved — please retry." });
      } finally {
        ctrl.close();
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" } });
}
