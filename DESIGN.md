# VetoHealth: design system

Brand brief: luxury dermatology editorial × independent scientific publication × modern private healthcare × premium consumer tech. It must read as the work of an experienced human product team. Tokens live in `app/globals.css`; agents follow `.codex/skills/veto-design/SKILL.md`.

## Colour (official palette, exact values)
| Token | Hex | Use |
|---|---|---|
| `burgundy` (= `signal`) | #512A35 | Primary actions, active nav, key brand elements |
| `rose` (= `veto`) | #854C5C | Secondary brand, links, focus border, small accents |
| `blush` | #C99A9D | Subtle highlight strokes, secondary chart series |
| `blush-pale` (= `highlight`, `signal-soft`) | #EAD9D5 | Selected backgrounds, `.mark` highlight, quiet fills |
| `cream` (= `canvas`) | #F8F3ED | Main background for most pages |
| `ink` (= `fg`) | #292326 | Main text |
| `success` | #54765E | Supported, in range, confirmed |
| `warning` | #B77A35 | Partly true, needs checking |
| `danger` | #A84D50 | Misleading, outside range, errors |
Derived: `surface` #FDFAF6 (cards/inputs), `subtle` #F1E7E1 (alternating sections), `muted` #6E6266 (secondary text), `line` ink at 12%, `insufficient` #7A6E72, `contradict` #7A2E33.
No purple, electric blue, neon, gradients or glassmorphism.

## Type
| Role | Face | Spec |
|---|---|---|
| Display / headings | DM Serif Display 400 (`.display`) | Sentence case, leading 1.05, tracking -0.01em. Max 6rem. |
| Subtitle | DM Sans 500 | text-lg/xl, `text-ink/80` |
| Body | DM Sans 400 | 16px floor, line-height 1.6, 65–75ch |
| Labels, buttons, nav, tables | DM Sans 500/600 | 14–15px, tabular numerals in tables |
| Metadata & annotations | DM Sans 500, 13px (`.eyebrow`) | Muted. Never a kicker above a heading. |
| Identifiers | DM Mono 400 | PMIDs, DOIs, queries only |

## Shape, depth, spacing
Radii 6–10px: buttons/inputs/chips `rounded-md` (6px), cards `rounded-[10px]`. Flat surfaces with thin `border-line`; shadows only for overlays (menus, dialogs): `shadow-[0_8px_24px_-12px_rgb(41_35_38/0.18)]`. 8px spacing grid; sections `py-16 sm:py-24`; 12-column grid, max width 72rem, 16px mobile gutter. Restrained icons (lucide 18–20px, stroke 1.5), never in decorative tiles.

## Data visualisation
Flat, labelled, honest. Range bars: cream track, `success` band for the lab's printed range, ink marker for the value. Evidence ladder: verdict colours only. Charts use burgundy (primary series), blush (secondary), ink gridlines at 8%. Always label units and sources.

## Motion
Minimal and functional: 150–250 ms ease-out on state changes. One authored moment on the homepage (the Reel claim check). No section fades, marquees, pulsing dots or bounce.

## Never
Generic SaaS dashboards, excessive cards or nested cards, oversized rounded containers, decorative AI illustrations, sparkle icons, labels above headings, badges above the hero headline, gradient text, glows, tiny text, em-dash-heavy copy.
