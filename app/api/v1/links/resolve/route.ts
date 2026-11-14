import { NextResponse } from "next/server";
import { extractTikTokCaption, parseVideoLink, tikTokEmbedSrc } from "../../../../../lib/links";

const BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const isTikTokHost = (u: string) => { try { const h = new URL(u).hostname; return h === "tiktok.com" || h.endsWith(".tiktok.com"); } catch { return false; } };

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
  if (link.platform === "instagram" && !process.env.META_OEMBED_TOKEN) {
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
      return NextResponse.json({ platform: link.platform, text: pub?.caption ?? null, creator: pub?.handle ?? link.handle, embedSrc: tikTokEmbedSrc(data.html), source: pub ? "public_page_caption" : null });
    }
    return NextResponse.json({ platform: link.platform, text: link.platform === "instagram" && typeof data.caption === "string" ? data.caption.trim() || title : title || null, creator, embedHtml: null });
  } catch {
    return NextResponse.json({ error: "provider_unavailable", message: "The video provider could not respond. Retry, or drop the video or a screenshot." }, { status: 502 });
  }
}
