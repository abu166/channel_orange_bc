---
name: veto-design
description: VetoHealth visual language — dark editorial "forensic lab" look, lime signal accent, serif display type, motion rules. Use for any page or component work in this repo.
---
# VetoHealth design system

**Mood:** a forensic lab report crossed with a fashion magazine. Dark ink background, bone-white text, one loud accent
(signal lime `#d7ff3a`). Big italic serif headlines, mono micro-labels, generous whitespace. Never generic SaaS.

## Tokens (Tailwind v4, defined in `app/globals.css`)
Colors: `ink` `ink-2` `ink-3` (surfaces, darkest→lighter) · `line` (hairline borders) · `bone` (text) · `mute` (secondary
text) · `signal` (accent; CTAs, focus, highlights only) · verdict colors `support` `partial` `insufficient` `misleading`
`contradict`. Fonts: `font-sans` (Inter Tight), `font-serif` (Instrument Serif — headlines), `font-mono` (JetBrains Mono — labels, data, IDs).

## Ready-made classes
`.card` (rounded-3xl surface) · `.eyebrow` (mono uppercase micro-label) · `.btn-primary` · `.btn-ghost` · `.chip` ·
`.field` (inputs/textarea) · `.display` (serif headline) · `.grid-bg` · `.glow`.

## Components (`components/ui.tsx`)
- `<Reveal delay={0.1}>` — fade/blur-in on scroll. Wrap every section and stagger children by ~0.06–0.1s.
- `<VerdictBadge verdict="misleading" stamp size="lg" />` — rubber-stamp verdict. Use `stamp` when a result first appears.
- `<SectionTitle eyebrow="02 / Routine" title={<>Your shelf, <em>decoded</em></>} sub="…" />`.

## Page recipe
```tsx
<section className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-16">
  <div className="pointer-events-none absolute inset-x-0 top-0 h-96 grid-bg" />
  <SectionTitle eyebrow="…" title={<>Headline with <em className="text-signal">accent</em></>} />
  <div className="card p-6 sm:p-8">…</div>
</section>
```
- Headline: `display text-5xl sm:text-7xl`, use `<em>` for the italic accent word.
- Labels above values: `.eyebrow`. Numbers/IDs: `font-mono`.
- Status colours always come from `VERDICTS[...]` or verdict tokens — no ad-hoc reds/greens.
- Icons: `lucide-react`, size 16–18, `strokeWidth={1.75}`.

## Motion
framer-motion only. Springs for interactive things (`stiffness ~400, damping ~30`), ease `[0.22,1,0.36,1]` for reveals.
Use `AnimatePresence` + `layout` for lists that add/remove items. Keep durations < 0.8s. Respect reduced motion (global CSS already does).

## Accessibility & responsiveness
Every input has a `<label>` (can be `sr-only`). Focus rings via `focus-visible`. Works at 375px wide: stack grids
(`grid md:grid-cols-2`), no horizontal scroll. Contrast: body text `text-bone` or `text-bone/80`, never darker than `text-mute` on ink.

## Every async action shows 4 states
pending (skeleton/spinner + what is happening), success, failure (plain-language reason + retry button), empty state.
