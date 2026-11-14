# VetoHealth

Turn health claims from your feed into a transparent PubMed evidence check, and spot duplicate ingredients in your routine.

**Live demo: https://vetohealth.vercel.app** · Pitch deck: [docs/VetoHealth_Pitch.pdf](docs/VetoHealth_Pitch.pdf) (also at https://vetohealth.vercel.app/deck)

## How it works — 30 seconds

Paste a claim → AI extracts separate checkable statements → live PubMed search finds relevant studies, including a dedicated no-effect search → AI reads retrieved conclusions → a transparent, versioned rubric decides the verdict. **AI reads, the rubric decides.** Without an AI key, extraction and stance reading use rules; PubMed retrieval remains live.

Reports show sources on both sides, missing qualifiers, evidence strength (uncalibrated), limitations and retrieval completeness. The routine checker flags duplicate ingredients and active classes, with editable label OCR and browser-local history.

## Features

- Live PubMed checks, versioned rubric verdicts, incomplete states and shareable verdict summaries.
- Routine overlap spend, editable label OCR and browser-local history.
- Money kept ledger records spending users decided to skip, without guaranteed savings.
- Expert review workspace supports demo decisions and an audit trail, without verified clinician identities.

<details>
<summary>New features and integration status</summary>

- **Price of proof:** routine evidence per dollar, graded live by our engine.
- **Living verdicts:** stale saved claims automatically re-check when History opens, preserving study and verdict changes.
- **Creator track record:** evidence summaries labelled “from your checks,” never judgments of honesty.
- **Doctor brief:** printable context connecting free checks, shelf, labs and money kept to paid consults.

Automatic re-checks run while History is open; no scheduled background monitoring or notifications exist.

</details>

## Why we can't be copied

These are moat hypotheses, not established defensibility.

- **Verdict graph:** claims × studies × creators × products × outcomes, growing with every check.
- **Living evidence:** re-check verdicts as science changes, retaining versioned history.
- **Human layer:** clinician-reviewed labels and equipped in-person visits, requiring licensed partners.
- **Your own data loop:** shelf, labs and money kept → doctor brief → paid care.

The expert workspace currently records demo reviews only; it does not certify clinician-reviewed labels.
The launch ask: Stripe, clinician partners, a HIPAA-ready backend and legal review.

## Paid services (pilot)

Prices and plan benefits come from [lib/pricing.ts](lib/pricing.ts). Clinical services are intended to be delivered by licensed partner clinicians; VetoHealth organises information and booking, without diagnosing or prescribing. **Pilot — request stored on this device; payment via Stripe on launch.** A request is not a confirmed appointment.

- `/labs`: pilot flow to upload a blood-test PDF/photo, confirm or correct extracted values, then request a **$20, 15-minute video consult** with a licensed physician or nurse practitioner. Values must retain the lab's own reference ranges; personal interpretation belongs to the clinician.
- `/visit`: pilot **$129, 45-minute home skin check** with a licensed dermatology clinician using a digital dermatoscope, skin-imaging camera and UV camera, followed by a doctor-selected routine. Intended pilot coverage: **Austin, NYC, LA and Miami**, subject to partner availability.
- Pay-as-you-go also includes a **$10 written lab review within 24 h** and a **$20, 15-minute skin video follow-up**.
- `/plans`: **Free — $0, free forever**, with 3 claim checks/day, routine checking, lab upload/ranges and pay-as-you-go access. **Lab Plus — $9/month, cancel anytime**: 6 lab video consults + 4 written reviews/year, same-lab trends, retest reminders, extra consults $12 instead of $20. **Skin Plus — $29/month, 12-month plan billed monthly**: 2 home skin checks + 4 video follow-ups + 12 clinician-reviewed photo check-ins/year, doctor-selected routine, unlimited claim checks/label scans, extra home visits $99 instead of $129. **Whole Health — $34/month, 12-month plan billed monthly**: both plans' included services, priority booking and $4/month less than buying both. These are pilot offers, not live paid entitlements; enforced quotas are not asserted here.

| Plan | Cost for 12 months | Included-service pay-as-you-go value | Yearly savings |
| --- | ---: | ---: | ---: |
| Free | $0 | $0 | $0 |
| Lab Plus | $108 | $160 | $52 |
| Skin Plus | $348 | $458 | $110 |
| Whole Health | $408 | $618 | $210 |

**Why $129 vs $29/month?** $129 is one home visit, paid once. Skin Plus is $29 a month for 12 months: $348 a year for 2 home visits, 4 video follow-ups and 12 photo check-ins. Bought one by one, that is $458.

Service cost allocations are assumptions: written review $5 clinician + $1 platform/payments + $4 margin = $10; lab video consult and skin video follow-up each $12 clinician + $2 video/platform/payments + $6 margin = $20; home check $72 clinician including travel + $12 travel + $9 equipment allocation + $8 report/doctor-picked routine + $8 booking/insurance/payments + $20 margin = $129. Home equipment is a shared ≈$15k kit with digital dermatoscope, skin-imaging camera and UV camera.

Membership economics are assumptions, with $45 CAC per plan. Contribution/year = annual revenue − annual cost to serve; LTV = contribution × assumed lifetime.

| Plan | Revenue/year | Cost to serve/year | Contribution/year | Lifetime | Contribution LTV | LTV/CAC |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Lab Plus | $108 | $55 | $53 | 2 years | $106 | 2.36× |
| Skin Plus | $348 | $259 | $89 | 2.5 years | $222.50 | 4.94× |
| Whole Health | $408 | $314 | $94 | 2.5 years | $235 | 5.22× |

Assumed usage: Lab Plus 3 consults + 2 written reviews + platform; Skin Plus 1.7 visits + 2 follow-ups + 12 photo reviews + platform; Whole Health combines Skin + Lab usage. Twelve paid months are assumed for annual revenue; Lab Plus can be cancelled earlier. CAC assumes organic acquisition from the free checker and creator content. Contribution excludes acquisition costs and fixed overhead; these are not measured results.

The source's **$100M ARR scenario** assumes the following annual volumes:

| Revenue line | Assumed volume × price | Annual revenue |
| --- | ---: | ---: |
| Skin Plus | 140,000 × $348 | $48,720,000 |
| Lab Plus | 220,000 × $108 | $23,760,000 |
| Whole Health | 45,000 × $408 | $18,360,000 |
| Pay-as-you-go home checks | 45,000 × $129 | $5,805,000 |
| Pay-as-you-go lab video consults | 160,000 × $20 | $3,200,000 |
| Pay-as-you-go written reviews | 100,000 × $10 | $1,000,000 |
| **Total** | | **$100,845,000 ≈ $100.8M** |

This is annual revenue, not profit or valuation: **$90.84M subscription ARR + $10.005M nonrecurring pay-as-you-go annual revenue**. Assumed distinct members total **405k**, approximately **0.45% of ≈90M US adults 25–44** ([rounded Census population estimates](https://www.census.gov/programs-surveys/popest.html), as recorded in MARKET_FACTS). Assumed contribution is **$30.61M/year**, a **30.4% margin (roughly 31%)** before acquisition costs and fixed overhead. All volumes and costs are assumptions; no traction is claimed. See [the pitch](docs/PITCH.md) for sourced problem facts and pilot caveats.

The `/plans`, `/labs` and `/visit` pages and lab-extraction API are implemented; UI verification remains with Claude. Lab fields are editable and individually confirmable before saving; the home-visit flow reviews concerns, address, time and contact details and supports local cancellation and calendar export. Booking helpers store requests locally; generated slots do not establish clinician availability. Use synthetic reports for demos. Home visits and lab consults expand beyond the original MVP scope and require licensed partners, regulatory/legal review, Stripe integration and a secure clinical backend before launch. No HIPAA compliance is claimed for this prototype.

## Routes

| Route | Purpose / status |
| --- | --- |
| `/` | Landing page |
| `/analyze` | Claim extraction and evidence report |
| `/history` | Browser-local saved claim reports |
| `/routine` | Skincare/supplement routine checker |
| `/labs` | Pilot lab upload, editable value confirmation and consult request |
| `/visit` | Pilot home skin check request, review and local cancellation |
| `/plans` | Pilot pricing and plan comparison |
| `/brief` | Printable doctor brief linking checks to paid consults |
| `/expert` | Device-local demo review workspace and decision audit trail |
| `/deck` | Ten-slide pitch with print-to-PDF layout |
| `/api/v1/claims/analyze` | Streaming claim-analysis API |
| `/api/v1/labs/extract` | Pilot lab-value extraction API |

## Screenshots

_Screenshots placeholder: claim report with both evidence directions; routine shelf with duplicate actives._

## Free AI setup

Copy `.env.example` to `.env.local`. Set **GROQ_API_KEY** ([free key](https://console.groq.com/keys)) or **GEMINI_API_KEY** ([key](https://aistudio.google.com/apikey)). See [.env.example](.env.example) for optional providers, model override and NCBI key. Keys stay server-side. With no key, the app works on rules plus live PubMed; AI failures fall back to rules.

## Verdict rules

The implementation is [lib/assess.ts](lib/assess.ts). Relevant evidence must match all key terms, or at least two-thirds for a design weighted ≥4. Weights: guidelines/meta-analyses 5, systematic reviews 4.5, randomized trials 4, clinical trials 3, observational studies 2. Animal/lab studies, case reports, narrative reviews and other unclassified designs are shown but do not count as proof.

Rules below run in order. Support share means design-weighted support divided by support plus contradiction in the relevant pool; comparisons use only comparator-mentioning evidence.

| Rule | Result |
| --- | --- |
| Retrieval did not finish | `insufficient_evidence`; marked incomplete, never “no evidence exists” |
| Comparison has no comparator-mentioning evidence | `insufficient_evidence`; a comparator mention is a heuristic, not validated head-to-head appraisal |
| Fewer than two proof-quality studies | Abstain; absolute wording with contradictory evidence can instead yield `misleading` |
| Absolute language without ≥85% support share and ≥2 strong supporting studies | `misleading` |
| ≥75% support share and ≥2 proof-quality supporters weighted ≥4 | `supported`; `partially_supported` if population and duration are missing and support weight <12 |
| ≥55% support share and ≥1 proof-quality supporter, after earlier gates | `partially_supported` |
| ≤35% support share and contradiction weight ≥4 | `contradicted` |
| Otherwise | `insufficient_evidence` |

Prevention claims focus stance reading on incidence, risk and prevention sentences, so a symptom-duration benefit does not automatically support prevention. Optional AI reads supplied conclusions; the rubric still assigns the verdict. This is heuristic evidence appraisal, not a calibrated truth probability.

## Spec test coverage

| ID | Scenario | Implementation / coverage |
| --- | --- | --- |
| F-01 | One claim | `extractClaims` → streaming assessment; extractor and assessor tests |
| F-02 | Compound split | `tests/extract.test.ts` |
| F-03 | Question/opinion not assessed | Extractor tests; heuristic limits apply |
| F-04 | Dose qualifier kept | Extractor test retains printed `200 mg` |
| F-05 | Provider down → incomplete | Assessor test; never “no evidence exists” |
| F-06 | Conflicting studies shown on both sides | Assessor source-ID test |
| F-07 | Lab upload | Originally out of scope; pilot PDF/photo extraction and editable confirmation flow added |
| F-08 | Cross-user access | No accounts; saved data stays in the browser, without cross-device sync |
| F-09 | Duplicate ingredient | Routine checker; `tests/ingredients.test.ts` |
| F-10 | Re-check creates a new version, old kept | `lib/store.ts` appends report versions; history re-check flow |

## Evaluation

Run `npm run eval` against an already running app (default `http://localhost:3001`; override with `BASE_URL`). It checks 12 fixed claims sequentially, prints a table and writes [docs/EVAL.md](docs/EVAL.md) with mode, direction accuracy, false certainty, abstentions and mean latency. That report is generated on execution; no measured result is claimed here. The set uses team labels and is not the 300+ expert-labelled benchmark requested by spec §9.2.

## Tech stack

Next.js 16 App Router, React, TypeScript, Tailwind v4, framer-motion, lucide-react and Tesseract OCR. PubMed E-utilities supplies live evidence. No database or login; saved reports and routines use `localStorage`.

## Local setup

Node.js 20.9+ and npm:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Paste a claim in Analyze or load the synthetic demo shelf in Routine. For evaluation on that port, use `BASE_URL=http://localhost:3000 npm run eval`.

Checks: `npx tsc --noEmit`, `npm test`, `npm run build`. Verify the deployed streaming flow and source links as well; passing unit tests alone does not establish successful retrieval.

## Deploy to Vercel

Import the repository, select the Next.js preset and use `npm run build`. Add optional server environment variables from `.env.example`, then deploy (production: https://vetohealth.vercel.app). Verify claim retrieval, incomplete states and OCR asset loading in production; external requests must fit hosting execution limits.

## Limitations

English-first prototype; checks at most four extracted claims from up to 6,000 input characters. Questions and opinions are filtered heuristically. Retrieval is limited to PubMed titles and abstracts, not full papers or all available evidence. Stance cues, relevance matching and comparator mentions can misclassify studies. Missing quantities remain unknown. The finite ingredient dictionary and OCR need user review; no overlap is not a safety clearance.

Saved history is local to this browser and can be cleared or accessed by someone sharing it. Claim text is sent to this app's server; derived queries go to PubMed and, when enabled, claim text and retrieved evidence go to the configured AI provider. Evidence-change alerts, synced history, Plus trials, notification-enabled waitlist enrollment, billing and scheduled monitoring are roadmap features. The home-visit pilot can save a waitlist ZIP on this device; it sends no notifications. The current pilot plan offer is Free / Lab Plus / Skin Plus / Whole Health.

## Safety

Educational only. VetoHealth does not diagnose, prescribe, give doses or recommend medication changes. Evidence verdicts and safety notes are separate. Unknown ingredients are unassessed. Ask a pharmacist, dermatologist or clinician about personal concerns. Retrieval failure means an incomplete check, not proof that no evidence exists.
