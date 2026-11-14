import { aiStatus } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/v1/ai/status: is the AI layer reachable? Never returns secrets. */
export async function GET() {
  return Response.json(await aiStatus(), { headers: { "cache-control": "no-store" } });
}
