# VetoHealth evaluation

Date: 2026-11-14T11:17:13.524Z

Mode (report.model_metadata.assessor): rules-v2

| Claim | Expected | Verdict | strength_label | #supporting | #contradicting | Pass |
| --- | --- | --- | --- | --- | --- | --- |
| Sunscreen prevents skin cancer. | positive | supported | Strong | 5 | 0 | yes |
| Collagen supplements improve skin elasticity. | positive | partially_supported | Moderate | 2 | 3 | yes |
| Melatonin improves sleep quality. | positive | partially_supported | Moderate | 3 | 1 | yes |
| Creatine increases muscle strength. | positive | partially_supported | Moderate | 4 | 0 | yes |
| Exercise reduces depression. | positive | supported | Strong | 6 | 1 | yes |
| Niacinamide reduces hyperpigmentation. | positive | supported | Strong | 6 | 0 | yes |
| Vitamin C prevents the common cold. | not_positive | contradicted | Weak | 2 | 1 | yes |
| Celery juice cures eczema. | not_positive | misleading | Weak | 2 | 1 | yes |
| Vaccines cause autism. | not_positive | contradicted | Moderate | 1 | 2 | yes |
| Apple cider vinegar detoxes your liver. | not_positive | misleading | Weak | 2 | 2 | yes |
| Coffee causes cancer. | not_positive | contradicted | Strong | 1 | 4 | yes |
| Rosemary oil regrows hair as well as minoxidil. | not_positive | insufficient_evidence | Very weak | 2 | 1 | yes |

- Direction accuracy: 12/12 (100.0%)
- False certainty count (expected not_positive, got positive): 0
- Abstention count (insufficient_evidence): 1
- Mean latency: 2.95 s (requests including failures; excludes pauses)
- Request/protocol errors: 0 (counted as failed cases)

## Limitations of this eval

These are 12 hand-picked claims with direction labels assigned by the team, not an expert benchmark. Spec §9.2 asks for 300+ expert-labelled claims. This measures only the first extracted claim and broad direction, not clinical accuracy, citation validity, or safety. Abstention passes a not_positive case and can inflate accuracy; inspect the abstention count. Retrieval and AI availability can change results. Reported assessor metadata may describe the configured model even when individual claims fall back to rules. Source counts reflect returned stance IDs, not necessarily proof-quality studies. Free-tier quotas and network failures affect latency and coverage.

## Error analysis and honesty notes

- **This set is not held out.** An earlier run scored 10/12. "Coffee causes cancer" came back *supported* because "associated with lower cancer risk" was read as a positive finding. We then added harm-claim direction logic (`isHarmClaim` in `lib/assess.ts`): for "X causes Y", lower-risk and no-association findings contradict and higher-risk findings support. Because the fix was made after seeing this set, the 12/12 above is a regression check, not an unbiased accuracy estimate.
- **Collagen is genuinely contested and results vary run to run.** One earlier run abstained (`insufficient_evidence`) because a 2025 meta-analysis (Am J Med) found no benefit once low-quality and industry-funded trials were excluded. Older meta-analyses were positive. PubMed's relevance ranking changes which papers make the top results.
- **Next step for a real benchmark (spec §9.2):** 300+ claims labelled by a clinician, with a held-out split, macro-F1 and per-class precision/recall.
