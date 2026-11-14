/** NCBI E-utilities adapter (spec §5.3). Server-side only. Retries, backoff, polite rate limiting, no fabrication. */
const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
const KEY = process.env.NCBI_API_KEY;
const GAP_MS = KEY ? 110 : 360; // NCBI: 3 req/s without key, 10 with

export class ProviderError extends Error {
  constructor(public code: "rate_limited" | "provider_unavailable", message: string) { super(message); }
}

let next = 0;
async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, next - now);
  next = Math.max(now, next) + GAP_MS;
  if (wait) await new Promise((r) => setTimeout(r, wait));
}

async function get(path: string, params: Record<string, string>, attempt = 0): Promise<Response> {
  await throttle();
  const qs = new URLSearchParams({ ...params, tool: "vetohealth", ...(KEY ? { api_key: KEY } : {}) });
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}?${qs}`, { signal: AbortSignal.timeout(12_000), cache: "no-store" });
  } catch {
    if (attempt < 2) { await new Promise((r) => setTimeout(r, 600 * 2 ** attempt)); return get(path, params, attempt + 1); }
    throw new ProviderError("provider_unavailable", "PubMed did not respond");
  }
  if (res.status === 429 || res.status >= 500) {
    if (attempt < 2) { await new Promise((r) => setTimeout(r, 800 * 2 ** attempt)); return get(path, params, attempt + 1); }
    throw new ProviderError(res.status === 429 ? "rate_limited" : "provider_unavailable", `PubMed returned ${res.status}`);
  }
  return res;
}

export async function esearch(term: string, retmax = 8): Promise<string[]> {
  const res = await get("esearch.fcgi", { db: "pubmed", term, retmax: String(retmax), retmode: "json", sort: "relevance" });
  const json = await res.json().catch(() => null);
  if (!json?.esearchresult) throw new ProviderError("provider_unavailable", "Malformed PubMed search response");
  return json.esearchresult.idlist ?? [];
}

export interface RawArticle {
  pmid: string; title: string; journal: string; year: string; doi: string | null;
  pubTypes: string[]; mesh: string[]; abstract: string; conclusion: string | null;
}

const decode = (s: string) => s
  .replace(/<[^>]+>/g, "")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

export async function efetch(ids: string[]): Promise<RawArticle[]> {
  if (!ids.length) return [];
  const res = await get("efetch.fcgi", { db: "pubmed", id: ids.join(","), retmode: "xml" });
  const xml = await res.text();
  const out: RawArticle[] = [];
  for (const block of xml.split("<PubmedArticle>").slice(1)) {
    const pick = (re: RegExp) => decode(block.match(re)?.[1] ?? "");
    const pmid = pick(/<PMID[^>]*>(\d+)<\/PMID>/);
    if (!pmid) continue;
    const parts = [...block.matchAll(/<AbstractText([^>]*)>([\s\S]*?)<\/AbstractText>/g)].map((m) => ({
      label: (m[1].match(/Label="([^"]+)"/)?.[1] ?? "").toUpperCase(), text: decode(m[2]),
    }));
    const concl = parts.find((p) => /CONCLUSION|INTERPRETATION|IMPLICATION/.test(p.label))?.text ?? null;
    const abstract = parts.map((p) => p.text).join(" ");
    out.push({
      pmid,
      title: pick(/<ArticleTitle[^>]*>([\s\S]*?)<\/ArticleTitle>/),
      journal: pick(/<ISOAbbreviation>([\s\S]*?)<\/ISOAbbreviation>/) || pick(/<Title>([\s\S]*?)<\/Title>/),
      year: pick(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/) || pick(/<MedlineDate>(\d{4})/) || "n.d.",
      doi: pick(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/) || null,
      pubTypes: [...block.matchAll(/<PublicationType[^>]*>([^<]+)<\/PublicationType>/g)].map((m) => m[1]),
      mesh: [...block.matchAll(/<DescriptorName[^>]*>([^<]+)<\/DescriptorName>/g)].map((m) => m[1]),
      abstract,
      conclusion: concl ?? (abstract ? abstract.split(/(?<=\.)\s+/).slice(-2).join(" ") : null),
    });
  }
  return out;
}

export const pubmedUrl = (pmid: string) => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
