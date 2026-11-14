import { claimFromAi, extractClaims } from "@/lib/extract";
import { esearch, efetch, ProviderError } from "@/lib/pubmed";
import { assess, buildQueries, isRelevant, toEvidence } from "@/lib/assess";
import { aiExtract, llmEnabled, llmModel, refineStances } from "@/lib/llm";
import { RUBRIC_VERSION, SCHEMA_VERSION, type Claim, type ClaimReport, type ContentType, type EvidenceSource, type Report, type StreamEvent } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_CLAIMS = 4;
const hits = new Map<string, number[]>(); // best-effort per-instance rate limit
const TYPES: ContentType[] = ["text", "screenshot_text", "transcript", "permitted_url_metadata"];

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= 30) return Response.json({ type: "error", code: "rate_limited", message: "Too many checks in a minute. Take a breath and retry." }, { status: 429 });
  hits.set(ip, [...recent, now]);

  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.slice(0, 6000) : "";
  const content_type: ContentType = TYPES.includes(body?.content_type) ? body.content_type : "text";
  const source_url = typeof body?.source_url === "string" && /^https?:\/\//.test(body.source_url) ? body.source_url.slice(0, 500) : null;
  const fromUrl = source_url?.match(/tiktok\.com\/(@[\w.]{2,30})/i)?.[1] ?? null;
  const rawCreator = typeof body?.creator === "string" ? body.creator.trim() : "";
  const creator = /^@?[\w.]{2,30}$/.test(rawCreator) ? `@${rawCreator.replace(/^@/, "").toLowerCase()}` : fromUrl?.toLowerCase() ?? null;
  if (text.trim().length < 8) return Response.json({ type: "error", code: "invalid_input", message: "Paste at least one full sentence." }, { status: 400 });
  const ai = llmEnabled();

  const stream = new ReadableStream({
    async start(ctrl) {
      const send = (e: StreamEvent) => ctrl.enqueue(new TextEncoder().encode(JSON.stringify(e) + "\n"));
      const warnings: string[] = [];
      try {
        send({ type: "stage", stage: "extract", message: ai ? "AI is reading the post and pulling out each health claim" : "Splitting the text into separate claims" });
        const rules = extractClaims(text);
        let all: Claim[] = rules.claims;
        if (ai) {
          const aiClaims = await aiExtract(text);
          if (aiClaims?.length) all = aiClaims.map((c) => claimFromAi(text, c));
          else if (aiClaims === null) warnings.push("AI reader unavailable, so we used rule-based claim extraction.");
        }
        const claims = all.slice(0, MAX_CLAIMS);
        if (all.length > MAX_CLAIMS) warnings.push(`Found ${all.length} claims; checked the first ${MAX_CLAIMS}.`);
        send({ type: "claims", claims });

        const results: ClaimReport[] = [];
        for (const [i, claim] of claims.entries()) {
          const q = buildQueries(claim);
          let complete = true;
          const byId = new Map<string, EvidenceSource>();
          try {
            send({ type: "stage", stage: "search", message: `Searching 37M+ PubMed papers for “${claim.entities.slice(0, 2).join(" + ")}”`, claimIndex: i });
            const primary = await esearch(q.primary, 6);
            const quality = await esearch(q.quality, 5);
            const versus = q.comparator ? await esearch(q.comparator, 4) : [];
            send({ type: "stage", stage: "contradict", message: `Found ${new Set([...primary, ...quality, ...versus]).size} candidates. Now hunting for studies that found NO effect`, claimIndex: i });
            const contra = await esearch(q.contradiction, 5);
            let ids = [...new Set([...quality, ...versus, ...primary, ...contra])].slice(0, 16);
            if (ids.length === 0) {
              send({ type: "stage", stage: "search", message: "No exact matches. Widening the search with PubMed's subject headings", claimIndex: i });
              ids = (await esearch(q.broad, 10)).slice(0, 10);
            }
            for (const a of await efetch(ids)) byId.set(a.pmid, toEvidence(a, claim, contra.includes(a.pmid) && ![...primary, ...quality, ...versus].includes(a.pmid) ? "contradiction" : "primary"));
          } catch (err) {
            complete = false;
            warnings.push(err instanceof ProviderError ? `PubMed ${err.code === "rate_limited" ? "rate-limited us" : "was unavailable"} while checking claim ${i + 1}; that report is marked incomplete.` : `Evidence retrieval failed for claim ${i + 1}.`);
          }
          let evidence = [...byId.values()].filter(isRelevant).sort((a, b) => Number(b.counts_as_proof) - Number(a.counts_as_proof) || b.design_weight - a.design_weight).slice(0, 10);
          send({ type: "stage", stage: "assess", message: ai ? `AI is reading ${evidence.length} study conclusions; the rubric then weighs them by design` : `Weighing ${evidence.length} matching studies by design`, claimIndex: i });
          let refined: Awaited<ReturnType<typeof refineStances>> = null;
          if (complete && ai && evidence.length) {
            refined = await refineStances(claim, evidence);
            if (refined) evidence = evidence.map((e) => ({ ...e, stance: refined!.stances.get(e.pmid) ?? e.stance, ai_reason: refined!.reasons.get(e.pmid) ?? null }));
            else warnings.push("AI study reader unavailable, so stances come from rule-based cues.");
          }
          const assessment = assess(claim, evidence, {
            retrievalComplete: complete, queries: [q.primary, q.quality, q.contradiction, ...(q.comparator ? [q.comparator] : [])],
            model: refined ? `rules-v2+${llmModel()}` : "rules-v2", aiUsed: !!refined, bottomLine: refined?.bottomLine, explainer: refined?.explainer,
          });
          const result = { claim, evidence, assessment };
          results.push(result);
          send({ type: "claim_done", index: i, result });
        }

        const report: Report = {
          id: crypto.randomUUID(), version: 1, created_at: new Date().toISOString(),
          input: { content_type, text, source_url, language: "en", creator },
          status: claims.length === 0 ? "insufficient_input" : results.some((r) => r.assessment.requires_human_review) ? "needs_review" : "succeeded",
          claims: results,
          warnings: claims.length === 0 ? [`No checkable health claim found${rules.nonClaims.length ? ". Questions and opinions aren't assessed" : ""}. Try a statement like “X improves Y”.`, ...warnings] : warnings,
          model_metadata: { extractor: ai ? `ai:${llmModel()}` : "rules-extract-v1", assessor: ai ? `rules-v2+${llmModel()}` : "rules-v2", rubric_version: RUBRIC_VERSION, schema_version: SCHEMA_VERSION },
        };
        send({ type: "stage", stage: "done", message: "Report ready" });
        send({ type: "done", report });
      } catch {
        send({ type: "error", code: "internal", message: "Something broke on our side. Nothing was saved. Please retry." });
      } finally {
        ctrl.close();
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" } });
}
