---
name: veto-safety
description: Medical-safety, honesty and no-fabrication rules for VetoHealth health content, ingredient rules, verdict logic and UI copy. Use whenever writing anything a user reads about health.
---
# VetoHealth safety rules (from the VetoHealth technical spec §8)

1. **Educational only.** Never diagnose, prescribe, give doses, or tell users to start/stop/change medication or supplements.
   Phrase guidance as "worth asking a pharmacist/dermatologist about", "commonly advised to separate", "evidence suggests".
2. **No fabricated sources.** Allowed links: PubMed records we actually fetched (`https://pubmed.ncbi.nlm.nih.gov/<PMID>/`),
   PubMed search URLs (`https://pubmed.ncbi.nlm.nih.gov/?term=<encoded>`), NIH ODS fact sheets
   (`https://ods.od.nih.gov/factsheets/<Name>-Consumer/`, e.g. VitaminA, VitaminD, Iron, Calcium, Zinc, Magnesium, VitaminE),
   NCCIH herb pages (`https://www.nccih.nih.gov/health/<herb>` e.g. st-johns-wort, green-tea, ashwagandha, turmeric).
   When unsure a page exists, use a PubMed search URL instead.
3. **Unknown ≠ safe.** Unrecognised ingredients are flagged "unrecognised — not assessed", never guessed.
4. **Don't assume absent values.** If concentration/dose is missing, say it's missing; don't fill it in.
5. **Separate truth from safety.** A claim's evidence verdict and its safety notes are different fields.
6. **Abstain when thin.** Fewer than 2 relevant human studies, or retrieval failure ⇒ `insufficient_evidence` and
   `retrieval_complete` reflects reality.
7. **Confidence wording:** "evidence strength (uncalibrated)", never "% chance this is true" or "90% accurate".
8. **Escalation copy** for urgent symptoms: "If you have chest pain, trouble breathing, or severe allergic reaction, call 911."
9. Demo data must be synthetic. Never log user-entered text to analytics or the console.

## Clinical services (home skin visits, lab consults, subscription plans)
10. Clinical services are delivered by **licensed partner clinicians** (board-certified dermatologists / NPs for skin, licensed physicians or NPs for labs). The app books and organises; it never diagnoses or treats.
11. Lab results: show each value next to **the lab's own printed reference range** only. Never invent a reference range, never convert units without a validated rule, never say "you have X". Out-of-range ⇒ "outside the lab's range — discuss in your consult". Every extracted field must be user-confirmable/correctable before it is saved (spec §5.5), low-confidence fields highlighted.
12. Critical-value escalation copy: "Some values may need prompt attention. If you feel unwell, contact your doctor today or call 911 in an emergency."
13. Product recommendations in plans are chosen **by the clinician after the analysis**, never auto-prescribed by AI. Show "doctor-selected" vs "AI suggestion".
14. Pilot honesty: no real payments are taken and no clinician is dispatched in this prototype. Label booking/checkout as "Pilot — request stored on this device; payment via Stripe on launch". Use synthetic data for every demo report.
