# VetoHealth information architecture (v2)

Source of truth for structure, navigation, copy logic and calls to action. Visual rules live in `DESIGN.md`.

## Promise
**Check it before you buy it.** Claims, products and lab results, checked against published research, then a licensed clinician when you want one.

## The loop (the whole product in four words)
**CHECK → SHELF → CARE → LEDGER**

| Area | Route (canonical) | Old route kept working | Job | Primary action |
|---|---|---|---|---|
| Check | `/check` | `/analyze` | One smart input for anything you saw or are about to buy. Modes: Claim · Screenshot · Reel/TikTok · Product label. Claims → verdict report. Product label → added to Shelf. | **Check this claim** (only place besides the home hero) |
| Shelf | `/shelf` | `/routine` | Products you use: overlaps, cautions, shelf cost, price of proof. | **Add a product** |
| Care | `/care` | `/plans` (redirects) | Three clinician services + memberships in one comparison. Booking flows: `/labs` (lab review / consult), `/visit` (home skin check). | **Book** (per service) |
| Ledger | `/ledger` | `/history` | Everything saved on this device: checks, living verdicts, creators, money kept, appointments, doctor brief (`/brief`), profile, export / import / delete. | **Export ledger** / open items |

Secondary, footer only: Expert review `/expert` (clinicians), Pitch deck `/deck`, How verdicts work (section on Home).

## Navigation
`VetoHealth` · **Check** · **Shelf** · **Care** · **Ledger** pill (shows money kept per year once > $0, otherwise saved-item count). No separate CTA button in the nav. Mobile: the same 4 items as a bottom-safe horizontal row.

## Accounts and privacy (the logic, stated once, everywhere the same)
- **No account to check. Ever.** That is the free product.
- **Your Ledger lives on this device** (browser storage), private by default. Copy: "No sign-up. Your ledger stays on this device."
- **Optional profile** (first name, skin type, goals) only personalises copy and the doctor brief. Stored locally.
- **Export / Import** the ledger as a JSON file to move devices; **Delete everything** wipes it (spec §8.2 deletion).
- **Contact details only when you book Care**, because a clinician has to reach you.
- **Memberships** are billed at launch; in the pilot, choosing a plan is recorded with the booking, no card.

## Call-to-action rules
1. One primary action per screen (burgundy button). Everything else is a quiet link or chip.
2. The words "Check this claim" appear only on the Check page submit button and the home hero input button.
3. Example claims are chips that run immediately; they never repeat CTA text.
4. Cross-links follow the loop only: Check → "Add to Shelf" / "Discuss with a clinician"; Shelf → "Grade my shelf" / "Ask a pharmacist in Care"; Care → "Book"; Ledger → "Open", "Export".

## Home (max five sections)
1. **Hero**: promise, smart input (+ example chips), Vee.
2. **The loop**: four connected steps (Check, Shelf, Care, Ledger), each with a live mini preview (uses the visitor's own Ledger data when present, an example otherwise) and one link.
3. **See it work** (burgundy band): the Reel demo.
4. **Care preview**: three services with price, time and what you get; one link to Care.
5. **How verdicts work**: the five-verdict scale with badges, three rubric facts, sources; privacy line.
