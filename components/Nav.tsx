"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { listThreads } from "@/lib/store";
import { savingsTotals, usd, SAVINGS_EVENT } from "@/lib/savings";
import { LEDGER_EVENT } from "@/lib/ledger";

/** The loop from docs/IA.md: Check → Shelf → Care → Ledger. Each area also answers to its old route. */
const AREAS = [
  { href: "/check", label: "Check", match: ["/check", "/analyze"] },
  { href: "/shelf", label: "Shelf", match: ["/shelf", "/routine"] },
  { href: "/care", label: "Care", match: ["/care", "/plans", "/labs", "/visit"] },
];

/** `compact` hides the wordmark on phones so the nav fits 375px. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-burgundy font-[family-name:var(--font-display)] text-lg font-semibold text-cream">V</span>
      <span className={`font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.02em] ${compact ? "hidden min-[440px]:inline" : ""}`}>VetoHealth</span>
    </span>
  );
}

/** Live summary of what this device has saved: money kept per year, else the number of saved checks. */
function useLedgerSummary() {
  const [label, setLabel] = useState("Ledger");
  useEffect(() => {
    const load = () => {
      const kept = savingsTotals().yearly;
      const checks = listThreads().length;
      setLabel(kept > 0 ? `${usd(kept)}/yr kept` : checks > 0 ? `${checks} saved` : "Ledger");
    };
    load();
    for (const e of [SAVINGS_EVENT, LEDGER_EVENT, "veto:store", "storage"]) window.addEventListener(e, load);
    return () => { for (const e of [SAVINGS_EVENT, LEDGER_EVENT, "veto:store", "storage"]) window.removeEventListener(e, load); };
  }, []);
  return label;
}

export default function Nav() {
  const path = usePathname();
  const ledger = useLedgerSummary();
  const active = (m: string[]) => m.some((r) => path === r || path.startsWith(`${r}/`));
  const onLedger = active(["/ledger", "/history", "/brief"]);
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/95 backdrop-blur-sm">
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="VetoHealth home" className="shrink-0"><Logo compact /></Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {AREAS.map((a) => {
            const on = active(a.match);
            return (
              <Link key={a.href} href={a.href} aria-current={on ? "page" : undefined}
                className={`relative flex min-h-11 items-center rounded-md px-2.5 text-[15px] font-semibold transition-colors sm:px-3 ${on ? "text-burgundy" : "text-ink/70 hover:text-ink"}`}>
                {a.label}
                {on && <span className="absolute inset-x-2.5 bottom-1.5 h-0.5 rounded-full bg-burgundy sm:inset-x-3" />}
              </Link>
            );
          })}
          <Link href="/ledger" aria-current={onLedger ? "page" : undefined}
            className={`ml-1 flex min-h-11 items-center gap-2 rounded-md border px-3 text-[15px] font-semibold transition-colors ${onLedger ? "border-burgundy bg-burgundy text-cream" : "border-line bg-surface text-ink hover:border-rose/60"}`}>
            <span className={`h-2 w-2 rounded-full ${onLedger ? "bg-blush" : "bg-burgundy"}`} aria-hidden="true" />
            {ledger}
          </Link>
        </div>
      </nav>
    </header>
  );
}
