---
name: veto-verify
description: How to check VetoHealth work before finishing — type-check, unit tests, production build, and an API smoke test.
---
# Verify before you say "done"

```bash
npx tsc --noEmit            # types
npm test                    # vitest unit tests (tests/*.test.ts)
npm run build               # must succeed — this is what Vercel runs
```
API smoke test (dev server on :3000):
```bash
curl -sN -X POST localhost:3000/api/v1/claims/analyze -H 'content-type: application/json' \
  -d '{"text":"Collagen supplements reduce wrinkles. Celery juice cures eczema.","content_type":"text"}' | head -c 2000
```
Expect NDJSON lines: `stage` → `claims` → `claim_done` (per claim) → `done`.

Rules: fix errors you introduced; if a failure is in a file you don't own, report it instead of rewriting that file.
Never commit `.env*` files or API keys.
