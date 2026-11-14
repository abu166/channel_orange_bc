# VetoHealth — Business Cup 2.0 pitch script

Pricing and financial figures below are proposed business assumptions, not traction or deployed entitlements. Demo only behavior verified in the current build.

## 1. Your feed makes promises. Ask for receipts.

- VetoHealth helps US adults aged 25–45 examine health claims from short videos and labels.
- A confident recommendation can omit population, dose, uncertainty and contradictory findings.
- We connect the claim to evidence and make overlapping routine ingredients visible.

Speaker note: Open with a synthetic claim, not a fabricated customer story. Position the product as educational support for a better question to a clinician.

## 2. The person behind the shelf

- Initial audience: adults actively buying skincare and supplements after seeing social content.
- Their job: decide whether a claim deserves attention before spending money or changing a routine.
- Start with English-language skincare and supplement workflows.
- Validate demand through interviews and observed repeat use; no traction claimed today.

Speaker note: This addresses the 15% audience criterion. Narrow the first acquisition segment to people already comparing multiple product labels.

## 3. Show the product working

- Paste a claim and inspect extracted statements and retained qualifiers once the claim flow is integrated.
- Show real retrieved PubMed sources and both evidence directions, only after production verification.
- Open Routine check and load four clearly synthetic products.
- Show duplicate actives, timing cautions, editable label OCR and browser persistence.

Speaker note: Prioritize the 40% working-product criterion. Run the production smoke test before the pitch; if retrieval fails, show the incomplete state honestly. Never substitute hardcoded study results.

## 4. How a verdict earns its place

- Intended pipeline: extract → PubMed search → contradiction search → rubric → verdict.
- Versioned contracts preserve original text, qualifiers, queries and source provenance.
- Five verdict categories include explicit abstention for inadequate evidence.
- Study design and stance inform an uncalibrated evidence-strength assessment.

Speaker note: Open actual code and a fetched source. Exact rubric weights belong to the implemented assessor; avoid promising clinical accuracy or completion of concurrent work before checking it.

## 5. A shelf that brings people back

- Current loop: add products → review overlaps → return when the shelf changes.
- Proposed monitoring loop: save claims → evidence update → alert → re-check the routine.
- Measure activation, four-week repeat checks and useful-alert engagement.
- Evidence-change alerts require future scheduling, persistence and consent infrastructure.

Speaker note: Address the 20% value and retention criterion. Alerts are a roadmap commitment to test, not an existing capability. Avoid manufacturing anxiety to generate visits.

## 6. What we sell

- Proposed Free: 3 checks/day.
- Proposed Plus: $7.99/month or $59/year.
- Plus package: unlimited checks, routine monitoring, evidence-changed alerts and label scanning.
- Current prototype has no billing or enforced plan gates; label scanning is available in the routine demo.

Speaker note: Sell continuing evidence context. Test willingness to pay before building paid infrastructure. “Unlimited” needs sustainable abuse controls and measured provider costs.

## 7. A market model with visible assumptions

- Assumption: 90 million US adults in the broad 25–45 target band; this is a modeling input, not a sourced census estimate.
- Assumption: 30% regularly act on skincare/supplement content → 27 million serviceable prospects.
- At $59/year: broad subscription TAM = 90M × $59 = $5.31B; narrower SAM = 27M × $59 = $1.593B.
- Scenario: 1% of that SAM pays → 270,000 subscribers × $59 = $15.93M annual recurring revenue.

Speaker note: Separate addressable interest from willingness to pay. These inputs must be replaced with sourced demographic data and validated purchase behavior before investment decisions.

## 8. The $100M ARR path and unit economics

- Assumption: 70% annual / 30% monthly mix → annual revenue per paid user = 0.7 × $59 + 0.3 × ($7.99 × 12) = $70.064.
- $100M ARR requires approximately 1.43 million paid users at that mix, roughly 5.3% of the assumed 27M SAM.
- Target assumptions: 80% gross margin, 4% monthly churn, $35 paid CAC.
- Simplified gross-profit LTV = ($70.064 / 12 × 80%) / 4% ≈ $117; LTV/CAC ≈ 3.3; payback ≈ 7.5 months.
- Validate acquisition costs, retention and inference/retrieval costs; these are targets, not measured economics.

Speaker note: Address the 15% business criterion directly. This is a scale scenario, not a forecast. Annual renewals, refunds and cohort differences will require a more detailed model.

## 9. Alternatives and our bet

- Users can search PubMed or NIH resources directly; our bet is a simpler claim-to-evidence workflow.
- General assistants offer conversational answers; we aim to expose retrieval completeness, qualifiers and both evidence directions explicitly.
- Ingredient-checker and evidence-subscription categories address adjacent needs; verify named competitor capabilities before a public comparison.
- Our originality hypothesis joins claim checking with the user's own skincare and supplement shelf.

Speaker note: Address the 10% originality criterion without claiming unique invention or unsupported superiority. Study users switching between existing tools and test whether the combined workflow matters.

## 10. What the judges should remember

- Working-product proof: run the live flow, inspect real sources, then inspect the routine engine and tests.
- Value: useful evidence context at the moment a user encounters a claim or changes a shelf.
- Business: a testable $59/year subscription hypothesis with explicit retention and CAC targets.
- Next milestones: verify production pipeline, interview target users, measure repeat use, validate payment intent and build consent-based monitoring.

Speaker note: Close with the product, not an unverified metric. Show current limitations alongside the next measurable milestone. Educational only; no diagnosis or treatment advice.
