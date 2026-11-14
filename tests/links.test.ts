import { afterEach, describe, expect, it, vi } from "vitest";
import { parseVideoLink, tikTokEmbedSrc } from "../lib/links";
import { POST } from "../app/api/v1/links/resolve/route";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("video links", () => {
  it.each([
    ["http://www.youtube.com/watch?v=abc", "youtube", "abc", null],
    ["youtu.be/abc", "youtube", "abc", null],
    ["https://m.youtube.com/shorts/abc", "youtube", "abc", null],
    ["https://www.tiktok.com/@maya/video/123", "tiktok", "123", "@maya"],
    ["https://vm.tiktok.com/abc/", "tiktok", null, null],
    ["https://www.instagram.com/reel/abc/", "instagram", "abc", null],
  ])("parses %s", (raw, platform, id, handle) => {
    expect(parseVideoLink(raw!)).toMatchObject({ platform, id, handle, isValid: true });
    expect(parseVideoLink(raw!).url).toMatch(/^https:\/\//);
  });
  it.each(["", "junk input", "https://localhost/", "https://127.0.0.1/", "https://youtube.com.evil.com/", "https://evil.com/youtube.com", "https://youtube.com@evil.com/", "https://evil@youtube.com/", "ftp://youtube.com/", "https://youtube.com:3000/", "https://foo.tiktok.com/", "https://youtube.com\\@evil.com/"])("rejects %s", raw => {
    expect(parseVideoLink(raw).isValid).toBe(false);
  });
  it("extracts only trusted iframe sources", () => {
    expect(tikTokEmbedSrc('<iframe src="https://www.tiktok.com/player/v1/123?x=1&amp;y=2"></iframe>')).toBe("https://www.tiktok.com/player/v1/123?x=1&y=2");
    for (const src of ["https://evil.com/player/123", "https://www.tiktok.com.evil.com/player/123", "javascript:alert(1)", "https://www.tiktok.com/embed/123"]) expect(tikTokEmbedSrc(`<iframe src="${src}">`)).toBeNull();
    expect(tikTokEmbedSrc("<script>alert(1)</script>")).toBeNull();
  });
});
const request = (url: string) => new Request("https://veto.test/api/v1/links/resolve", { method: "POST", body: JSON.stringify({ url }) });
describe("official link resolver", () => {
  it("rejects arbitrary URLs without fetching", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    expect((await POST(request("https://127.0.0.1/"))).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("uses YouTube title metadata and a fixed endpoint", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ title: "A claim", author_name: "Creator" })); vi.stubGlobal("fetch", fetcher);
    expect(await (await POST(request("https://youtu.be/abc"))).json()).toMatchObject({ text: "A claim", creator: "Creator", embedHtml: null });
    expect(fetcher.mock.calls[0][0].origin).toBe("https://www.youtube.com");
    expect(fetcher.mock.calls[0][1].redirect).toBe("error");
  });
  it("returns only the TikTok player and URL handle", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ title: "Ignore caption", html: '<iframe src="https://www.tiktok.com/player/v1/123"></iframe>' })));
    expect(await (await POST(request("https://www.tiktok.com/@maya/video/123"))).json()).toMatchObject({ text: null, creator: "@maya", embedSrc: "https://www.tiktok.com/player/v1/123" });
  });
  it("reports Instagram's token requirement without fetching", async () => {
    vi.stubEnv("META_OEMBED_TOKEN", ""); const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    const response = await POST(request("https://instagram.com/reel/abc"));
    expect(response.status).toBe(400); expect(await response.json()).toMatchObject({ reason: "instagram_needs_token", text: null }); expect(fetcher).not.toHaveBeenCalled();
  });
  it("reports provider failure honestly", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    const response = await POST(request("https://youtu.be/abc"));
    expect(response.status).toBe(502); expect(await response.json()).toMatchObject({ error: "provider_unavailable" });
  });
});
