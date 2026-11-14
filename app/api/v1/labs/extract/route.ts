import { extractText, getDocumentProxy } from "unpdf";
export const runtime = "nodejs";
const fail = (error: string, status: number) => Response.json({ error }, { status });
export async function POST(request: Request) {
  try {
    // Bound the multipart envelope too, before allocating a report buffer.
    if (Number(request.headers.get("content-length")) > 9 * 1024 * 1024) return fail("PDF must be 8 MB or smaller.", 413);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.type !== "application/pdf") return fail("Choose a PDF file.", 400);
    if (file.size > 8 * 1024 * 1024) return fail("PDF must be 8 MB or smaller.", 413);
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (new TextDecoder().decode(bytes.slice(0, 4)) !== "%PDF") return fail("This file is not a valid PDF.", 400);
    let doc;
    try {
      doc = await getDocumentProxy(bytes);
      const result = await extractText(doc, { mergePages: true });
      if (!result.text.trim()) return fail("This PDF has no readable text layer. Upload a photo instead for on-device text recognition.", 422);
      return Response.json({ text: result.text, pages: result.totalPages }, { headers: { "Cache-Control": "no-store" } });
    } finally { await doc?.loadingTask.destroy(); }
  } catch { return fail("Could not read this PDF. It may be damaged or password protected. Try another PDF or upload a photo instead.", 400); }
}
