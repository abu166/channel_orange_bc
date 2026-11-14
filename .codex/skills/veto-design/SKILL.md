---
name: veto-design
description: VetoHealth brand system (burgundy/cream editorial healthcare). Read DESIGN.md and PRODUCT.md before any UI work.
---
# VetoHealth design

Source of truth: **DESIGN.md** (palette with exact hex, type roles, radii 6–10px, data-viz rules, bans) and **PRODUCT.md** (user, voice, modes).
Tailwind tokens available: `bg-cream bg-surface bg-subtle bg-burgundy bg-rose bg-blush bg-blush-pale text-ink text-muted text-burgundy text-rose border-line` + status `success warning danger` + verdict tokens. Classes: `.card .btn-primary .btn-ghost .chip .field .display .eyebrow .mark`.

Checklist before finishing a file:
1. Cream page, flat surfaces, thin borders, radii 6–10px (no rounded-2xl/3xl/full on containers; `rounded-full` only for avatars/dots).
2. Headlines DM Serif Display sentence case (`.display`), body DM Sans ≥ 16px, prose ≤ 75ch, clear hierarchy heading → subtitle → body → metadata.
3. Burgundy = primary actions/brand; blush = highlights/selected; status colours only for meaning. No purple/blue/neon/gradients/glass.
4. No labels above headings, no badge above hero, no icon tiles, no identical card grids, no nested cards; prefer editorial columns, tables and hairline-divided lists.
5. Data viz flat and labelled (units, sources).
6. Minimal motion (150–250 ms state transitions only).
7. Every element serves a purpose; every state handled; 375px works; tap targets ≥ 44px; WCAG AA contrast.
