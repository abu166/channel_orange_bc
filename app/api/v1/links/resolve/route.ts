import { NextResponse } from "next/server";
import { parseVideoLink, tikTokEmbedSrc } from "../../../../../lib/links";

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
    if (link.platform === "tiktok") return NextResponse.json({ platform: link.platform, text: null, creator: link.handle, embedSrc: tikTokEmbedSrc(data.html) });
    return NextResponse.json({ platform: link.platform, text: link.platform === "instagram" && typeof data.caption === "string" ? data.caption.trim() || title : title || null, creator, embedHtml: null });
  } catch {
    return NextResponse.json({ error: "provider_unavailable", message: "The video provider could not respond. Retry, or drop the video or a screenshot." }, { status: 502 });
  }
}
