export type VideoPlatform = "youtube" | "tiktok" | "instagram" | "other";
export interface VideoLink { platform: VideoPlatform; url: string; id: string | null; handle: string | null; isValid: boolean }

/** Parse only known public platform hosts; never use the result as a fetch target. */
export function parseVideoLink(raw: string): VideoLink {
  const invalid: VideoLink = { platform: "other", url: "", id: null, handle: null, isValid: false };
  try {
    const value = raw.trim();
    if (!value || /[\\\s]/.test(value)) return invalid;
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.port) return invalid;
    const host = url.hostname.replace(/^www\./, "");
    if (!["youtube.com", "youtu.be", "m.youtube.com", "tiktok.com", "vm.tiktok.com", "instagram.com"].includes(host)) return invalid;
    url.protocol = "https:";
    url.hash = "";
    const parts = url.pathname.split("/").filter(Boolean);
    const platform = host.includes("youtube") || host === "youtu.be" ? "youtube" : host.endsWith("tiktok.com") ? "tiktok" : "instagram";
    const id = platform === "youtube" ? (host === "youtu.be" ? parts[0] : ["shorts", "embed", "live"].includes(parts[0]) ? parts[1] : url.searchParams.get("v")) : platform === "tiktok" ? parts[parts.indexOf("video") + 1] : parts[1];
    const handle = platform === "tiktok" && parts[0]?.startsWith("@") ? parts[0] : null;
    return { platform, url: url.toString(), id: platform === "tiktok" && !parts.includes("video") ? null : id || null, handle, isValid: true };
  } catch { return invalid; }
}

/** Extract a player URL only; no provider HTML is ever rendered. */
export function tikTokEmbedSrc(html: unknown): string | null {
  if (typeof html !== "string") return null;
  const src = html.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
  if (!src) return null;
  try {
    const url = new URL(src.replace(/&amp;/g, "&"));
    return url.protocol === "https:" && url.hostname === "www.tiktok.com" && !url.port && !url.username && !url.password && url.pathname.startsWith("/player/") ? url.toString() : null;
  } catch { return null; }
}

/**
 * Pilot: reads the public caption that TikTok embeds in its own video page (the page any browser loads,
 * no login). This is not an official API; it runs once per user paste, never downloads the video, and
 * can be switched off with TIKTOK_PUBLIC_CAPTIONS=off. Replace with TikTok's Display API after app approval.
 */
export function extractTikTokCaption(html: string): { caption: string; handle: string | null } | null {
  const script = html.match(/<script[^>]+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
  if (script) {
    try {
      const data = JSON.parse(script[1]);
      const item = data?.__DEFAULT_SCOPE__?.["webapp.video-detail"]?.itemInfo?.itemStruct;
      if (item && typeof item.desc === "string" && item.desc.trim()) {
        const handle = typeof item.author?.uniqueId === "string" ? `@${item.author.uniqueId}` : null;
        return { caption: item.desc.trim().slice(0, 2000), handle };
      }
    } catch { /* fall through to the narrow pattern */ }
  }
  const m = html.match(/"desc":"((?:[^"\\]|\\.){3,2000})"/);
  if (!m) return null;
  try {
    const caption = (JSON.parse(`"${m[1]}"`) as string).trim();
    return caption ? { caption, handle: null } : null;
  } catch {
    return null;
  }
}
