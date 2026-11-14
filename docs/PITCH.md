# VetoHealth · Business Cup 2.0

Ten slides for Track 01 MONEY; prices follow `lib/pricing.ts`.
Clinical services remain a pilot without payments, confirmed appointments or clinician dispatch.

## 1. VetoHealth

- Check before you buy.
- Evidence → routine → licensed clinician.

## 2. Money leaks on health guesses

- Spending pain is a hypothesis; customer interviews come next.
- Market facts and source links come from `MARKET_FACTS` in `lib/pricing.ts`.

## 3. Meet Maya, 31

- Synthetic persona: $80/month on skincare and supplements, not a measured average.
- She wants evidence before spending again.
- Overlapping actives create questions for a pharmacist or dermatologist.

## 4. From claim to clinician

- `/analyze`: extraction → live PubMed → stance reading → rubric → sources.
- `/routine`: editable labels, overlapping actives and spending.
- `/labs` and `/visit`: device-local pilot requests for licensed care.
- `/brief`: printable doctor context connecting checks to paid consults.

<details>
<summary>Features and delivery status</summary>

- **Money kept:** user-reported skipped purchases, stored on this device; savings are not guaranteed.
- **Share verdict:** share a verdict summary with its evidence-search link.
- **Expert review:** `/expert` supports demo review decisions and a local audit trail.
- **Price of proof, in development:** routine evidence per dollar, graded live by our engine.
- **Living verdicts:** stale claims automatically re-check when History opens, showing study and verdict changes.
- **Creator track record:** evidence summaries labelled “from your checks,” without judging honesty.
- **Doctor brief:** printable shelf, labs and spending context for paid consults.

Automatic re-checks run while History is open; no scheduled background monitoring or notifications exist.
Expert identities are unverified; demo decisions do not establish clinician-reviewed labels.
The `/deck` route contains the ten-slide presentation and print layout.

</details>

## 5. Money you can see

- Money kept records purchases users decided to skip.
- Price of proof compares evidence per dollar; routine integration is in development.
- Overlap spend shows monthly costs for products sharing active ingredients.

User-reported spending does not establish product safety or guaranteed savings.

## 6. What we sell

| Plan | Monthly | Twelve months | Individual-service value | Annual saving |
| --- | ---: | ---: | ---: | ---: |
| Free | $0 | $0 | $0 | $0 |
| Lab Plus | $9 | $108 | $160 | $52 |
| Skin Plus | $29 | $348 | $458 | $110 |
| Whole Health | $34 | $408 | $618 | $210 |

Lab Plus cancels anytime; Skin Plus and Whole Health require twelve months, billed monthly.
One home visit costs $129; Skin Plus includes two yearly visits plus follow-ups.
Plan benefits are pilot offers; enforced quotas and paid entitlements are not asserted.

<details>
<summary>Services and financial assumptions</summary>

| Service | Price | Assumed cost breakdown | Contribution |
| --- | ---: | --- | ---: |
| Written lab review, within 24 h | $10 | Clinician ≈5 min $5 + secure platform/payments $1 | $4 |
| Lab results video consult, 15 min | $20 | Clinician time + notes $12 + secure video/platform/payments $2 | $6 |
| Home skin check, 45 min | $129 | Clinician incl. travel ≈75 min $72 + travel $12 + shared ≈$15k pro equipment kit allocation $9 + written report/doctor-picked routine $8 + booking/insurance/payments $8 | $20 |
| Skin video follow-up, 15 min | $20 | Clinician time + notes $12 + secure video/platform/payments $2 | $6 |

Home equipment: digital dermatoscope for mole mapping; skin-imaging camera for hydration, oil, pigmentation, wrinkles and pores; UV camera for hidden sun damage. Licensed partner clinicians deliver clinical services; the app does not diagnose or prescribe.

**Membership unit economics — all costs, utilisation, CAC and lifetimes are assumptions.** Annual revenue assumes twelve paid months, including for cancel-anytime Lab Plus. Cost to serve uses expected utilisation, not full benefit redemption.

| Plan | Revenue/member/year | Cost to serve/year | Contribution/year = revenue − cost | Lifetime | Contribution LTV = contribution × lifetime | CAC | LTV/CAC |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Lab Plus | $108 | $55 | $53 | 2 years | $106 | $45 | 2.36× |
| Skin Plus | $348 | $259 | $89 | 2.5 years | $222.50 | $45 | 4.94× |
| Whole Health | $408 | $314 | $94 | 2.5 years | $235 | $45 | 5.22× |

Cost assumptions: Lab Plus uses 3 consults + 2 written reviews on average + platform; Skin Plus uses 1.7 visits, 2 follow-ups, 12 photo reviews + platform; Whole Health combines Skin + Lab usage. The source describes expected utilisation as approximately 60–85% of included benefits; the listed quantities are the specific modelling assumptions. Blended $45 CAC assumes organic acquisition from the free checker and creator content.

</details>

## 7. Contribution before scale

- Annual contribution equals revenue minus expected service costs.
- Contribution LTV equals annual contribution times assumed lifetime.
- Blended CAC is assumed at $45.
- Acquisition costs and fixed overhead are excluded from contribution.

## 8. Path to annual revenue

- Scenario: $100.845M annual revenue, including $90.84M subscription ARR.
- Pay-as-you-go contributes $10.005M nonrecurring annual revenue.
- Volumes are assumptions, not a forecast or achieved traction.

<details>
<summary>Scenario from lib/pricing.ts</summary>

| Revenue line | Assumed annual volume × price | Annual revenue |
| --- | ---: | ---: |
| Skin Plus members | 140,000 × $348/year | $48,720,000 |
| Lab Plus members | 220,000 × $108/year | $23,760,000 |
| Whole Health members | 45,000 × $408/year | $18,360,000 |
| Pay-as-you-go home skin checks | 45,000 × $129 | $5,805,000 |
| Pay-as-you-go lab video consults | 160,000 × $20 | $3,200,000 |
| Pay-as-you-go written lab reviews | 100,000 × $10 | $1,000,000 |
| **Total** | | **$100,845,000 ≈ $100.8M** |

- **405,000 members ≈ 405k ≈ 0.45% of ≈90M US adults aged 25–44**, using the rounded Census market fact on slide 2. These are assumed distinct paying members, not achieved penetration.
- The source calls this a “$100M ARR scenario”: $100M means annual revenue, not profit or valuation. Strictly, subscription ARR is **$90.84M**; **$10.005M** is assumed annual pay-as-you-go revenue, which is nonrecurring.
- Applying the assumed costs above gives **$28.35M membership contribution + $2.26M pay-as-you-go contribution = $30.61M/year**, a **30.4% contribution margin (roughly 31%)** before acquisition costs and fixed overhead.
- Assumed home-visit demand at modelled utilisation: 185,000 Skin Plus/Whole Health members × 1.7 visits + 45,000 pay-as-you-go visits = 359,500 visits/year. Partner capacity and city density must support this volume.

</details>

## 9. Proof it works

- Live PubMed retrieval and transparent rubric verdicts support source inspection.
- `docs/EVAL.md` records 12/12 broad-direction regression passes, not clinical accuracy.
- Money kept, sharing and the expert demo workspace extend the workflow.
- UI verification remains with Claude; no commercial traction is claimed.

<details>
<summary>Evidence limits</summary>

The evaluation set is small, team-labelled and not held out; earlier errors informed fixes.
Abstention can pass; provider failures remain incomplete rather than implying no evidence exists.
Clinical interpretation belongs to licensed partners; the app never diagnoses or prescribes.

</details>

## 10. Why we can't be copied

- **Verdict graph:** claims × studies × creators × products × outcomes
- **Living evidence:** science changes, versioned verdicts follow
- **Human layer:** clinician-reviewed labels, equipped in-person visits
- **Your own data loop:** shelf/labs/money → brief → paid-care

The ask: Stripe, clinician partners, HIPAA-ready backend and legal review.

<details>
<summary>Moat strategy and launch gates</summary>

The verdict graph grows with every check; defensibility remains a hypothesis.
Living evidence extends saved versions with automatic re-checks as science changes.
Clinician-reviewed labels require a verified expert workflow, beyond today's local demo decisions.
Equipped home visits require licensed partners; no clinician is dispatched in this prototype.
Personal shelf, labs and money kept feed a printable brief, then optional paid care.
Stripe, secure clinical infrastructure and legal review must precede clinical launch.
No HIPAA compliance, guaranteed savings or validated creator accuracy is claimed.

</details>
