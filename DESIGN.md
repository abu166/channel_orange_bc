# VetoHealth: design system

Brand brief: luxury dermatology editorial × independent scientific publication × modern private healthcare × premium consumer tech. It must read as the work of an experienced human product team. Structure and navigation: `docs/IA.md`. Tokens live in `app/globals.css`; agents follow `.codex/skills/veto-design/SKILL.md`.

## Colour (official palette, exact values)
| Token | Hex | Use |
|---|---|---|
| `burgundy` (= `signal`) | #512A35 | Primary actions, active nav, key brand elements |
| `rose` (= `veto`) | #854C5C | Secondary brand, links, focus border, small accents |
| `blush` | #C99A9D | Subtle highlight strokes, secondary chart series |
| `blush-pale` (= `highlight`, `signal-soft`) | #EAD9D5 | Selected backgrounds, `.mark` highlight, quiet fills |
| `cream` (= `canvas`) | #F8F3ED | Main background for most pages |
| `ink` (= `fg`) | #292326 | Main text |
| `success` | #2F7D5B | Supported, in range, confirmed |
| `warning` | #B5701A | Partly true, needs checking |
| `danger` | #A4262C | Contradicted, outside range, errors |
Derived: `surface` #FDFAF6 (cards/inputs), `subtle` #F1E7E1 (alternating sections), `muted` #6E6266 (secondary text), `line` ink at 12%. Verdict scale: supported = success, partly true = warning, not enough evidence #56657A, misleading #C2502B, contradicted = danger. Every verdict badge carries an icon (check, half circle, question, warning, cross) so colour is never the only signal.
No purple, electric blue, neon, gradients or glassmorphism.

## Type
| Role | Face | Spec |
|---|---|---|
| Display / headings | Newsreader 500, optical sizes (`.display`) | A serif drawn for publications. Sentence case, leading 1.02, tracking -0.02em. Max 6rem. |
| Subtitle | Manrope 500 | text-lg/xl, `text-ink/80` |
| Body | Manrope 400 | 16px floor, line-height 1.6, 65–75ch |
| Labels, buttons, nav, tables | Manrope 600 | 14–15px, tabular numerals in tables |
| Metadata & annotations | Manrope 500, 13px (`.eyebrow`) | Muted. Never a kicker above a heading. |
| Identifiers | DM Mono 400 | PMIDs, DOIs, queries only |

## Shape, depth, spacing
Radii 6–10px: buttons/inputs/chips `rounded-md` (6px), cards `rounded-[10px]`. Flat surfaces with thin `border-line`; shadows only for overlays (menus, dialogs): `shadow-[0_8px_24px_-12px_rgb(41_35_38/0.18)]`. 8px spacing grid; sections `py-16 sm:py-24`; 12-column grid, max width 72rem, 16px mobile gutter. Restrained icons (lucide 18–20px, stroke 1.5), never in decorative tiles.

## Data visualisation
Flat, labelled, honest. Range bars: cream track, `success` band for the lab's printed range, ink marker for the value. Evidence ladder: verdict colours only. Charts use burgundy (primary series), blush (secondary), ink gridlines at 8%. Always label units and sources.

## Motion
Minimal and functional: 150–250 ms ease-out on state changes. Two authored moments, both on the homepage: the hero stage (Vee drops in, follows the cursor, scans viral posts and stamps them "PROOF?"; the stamp asks a question and never shows a verdict) and the Reel claim check. Character motion stays inside Vee's stage; the rest of the UI gets no section fades, marquees, pulsing dots or bounce. Everything respects `prefers-reduced-motion` (static stamps, no loop).

## Never
Generic SaaS dashboards, excessive cards or nested cards, oversized rounded containers, decorative AI illustrations, sparkle icons, labels above headings, badges above the hero headline, gradient text, glows, tiny text, em-dash-heavy copy.
