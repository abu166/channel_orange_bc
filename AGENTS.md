# VetoHealth — agent guide (Codex, Claude, humans)

Hackathon product: **Business Cup 2.0** (deadline 12:00, Nov 15). B2C, web only, US adults 25–45.
VetoHealth checks health claims from Reels/TikTok/labels against real PubMed evidence and checks skincare/supplement
routines for duplicate actives. Judging: 40% "does it work end-to-end in production" (real, not hardcoded; UX + code
quality — they read the repo), 20% value/retention, 15% user/problem, 15% business, 10% originality.

## Stack
Next.js 16 App Router + TypeScript + Tailwind v4 (`app/globals.css` `@theme` tokens) + framer-motion + lucide-react.
No database: user data lives in `localStorage` via `lib/store.ts`. No login. Deploy target: Vercel.

## Map
- `lib/types.ts` — shared contracts. Do not change field names without updating every consumer.
- `lib/extract.ts` claim extraction · `lib/pubmed.ts` NCBI E-utilities adapter · `lib/assess.ts` rubric + verdict ·
  `lib/llm.ts` optional Anthropic enhancer (only when `ANTHROPIC_API_KEY` is set).
- `app/api/v1/claims/analyze/route.ts` — NDJSON streaming pipeline.
- `app/analyze`, `app/history`, `app/routine` pages · `components/` shared UI.

## Skills (read the one that matches your task before writing code)
- `.codex/skills/veto-design/SKILL.md` — visual language, components, motion rules. **Any UI work.**
- `.codex/skills/veto-safety/SKILL.md` — medical-safety and no-fabrication rules. **Any health content, rules, copy.**
- `.codex/skills/veto-verify/SKILL.md` — how to type-check, build, test and smoke the app before you finish.

## Hard rules
1. Never invent citations, PMIDs, URLs or study results. Link only to pages that certainly exist (PubMed records we
   fetched, PubMed search URLs, NIH ODS / NCCIH fact sheets, FDA pages you are sure about).
2. Never hardcode a verdict for a specific claim. Verdicts come from retrieved evidence + the rubric.
3. Surface failure honestly: provider down ⇒ "incomplete", never "no evidence exists".
4. Stay inside your assigned files; do not reformat files you don't own.
5. `npx tsc --noEmit` and `npm run build` must pass before you say you're done.
