# VetoHealth design audit

Baseline: supplied desktop screenshots at 1440px and home at 390px, with source inspection. Scores describe the supplied state, not a browser-verified redesign. Vee is a working 3D interaction and the Reel card animates in a normal browser; neither blank headless capture counts as a defect.

## Scores

| Surface | Hierarchy | Memorability | Main action | Consistency | Polish | Overall |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Home desktop | 7 | 7 | 7 | 8 | 5 | 6.8 |
| Home mobile | 4 | 6 | 5 | 7 | 3 | 5.0 |
| Analyze | 7 | 4 | 8 | 8 | 6 | 6.6 |
| Routine | 5 | 4 | 5 | 8 | 5 | 5.4 |
| Labs | 6 | 4 | 6 | 8 | 5 | 5.8 |
| Plans | 4 | 4 | 5 | 8 | 5 | 5.2 |
| Dashboard | 6 | 4 | 6 | 8 | 6 | 6.0 |

**Overall: 5.8/10**, equal weight per supplied view. Credible palette and typography, but not yet a winning presentation. Award-level products establish a strong first screen, one memorable interaction, and deliberate changes in rhythm. Here the serif is doing too much of the differentiation; similar hairline sections and repeated actions flatten the experience. Mobile clipping is a more serious problem than any missing decorative flourish.

## Highest-impact fixes, ranked

1. **Home / contrast:** the Reel CTA disappears against burgundy. Use a cream outline action with cream text and an equally visible keyboard focus ring. **Implemented.**
2. **Home mobile / composition:** the capture clips the header, field and demo; Vee's allocated vertical space makes the opening feel interminable. Use shrinkable grid tracks, bounded navigation, smaller mobile scene height and a compact header action. Preserve the actual scene. **Implemented layout constraints; 375px visual verification deferred by request.**
3. **Home desktop / first screen:** the headline breaks into three heavy lines and crowds out the form. Reduce desktop display scale, give both hero tracks minmax(0, …), and tighten opening spacing. Winning pages make the promise and action readable together. **Implemented.**
4. **Plans / decision order:** a full market-statistics section separates the headline from the purchase decision. Move comparison directly after the introduction; keep research context below the service-value section. **Implemented.**
5. **Routine / competing actions:** repeated Add product buttons and a zero-filled summary make an empty tool look busy. Reserve the top action and metrics for populated shelves; make the demo invitation a distinct pale editorial panel. **Implemented; further consolidation deferred.**
6. **Dashboard / empty state:** search, filters and disabled rechecks imply work before any history exists. Hide claim controls and the living feed until a saved claim exists; keep other activity views available. **Implemented.**
7. **Labs / upload affordance:** the upload target is a faint dashed rectangle while the synthetic sample gets the strongest action. Give upload a surface fill, rose boundary and hover/focus treatment; demote sample to outline. Remove the automatic full-width heading focus rectangle while preserving keyboard focus. **Implemented.**
8. **Analyze / mobile inputs:** three text-and-icon tabs and generous desktop padding compete for narrow width. Stack icons above labels on mobile, reduce padding, and shorten the initial textarea. Keep input modes, progress and Vee panel intact. **Implemented.**
9. **Shared / type scale:** operational headings use the same grand scale as persuasive landing sections. Use a fluid 40–72px heading utility on Analyze, Labs, Plans and Dashboard; reserve the largest expression for Home. **Implemented.**
10. **Plans / comparison scanning:** recommended membership barely differs from adjacent columns. Add a quiet pale-blush header wash and match that emphasis on mobile; retain every annual commitment and allowance. **Implemented.**
11. **Shared / crafted navigation details:** footer becomes a long single-column directory on phones; homepage rows have little tactile feedback. Use a two-column mobile footer with separate safety copy and subtle hover/focus fills on destination rows. **Implemented.**
12. **Reports and lower Home / narrative rhythm:** repeated lists and long disclosures reduce momentum. Next pass: group report findings into bottom line → evidence → limitations → next action; simplify duplicated Home explanations only after checking full interactive flows. Keep real citations and uncertainty visible. **Deferred: report result screenshots and interactive verification are unavailable in this task.**

## Scope and verification

HeroScene implementation, mood/poke wiring, DemoCard timers/data/logic, health verdicts, citations, pricing and storage contracts remain intact. No new health claims or sources were introduced. Existing work in Home and Analyze was preserved through targeted edits. Brand values are unchanged; CSS additions are utilities only.

Requested checks: TypeScript and unit tests. No build, dev server or browser was run, as explicitly instructed. Layout improvements are source-reviewed, not visually certified. Follow-up should inspect 375px, keyboard navigation, real WebGL Vee, and animated Reel contrast in a GPU-enabled browser.
