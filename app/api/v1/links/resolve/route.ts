import { NextResponse } from "next/server";
import { extractTikTokCaption, extractYouTubeDescription, parseVideoLink, tikTokEmbedSrc } from "../../../../../lib/links";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Spoken-word transcripts via Supadata (https://docs.supadata.ai/get-transcript), a commercial transcript API for
 * YouTube, TikTok and Instagram Reels. We never download videos ourselves. Enabled when SUPADATA_API_KEY is set.
 * mode=auto: native captions first (1 credit), AI transcription otherwise (2 credits/min). 202 → poll the job.
 */
async function supadataTranscript(url: string): Promise<string | null> {
  const key = process.env.SUPADATA_API_KEY;
  if (!key) return null;
  const headers = { "x-api-key": key };
  const asText = (c: unknown) => (typeof c === "string" ? c : Array.isArray(c) ? c.map((s: { text?: string }) => s?.text ?? "").join(" ") : "").replace(/\s+/g, " ").trim();
  try {
    const q = new URLSearchParams({ url, text: "true", mode: "auto" });
    const first = await fetch(`https://api.supadata.ai/v1/transcript?${q}`, { headers, signal: AbortSignal.timeout(40_000), cache: "no-store" });
    if (first.status === 200) { const t = asText((await first.json())?.content); return t || null; }
    if (first.status !== 202) { console.warn(`[supadata] HTTP ${first.status}`); return null; }
    const jobId = (await first.json())?.jobId;
    if (typeof jobId !== "string") return null;
    const deadline = Date.now() + 45_000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1500));
      const poll = await fetch(`https://api.supadata.ai/v1/transcript/${encodeURIComponent(jobId)}`, { headers, signal: AbortSignal.timeout(10_000), cache: "no-store" });
      if (!poll.ok) return null;
      const job = await poll.json();
      if (job?.status === "completed") { const t = asText(job.content); return t || null; }
      if (job?.status === "failed") { console.warn(`[supadata] job failed: ${String(job.error).slice(0, 120)}`); return null; }
    }
    return null;
  } catch {
    return null;
  }
}

const BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const isTikTokHost = (u: string) => { try { const h = new URL(u).hostname; return h === "tiktok.com" || h.endsWith(".tiktok.com"); } catch { return false; } };

/** YouTube: title comes from official oEmbed; the description from the public watch page (one request). */
async function youTubeDescription(id: string | null) {
  if (!id || process.env.YOUTUBE_PUBLIC_DESCRIPTIONS === "off") return null;
  try {
    const page = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(8000), cache: "no-store", headers: { "user-agent": BROWSER_UA, "accept-language": "en-US,en;q=0.9" } });
    return page.ok ? extractYouTubeDescription(await page.text()) : null;
  } catch {
    return null;
  }
}

/** Pilot (see lib/links.ts): one request to the public video page; short links are resolved first, hosts re-checked. */
async function tikTokPublicCaption(url: string) {
  if (process.env.TIKTOK_PUBLIC_CAPTIONS === "off") return null;
  try {
    let target = url;
    if (/^https:\/\/(vm|vt)\.tiktok\.com\//.test(target)) {
      const hop = await fetch(target, { redirect: "manual", signal: AbortSignal.timeout(6000), headers: { "user-agent": BROWSER_UA } });
      const next = hop.headers.get("location");
      if (!next || !isTikTokHost(next)) return null;
      target = next;
    }
    const page = await fetch(target, { signal: AbortSignal.timeout(8000), cache: "no-store", headers: { "user-agent": BROWSER_UA, "accept-language": "en-US,en;q=0.9" } });
    if (!page.ok || !isTikTokHost(page.url || target)) return null;
    return extractTikTokCaption(await page.text());
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let raw: unknown;
  try { raw = (await request.json())?.url; } catch { /* invalid JSON */ }
  const link = parseVideoLink(typeof raw === "string" ? raw : "");
  if (!link.isValid) return NextResponse.json({ error: "invalid_link", message: "Paste a YouTube, TikTok or Instagram link." }, { status: 400 });
  if (link.platform === "other") return NextResponse.json({ error: "unsupported" }, { status: 400 });
  const spoken = await supadataTranscript(link.url);
  if (link.platform === "instagram" && !process.env.META_OEMBED_TOKEN) {
    if (spoken) return NextResponse.json({ platform: link.platform, text: spoken, creator: null, embedHtml: null, source: "transcript" });
    return NextResponse.json({ platform: link.platform, text: null, reason: "instagram_needs_token" }, { status: 400 });
  }
  const endpoint = new URL(link.platform === "youtube" ? "https://www.youtube.com/oembed" : link.platform === "tiktok" ? "https://www.tiktok.com/oembed" : "https://graph.facebook.com/v19.0/instagram_oembed");
  endpoint.searchParams.set("url", link.url);
  if (link.platform === "youtube") endpoint.searchParams.set("format", "json");
  if (link.platform === "instagram") endpoint.searchParams.set("access_token", process.env.META_OEMBED_TOKEN!);
  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(8000), redirect: "error", cache: "no-store" });
    if (!response.ok) throw new Error("Provider unavailable");
    const data = await response.json();
    const title = typeof data.title === "string" ? data.title.trim() : null;
    const creator = typeof data.author_name === "string" ? data.author_name : null;
    if (link.platform === "tiktok") {
      const pub = await tikTokPublicCaption(link.url);
      const text = [pub?.caption, spoken].filter(Boolean).join("\n\n") || null;
      return NextResponse.json({ platform: link.platform, text, creator: pub?.handle ?? link.handle, embedSrc: tikTokEmbedSrc(data.html), source: spoken ? "transcript" : pub ? "public_page_caption" : null });
    }
    if (link.platform === "youtube") {
      const description = spoken ? null : await youTubeDescription(link.id);
      const text = [title, spoken ?? description].filter(Boolean).join("\n\n") || null;
      return NextResponse.json({ platform: link.platform, text, creator, embedHtml: null, source: spoken ? "transcript" : description ? "title_and_description" : "title" });
    }
    return NextResponse.json({ platform: link.platform, text: typeof data.caption === "string" ? data.caption.trim() || title : title || null, creator, embedHtml: null });
  } catch {
    return NextResponse.json({ error: "provider_unavailable", message: "The video provider could not respond. Retry, or drop the video or a screenshot." }, { status: 502 });
  }
}
